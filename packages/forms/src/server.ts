/**
 * Server-side submission processing. Framework-agnostic: the Payload plugin
 * supplies the services (email, storage, documents).
 */
import type { FieldResult, FieldValue, FormField, FormMessages } from './types'
import { evaluateLogic, normaliseValues, readMessages, truthy, validateForm } from './validate'
import { type Notification, type ReplaceContext, type ReplaceOptions, buildNotification, emailLayout, replacePlaceholders } from './email'

export * from './email'

export * from './types'
export { validateForm, normaliseValues, readMessages } from './validate'

export interface SubmissionMeta {
  /** Set once the entry is saved. */
  entryId?: string | number
  formName: string
  elementId: string
  owner: { collection: string; id: string | number }
  pageUrl?: string
  referer?: string
  userAgent?: string
  ip?: string
  userId?: string | number
}

export interface EmailMessage {
  to: string[]
  cc?: string[]
  bcc?: string[]
  from?: string
  replyTo?: string
  subject: string
  html: string
  text: string
}

export interface ActionLogEntry {
  action: string
  status: 'success' | 'failed' | 'skipped'
  message?: string
}

export interface SubmissionRecord {
  meta: SubmissionMeta
  values: Record<string, FieldValue>
  fields: FieldResult[]
}

export interface FormServices {
  siteName?: string
  siteUrl?: string
  defaultEmailTo?: string
  defaultEmailFrom?: string
  defaultEmailFromName?: string
  webhookSecret?: string
  /** Brand color for the email layout header. */
  emailAccent?: string
  /** Admin link to an entry, for {entry_url}. */
  entryUrl?: (id: string | number) => string
  sendEmail?: (msg: EmailMessage) => Promise<unknown>
  saveSubmission?: (record: SubmissionRecord) => Promise<{ id: string | number } | void>
  updateSubmission?: (id: string | number, data: { actionLog: ActionLogEntry[]; status?: string }) => Promise<unknown>
  createDocument?: (collection: string, data: Record<string, unknown>) => Promise<unknown>
  fetch?: typeof fetch
  log?: (message: string, error?: unknown) => void
}

export interface ActionContext {
  settings: Record<string, any>
  submission: SubmissionRecord
  services: FormServices
  replace: (template: unknown, opts?: ReplaceOptions) => string
}

export interface FormAction {
  name: string
  label: string
  run: (ctx: ActionContext) => Promise<void | { redirect?: string; message?: string }>
}

export interface ProcessResult {
  success: boolean
  status: number
  message: string
  errors: Record<string, string>
  redirect?: string
  submissionId?: string | number
  actionLog: ActionLogEntry[]
  spam: boolean
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const display = (v: FieldValue) => (Array.isArray(v) ? v.join(', ') : v)

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

export function emailList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => EMAIL_RE.test(s))
}

/** Replace [all-fields], [field id="x"] and {form_name}-style tokens. */
export function createReplacer(settings: Record<string, any>, submission: SubmissionRecord, services: FormServices) {
  const context = (): ReplaceContext => ({
    formName: String(settings.form_name ?? ''),
    siteName: services.siteName,
    siteUrl: services.siteUrl,
    pageUrl: submission.meta.pageUrl,
    entryId: submission.meta.entryId,
    entryUrl: submission.meta.entryId !== undefined && services.entryUrl ? services.entryUrl(submission.meta.entryId) : undefined,
    fields: submission.fields,
  })
  return (template: unknown, opts: ReplaceOptions = {}) => replacePlaceholders(template, context(), opts)
}

function emailAction(suffix: '' | '_2', name: string, label: string): FormAction {
  return {
    name,
    label,
    async run({ settings, services, replace }) {
      if (!services.sendEmail) throw new Error('Email is not configured')
      const k = (key: string) => settings[`${key}${suffix}`]
      const toRaw = replace(k('email_to')) || (suffix === '' ? services.defaultEmailTo ?? '' : '')
      const to = emailList(toRaw)
      if (!to.length) throw new Error('No valid recipient')
      const subject = replace(k('email_subject') || (suffix ? 'We received your message' : 'New message from "{form_name}"')).replace(/[\r\n]+/g, ' ').slice(0, 250)
      const content = k('email_content') || '[all-fields]'
      const fromEmail = emailList(replace(k('email_from')) || services.defaultEmailFrom || '')[0]
      const fromName = (replace(k('email_from_name')) || services.defaultEmailFromName || services.siteName || '').replace(/["\r\n<>]/g, '')
      const replyTo = emailList(replace(k('email_reply_to')))[0]
      const footer = `\n\n—\nSent from ${submission(settings, services)}`
      await services.sendEmail({
        to,
        cc: suffix ? undefined : emailList(replace(settings.email_to_cc)),
        bcc: suffix ? undefined : emailList(replace(settings.email_to_bcc)),
        from: fromEmail ? (fromName ? `"${fromName}" <${fromEmail}>` : fromEmail) : undefined,
        replyTo,
        subject,
        html: emailLayout(replace(content, { html: true, nl2br: !/<[a-z][\s\S]*>/i.test(String(content)) }), { siteName: services.siteName, siteUrl: services.siteUrl, accent: services.emailAccent }),
        text: replace(content) + (suffix ? '' : footer),
      })
    },
  }
}

const submission = (settings: Record<string, any>, services: FormServices) =>
  [services.siteName, settings.form_name].filter(Boolean).join(' · ') || 'your website'

async function signature(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

export const BUILTIN_ACTIONS: FormAction[] = [
  {
    name: 'notifications',
    label: 'Email notifications',
    async run({ settings, services, replace, submission: sub }) {
      if (!services.sendEmail) throw new Error('Email is not configured')
      const list = (Array.isArray(settings.bw_notifications) ? settings.bw_notifications : []) as Notification[]
      const failures: string[] = []
      let sent = 0
      for (const n of list) {
        if (n.enabled === '' || n.enabled === false) continue
        if (n.bw_route && typeof n.bw_route === 'object' && !evaluateLogic(n.bw_route as never, sub.values)) continue
        const label = n.name || 'Notification'
        const to = emailList(replace(n.to) || services.defaultEmailTo || '')
        if (!to.length) {
          failures.push(`${label}: no valid recipient`)
          continue
        }
        const fromEmail = emailList(replace(n.from_email) || services.defaultEmailFrom || '')[0]
        const fromName = (replace(n.from_name) || services.defaultEmailFromName || services.siteName || '').replace(/["\r\n<>]/g, '')
        const mail = buildNotification(n, replace, { siteName: services.siteName, siteUrl: services.siteUrl, accent: services.emailAccent })
        try {
          await services.sendEmail({
            to,
            cc: emailList(replace(n.cc)),
            bcc: emailList(replace(n.bcc)),
            from: fromEmail ? (fromName ? `"${fromName}" <${fromEmail}>` : fromEmail) : undefined,
            replyTo: emailList(replace(n.reply_to))[0],
            ...mail,
          })
          sent++
        } catch (err) {
          failures.push(`${label}: ${(err as Error).message}`)
        }
      }
      if (failures.length) throw new Error(failures.join('; '))
      return { message: `${sent} sent` }
    },
  },
  emailAction('', 'email', 'Email'),
  emailAction('_2', 'email2', 'Auto-reply email'),
  {
    name: 'redirect',
    label: 'Redirect',
    async run({ settings, replace }) {
      const raw = typeof settings.redirect_to === 'object' ? settings.redirect_to?.url : settings.redirect_to
      const url = replace(String(raw ?? ''), { url: true }).trim()
      if (!url) return
      if (!/^(https?:\/\/|\/(?!\/))/i.test(url)) throw new Error('Redirect URL must be http(s) or a relative path')
      return { redirect: url }
    },
  },
  {
    name: 'webhook',
    label: 'Webhook',
    async run({ settings, submission: sub, services }) {
      const url = String(settings.webhooks ?? '').trim()
      if (!/^https?:\/\//i.test(url)) throw new Error('Webhook URL must start with http:// or https://')
      const advanced = truthy(settings.webhooks_advanced_data)
      const payload = advanced
        ? {
            form: { id: sub.meta.elementId, name: settings.form_name },
            fields: Object.fromEntries(sub.fields.map((f) => [f.id, { id: f.id, type: f.type, title: f.label, value: f.value }])),
            meta: { page_url: sub.meta.pageUrl, user_agent: sub.meta.userAgent, date: new Date().toISOString() },
          }
        : Object.fromEntries(sub.fields.map((f) => [f.label || f.id, display(f.value)]))
      const body = JSON.stringify(payload)
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'Blockwright-Forms' }
      if (services.webhookSecret) headers['X-Blockwright-Signature'] = `sha256=${await signature(services.webhookSecret, body)}`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await (services.fetch ?? fetch)(url, { method: 'POST', headers, body, signal: controller.signal, redirect: 'manual' })
        if (res.status >= 400) throw new Error(`Webhook responded with ${res.status}`)
      } finally {
        clearTimeout(timer)
      }
    },
  },
  {
    name: 'collection',
    label: 'Create document',
    async run({ settings, submission: sub, services }) {
      if (!services.createDocument) throw new Error('Document creation is not available')
      const slug = String(settings.bw_collection ?? '').trim()
      if (!slug) throw new Error('No collection selected')
      const mapping = Array.isArray(settings.bw_collection_mapping) ? settings.bw_collection_mapping : []
      const data: Record<string, unknown> = {}
      for (const m of mapping) {
        const from = String(m?.field ?? '')
        const to = String(m?.target ?? '')
        if (!from || !to || to.startsWith('_') || ['id', 'createdAt', 'updatedAt'].includes(to)) continue
        if (from in sub.values) data[to] = sub.values[from]
      }
      await services.createDocument(slug, data)
    },
  },
]

export interface ProcessOptions {
  settings: Record<string, any>
  input: Record<string, unknown>
  meta: SubmissionMeta
  services: FormServices
  actions?: FormAction[]
}

export function readActions(settings: Record<string, any>): string[] {
  const v = settings.submit_actions
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean)
  return ['save', 'email']
}

/** Validate a submission, store it and run the configured actions in order. */
export async function processSubmission({ settings, input, meta, services, actions = BUILTIN_ACTIONS }: ProcessOptions): Promise<ProcessResult> {
  const messages: FormMessages = readMessages(settings)
  const fields = (Array.isArray(settings.form_fields) ? settings.form_fields : []) as FormField[]
  const values = normaliseValues(input)
  const result = validateForm(fields, values, { messages })
  const actionLog: ActionLogEntry[] = []

  if (result.spam) {
    // pretend it worked so bots learn nothing
    return { success: true, status: 200, message: messages.success, errors: {}, actionLog, spam: true }
  }
  if (!result.valid) {
    return { success: false, status: 400, message: messages.error, errors: result.errors, actionLog, spam: false }
  }

  const record: SubmissionRecord = { meta, values: result.data, fields: result.fields }
  const enabled = readActions(settings)
  let submissionId: string | number | undefined

  if (enabled.includes('save') && services.saveSubmission) {
    try {
      const saved = await services.saveSubmission(record)
      submissionId = saved ? saved.id : undefined
      record.meta.entryId = submissionId
      actionLog.push({ action: 'save', status: 'success' })
    } catch (err) {
      services.log?.('Blockwright forms: saving the submission failed', err)
      actionLog.push({ action: 'save', status: 'failed', message: (err as Error).message })
    }
  }

  const ctx: ActionContext = { settings, submission: record, services, replace: createReplacer(settings, record, services) }
  let redirect: string | undefined
  let failed = actionLog.some((a) => a.status === 'failed')

  for (const name of enabled) {
    if (name === 'save') continue
    const action = actions.find((a) => a.name === name)
    if (!action) {
      actionLog.push({ action: name, status: 'skipped', message: 'Unknown action' })
      continue
    }
    try {
      const out = await action.run(ctx)
      if (out?.redirect) redirect = out.redirect
      actionLog.push({ action: name, status: 'success', ...(out?.message ? { message: out.message } : {}) })
    } catch (err) {
      failed = true
      services.log?.(`Blockwright forms: action "${name}" failed`, err)
      actionLog.push({ action: name, status: 'failed', message: (err as Error).message })
    }
  }

  if (submissionId !== undefined && services.updateSubmission) {
    await services.updateSubmission(submissionId, { actionLog }).catch((err) => services.log?.('Blockwright forms: updating the action log failed', err))
  }

  return {
    success: !failed,
    status: failed ? 500 : 200,
    message: failed ? messages.server : messages.success,
    errors: {},
    redirect: failed ? undefined : redirect,
    submissionId,
    actionLog,
    spam: false,
  }
}
