import { type Kit, type MenuItem, type Registry, createRegistry } from '@blockwright/core'
import { type CustomWidgetSpec, createCustomWidget } from '@blockwright/renderer'
import type { BasePayload } from 'payload'
import { cached } from './cache'
import { kitFromDoc } from './kit'
import type { BlockwrightRuntime } from './types'

export function getBlockwrightRuntime(payload: BasePayload): BlockwrightRuntime {
  const rt = (payload.config.custom as Record<string, unknown> | undefined)?.blockwright as BlockwrightRuntime | undefined
  if (!rt) throw new Error('Blockwright is not installed. Add blockwrightPlugin() to the plugins array in payload.config.ts.')
  return rt
}

export interface SiteInfo {
  kit: Kit
  site: { name?: string; description?: string; url?: string; logo?: { url?: string; alt?: string; width?: number; height?: number } }
}

/** Site style + identity, cached until the global changes. */
export function getSiteInfo(payload: BasePayload): Promise<SiteInfo> {
  const { options } = getBlockwrightRuntime(payload)
  return cached('kit', async () => {
    const doc = (await payload.findGlobal({ slug: options.kitSlug as never, depth: 1, overrideAccess: true }).catch(() => null)) as Record<string, any> | null
    const logo = doc?.logo && typeof doc.logo === 'object' ? doc.logo : undefined
    return {
      kit: kitFromDoc(doc),
      site: {
        name: doc?.siteName ?? undefined,
        description: doc?.siteDescription ?? undefined,
        url: doc?.siteUrl ?? undefined,
        logo: logo ? { url: logo.url, alt: logo.alt ?? '', width: logo.width, height: logo.height } : undefined,
      },
    }
  })
}

export interface StoredTemplate {
  [key: string]: unknown
  id: string | number
  title: string
  type: string
  conditions?: string[]
  layout?: unknown
  updatedAt?: string
}

/** Published theme templates, cached until one changes. */
export function getTemplates(payload: BasePayload): Promise<StoredTemplate[]> {
  const { options } = getBlockwrightRuntime(payload)
  return cached('templates', async () => {
    const res = await payload.find({
      collection: options.templatesSlug as never,
      where: { _status: { equals: 'published' } },
      limit: 500,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    return res.docs as unknown as StoredTemplate[]
  })
}

/** Enabled custom widgets as plain data (safe to pass to the editor). */
export function getCustomWidgetSpecs(payload: BasePayload): Promise<CustomWidgetSpec[]> {
  return cached('custom-widgets', async () => {
    if (!(payload.collections as Record<string, unknown>)['bw-widgets']) return []
    const res = await payload
      .find({ collection: 'bw-widgets' as never, where: { enabled: { not_equals: false } }, limit: 200, depth: 0, pagination: false, overrideAccess: true })
      .catch(() => ({ docs: [] }))
    return (res.docs as Array<Record<string, any>>).map((d) => ({
      type: String(d.type),
      title: String(d.title ?? d.type),
      category: d.category ?? 'custom',
      icon: d.icon ?? undefined,
      description: d.description ?? undefined,
      template: String(d.template ?? ''),
      css: d.css ?? undefined,
      definition: d.definition && typeof d.definition === 'object' ? d.definition : null,
      fields: Array.isArray(d.fields)
        ? d.fields.map((f: Record<string, any>) => ({
            name: String(f.name ?? ''),
            label: f.label ?? undefined,
            type: f.type ?? 'text',
            default: f.default ?? undefined,
            options: f.options ?? undefined,
            responsive: !!f.responsive,
            selector: f.selector ?? undefined,
            css: f.css ?? undefined,
            tab: f.tab === 'style' ? 'style' : 'content',
            section: f.section ?? undefined,
          }))
        : [],
    }))
  })
}

/** The widget registry including custom widgets from the admin. */
export function getRegistry(payload: BasePayload): Promise<Registry> {
  return cached('registry', async () => {
    const { registry } = getBlockwrightRuntime(payload)
    const specs = await getCustomWidgetSpecs(payload)
    if (!specs.length) return registry
    const custom = specs.filter((s) => !registry.get(s.type)).map((s) => {
      try {
        return createCustomWidget(s)
      } catch (err) {
        payload.logger.error({ err, msg: `Blockwright: custom widget "${s.type}" is invalid` })
        return null
      }
    })
    return createRegistry([...registry.all(), ...custom.filter((c): c is NonNullable<typeof c> => !!c)], registry.tags())
  })
}

/** Public URL of a document (menus, previews). */
export function documentUrl(payload: BasePayload, collection: string, doc: Record<string, unknown>): string | null {
  const { options } = getBlockwrightRuntime(payload)
  if (options.previewUrl) {
    const u = options.previewUrl({ collection, doc })
    if (u) return u
  }
  const slug = typeof doc.slug === 'string' ? doc.slug : null
  if (!slug) return null
  return slug === 'home' ? '/' : `/${slug.replace(/^\/+/, '')}`
}

const SAFE_URL = /^(https?:\/\/|\/|#|\?|mailto:|tel:)/i

/** A menu with every link resolved to its current URL. Cached until menus or pages change. */
export function getMenu(payload: BasePayload, id: string | number): Promise<MenuItem[] | null> {
  return cached(`menu:${id}`, async () => {
    const doc = (await payload
      .findByID({ collection: 'bw-menus' as never, id, depth: 1, overrideAccess: false, disableErrors: true })
      .catch(() => null)) as Record<string, any> | null
    if (!doc) return null
    const { options } = getBlockwrightRuntime(payload)
    const resolve = (items: unknown, depth: number): MenuItem[] => {
      if (!Array.isArray(items) || depth > 3) return []
      return items.flatMap((raw: Record<string, any>, i) => {
        if (!raw || typeof raw !== 'object' || !raw.label) return []
        let url = ''
        if (raw.type === 'custom' || !options.collections.length) {
          url = typeof raw.url === 'string' ? raw.url.trim() : ''
        } else {
          const rel = raw.doc
          const collection = rel && typeof rel === 'object' && 'relationTo' in rel ? String(rel.relationTo) : options.collections[0]!
          const target = rel && typeof rel === 'object' && 'relationTo' in rel ? rel.value : rel
          // unpublished or deleted pages are skipped
          if (!target || typeof target !== 'object') return []
          if ((target as { _status?: string })._status && (target as { _status?: string })._status !== 'published') return []
          url = documentUrl(payload, collection, target as Record<string, unknown>) ?? ''
        }
        if (url && !SAFE_URL.test(url)) url = ''
        return [
          {
            id: String(raw.id ?? `${depth}-${i}`),
            label: String(raw.label),
            url,
            newTab: !!raw.newTab,
            rel: raw.nofollow ? 'nofollow' : undefined,
            children: resolve(raw.submenu ?? raw.subitems ?? raw.children, depth + 1),
          },
        ]
      })
    }
    return resolve(doc.items, 1)
  })
}
