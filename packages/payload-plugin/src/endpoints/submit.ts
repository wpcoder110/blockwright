import { getDefinitionDefaults } from '@blockwright/core'
import { processSubmission, type FormServices } from '@blockwright/forms/server'
import { findElement, type Element } from '@blockwright/schema'
import type { Endpoint, PayloadRequest } from 'payload'
import type { BlockwrightRuntime } from '../types'

const hits = new Map<string, number[]>()

function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  }
  return list.length > max
}

async function readBody(req: PayloadRequest): Promise<{ body: Record<string, unknown>; json: boolean }> {
  const type = (req.headers.get('content-type') ?? '').split(';')[0]!.trim()
  const text = (await req.text?.()) ?? ''
  if (text.length > 200_000) throw Object.assign(new Error('Payload too large'), { status: 413 })
  if (type === 'application/json') {
    const parsed = text ? JSON.parse(text) : {}
    return { body: parsed && typeof parsed === 'object' ? parsed : {}, json: true }
  }
  if (type === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(text)
    const body: Record<string, unknown> = {}
    for (const key of new Set(params.keys())) {
      const all = params.getAll(key)
      body[key] = key.endsWith('[]') ? all : all[0]
    }
    return { body, json: false }
  }
  throw Object.assign(new Error('Unsupported content type'), { status: 415 })
}

const safeReturn = (value: unknown) => {
  const s = typeof value === 'string' ? value : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/'
}

export function submitEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/forms/submit',
    method: 'post',
    handler: async (req) => {
      const { options, registry } = rt
      const payload = req.payload
      let parsed: { body: Record<string, unknown>; json: boolean }
      try {
        parsed = await readBody(req)
      } catch (err) {
        const status = (err as { status?: number }).status ?? 400
        return Response.json({ success: false, message: 'Invalid request' }, { status })
      }
      const { body, json } = parsed
      const respond = (status: number, data: { success: boolean; message: string; errors?: Record<string, string>; redirect?: string }, elementId = '') => {
        if (json) return Response.json(data, { status })
        const target = data.redirect ?? `${safeReturn(body._bw_return)}${safeReturn(body._bw_return).includes('?') ? '&' : '?'}bw_form=${encodeURIComponent(elementId)}&bw_status=${data.success ? 'success' : 'error'}`
        return new Response(null, { status: 303, headers: { Location: target } })
      }

      const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      const ip = forwarded || req.headers.get('x-real-ip') || 'unknown'
      const limit = options.forms.rateLimit === false ? null : (options.forms.rateLimit ?? { max: 10, windowMs: 60_000 })
      if (limit && rateLimited(ip, limit.max, limit.windowMs)) {
        return respond(429, { success: false, message: 'Too many submissions. Please wait a minute and try again.' })
      }

      const ref = String(body._bw_ref ?? '')
      const [collection, docId, elementId] = ref.split(':')
      const allowed = [...options.collections, options.templatesSlug]
      if (!collection || !docId || !elementId || !allowed.includes(collection)) {
        return respond(400, { success: false, message: 'Unknown form' })
      }

      const doc = (await payload
        .findByID({ collection: collection as never, id: docId, depth: 0, draft: false, overrideAccess: true, disableErrors: true })
        .catch(() => null)) as Record<string, unknown> | null
      if (!doc || (doc._status && doc._status !== 'published')) return respond(404, { success: false, message: 'Unknown form' }, elementId)
      const element = findElement((doc.layout as Element[]) ?? [], elementId)
      const def = registry.get('form')
      if (!element || element.elType !== 'widget' || (element as { widgetType?: string }).widgetType !== 'form' || !def) {
        return respond(404, { success: false, message: 'Unknown form' }, elementId)
      }
      const settings = { ...getDefinitionDefaults(def, registry.controls(def)), ...(element.settings ?? {}) } as Record<string, any>

      // submissions faster than a human could type are treated as spam
      const elapsed = Number(body._bw_elapsed)
      if (json && Number.isFinite(elapsed) && elapsed < 1500) {
        return respond(200, { success: true, message: 'Thanks!' }, elementId)
      }

      const site = (await payload.findGlobal({ slug: options.kitSlug as never, depth: 0, overrideAccess: true }).catch(() => null)) as Record<string, any> | null
      const summaryOf = (fields: Array<{ value: string | string[] }>) =>
        fields
          .map((f) => (Array.isArray(f.value) ? f.value.join(', ') : f.value))
          .filter(Boolean)
          .slice(0, 3)
          .join(' · ')
          .slice(0, 120)

      // with no recipient configured anywhere, notify the first admin user
      let fallbackTo = options.forms.emailTo
      if (!fallbackTo && !settings.email_to) {
        const userSlug = payload.config.admin?.user ?? 'users'
        const first = await payload
          .find({ collection: userSlug as never, limit: 1, sort: 'createdAt', depth: 0, overrideAccess: true, pagination: false })
          .catch(() => null)
        const email = (first?.docs[0] as { email?: string } | undefined)?.email
        if (email) fallbackTo = email
      }

      const services: FormServices = {
        siteName: site?.siteName,
        siteUrl: site?.siteUrl,
        defaultEmailTo: fallbackTo,
        defaultEmailFrom: options.forms.emailFrom,
        defaultEmailFromName: options.forms.emailFromName ?? site?.siteName,
        webhookSecret: options.forms.webhookSecret,
        emailAccent: Array.isArray(site?.colors) ? site.colors.find((c: { colorId?: string }) => c.colorId === 'primary')?.color : undefined,
        entryUrl: (entryId) => `${payload.config.serverURL ?? ''}${payload.config.routes?.admin ?? '/admin'}/collections/${options.submissionsSlug}/${entryId}`,
        log: (message, error) => payload.logger.error({ err: error, msg: message }),
        sendEmail: async (m) =>
          payload.sendEmail({ to: m.to, cc: m.cc, bcc: m.bcc, from: m.from, replyTo: m.replyTo, subject: m.subject, html: m.html, text: m.text }),
        saveSubmission: async (record) => {
          const created = await payload.create({
            collection: options.submissionsSlug as never,
            overrideAccess: true,
            data: {
              summary: summaryOf(record.fields) || record.meta.formName,
              formName: record.meta.formName,
              elementId: record.meta.elementId,
              status: 'new',
              answers: record.fields.map((f) => ({ fieldId: f.id, label: f.label, value: Array.isArray(f.value) ? f.value.join(', ') : f.value })),
              values: record.values,
              source: {
                collection: String(record.meta.owner.collection),
                docId: String(record.meta.owner.id),
                pageUrl: record.meta.pageUrl,
                referer: record.meta.referer,
                userAgent: record.meta.userAgent,
                ip: options.forms.storeIp ? record.meta.ip : undefined,
              },
            } as never,
          })
          return { id: (created as { id: string | number }).id }
        },
        updateSubmission: (id, data) =>
          payload.update({ collection: options.submissionsSlug as never, id, data: data as never, overrideAccess: true }),
        createDocument: async (slug, data) => {
          if (!(options.forms.allowedCollections ?? []).includes(slug)) {
            throw new Error(`Collection "${slug}" is not allowed. Add it to forms.allowedCollections in the plugin options.`)
          }
          return payload.create({ collection: slug as never, data: data as never, overrideAccess: true })
        },
      }

      const pageUrl = typeof body._bw_page === 'string' ? body._bw_page.slice(0, 500) : (req.headers.get('referer') ?? undefined)
      const result = await processSubmission({
        settings,
        input: body,
        services,
        meta: {
          formName: String(settings.form_name || 'Form'),
          elementId,
          owner: { collection, id: docId },
          pageUrl,
          referer: req.headers.get('referer')?.slice(0, 500) ?? undefined,
          userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? undefined,
          ip,
          userId: req.user?.id,
        },
      })
      return respond(result.status, { success: result.success, message: result.message, errors: result.errors, redirect: result.redirect }, elementId)
    },
  }
}
