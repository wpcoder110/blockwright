import { CORE_TAGS, createRegistry } from '@blockwright/core'
import { ENTRY_TAGS, formElements } from '@blockwright/forms'
import { basicElements } from '@blockwright/widgets-basic'
import { type CollectionConfig, type Config, type Field, type PayloadRequest, definePlugin } from 'payload'
import { menusCollection } from './collections/menus'
import { submissionsCollection } from './collections/submissions'
import { templatesCollection } from './collections/templates'
import { widgetsCollection } from './collections/widgets'
import { demoEndpoint } from './demo'
import { importEndpoint, menuEndpoint, registryEndpoint } from './endpoints/admin'
import { printEntryEndpoint } from './endpoints/print'
import { submitEndpoint } from './endpoints/submit'
import { kitGlobal } from './kit'
import { withLayout } from './layoutField'
import type { BlockwrightCollectionConfig, BlockwrightPluginConfig, BlockwrightRuntime, ResolvedOptions } from './types'

export type {
  BlockwrightCollectionConfig,
  BlockwrightPluginConfig,
  BlockwrightPluginOptions,
  BlockwrightRuntime,
  CollectionOverride,
  FieldsOverride,
  GlobalOverride,
  ResolvedOptions,
} from './types'
export { documentUrl, getBlockwrightRuntime, getCustomWidgetSpecs, getMenu, getRegistry, getSiteInfo, getTemplates, type SiteInfo, type StoredTemplate } from './runtime'
export { invalidateBlockwrightCache } from './cache'
export { kitFromDoc } from './kit'
export { cleanHtml, sanitizeLayout } from './sanitize'
export { editButtonField, layoutField, LAYOUT_FIELD } from './layoutField'
export { TEMPLATE_TYPES } from './collections/templates'
export { MENUS_SLUG } from './collections/menus'
export { installDemoContent, type DemoResult } from './demo'

/** Apply a `fields` override from the plugin options. */
export const applyOverride = <T extends { fields: Field[] }>(base: T, override?: { fields?: (args: { defaultFields: Field[] }) => Field[] } & Record<string, unknown>): T => {
  if (!override) return base
  const { fields, ...rest } = override
  return { ...base, ...rest, fields: fields ? fields({ defaultFields: base.fields }) : base.fields } as T
}

function resolveOptions(opts: BlockwrightPluginConfig, config: Config): ResolvedOptions {
  const userSlug = config.admin?.user ?? 'users'
  const existing = config.collections ?? []
  const hasMedia = existing.some((c) => c.slug === 'media' && c.upload)
  const requested: Array<[string, BlockwrightCollectionConfig]> = Array.isArray(opts.collections)
    ? opts.collections.map((slug) => [String(slug), {}])
    : opts.collections
      ? Object.entries(opts.collections).map(([slug, value]) => [slug, value === true ? {} : (value ?? {})])
      : existing.some((c) => c.slug === 'pages')
        ? [['pages', {}]]
        : []

  const collectionConfig: ResolvedOptions['collectionConfig'] = {}
  for (const [slug, cfg] of requested) {
    const collection = existing.find((c) => c.slug === slug)
    const hasSlugField = !!collection?.fields.some((f) => 'name' in f && f.name === 'slug')
    collectionConfig[slug] = { public: cfg.public ?? hasSlugField, field: cfg.field ?? 'layout', url: cfg.url }
  }

  return {
    collections: requested.map(([slug]) => slug),
    collectionConfig,
    templatesSlug: 'bw-templates',
    kitSlug: 'bw-site-style',
    submissionsSlug: 'bw-form-entries',
    menusSlug: 'bw-menus',
    widgetsSlug: 'bw-widgets',
    mediaCollection: opts.uploadCollection ?? (hasMedia ? 'media' : false),
    adminGroup: opts.adminGroup ?? 'Blockwright',
    forms: opts.forms ?? {},
    onChange: opts.onChange,
    previewUrl: ({ collection, doc }) => {
      const cfg = collectionConfig[collection]
      if (cfg?.url) return cfg.url(doc)
      const slug = typeof doc.slug === 'string' ? doc.slug : null
      if (!slug) return null
      return slug === 'home' ? '/' : `/${slug.replace(/^\/+/, '')}`
    },
    canUseUnfilteredHtml:
      opts.canUseUnfilteredHtml ??
      ((req: PayloadRequest) => {
        const user = req.user as ({ collection?: string; roles?: unknown } & Record<string, unknown>) | null
        if (!user || user.collection !== userSlug) return false
        return Array.isArray(user.roles) ? user.roles.includes('admin') : true
      }),
  }
}

/**
 * Blockwright: visual page and theme builder for Payload.
 *
 * ```ts
 * plugins: [blockwrightPlugin({ collections: ['pages'] })]
 * ```
 */
export const blockwrightPlugin = definePlugin<BlockwrightPluginConfig>({
  slug: 'blockwright',
  plugin: ({ config: incoming, plugins: _plugins, ...opts }) => {
    const options = resolveOptions(opts as BlockwrightPluginConfig, incoming)
    const registry = createRegistry(
      [...basicElements, ...formElements, ...((opts as BlockwrightPluginConfig).elements ?? [])],
      [...CORE_TAGS, ...ENTRY_TAGS, ...((opts as BlockwrightPluginConfig).tags ?? [])],
    )
    const rt: BlockwrightRuntime = { registry, options }
    const o = opts as BlockwrightPluginConfig

    const existing = incoming.collections ?? []
    const missing = options.collections.filter((slug) => !existing.some((c) => c.slug === slug))
    if (missing.length) {
      console.warn(`[blockwright] These collections were not found and will not get a layout field: ${missing.join(', ')}`)
    }

    const generated: CollectionConfig[] = [
      applyOverride(templatesCollection(rt), o.templatesOverrides),
      applyOverride(submissionsCollection(rt), o.formEntriesOverrides),
      applyOverride(menusCollection(rt), o.menusOverrides),
      applyOverride(widgetsCollection(rt), o.widgetsOverrides),
    ]

    const config: Config = {
      ...incoming,
      collections: [...existing.map((c) => (options.collections.includes(c.slug) ? withLayout(c, rt) : c)), ...generated],
      globals: [...(incoming.globals ?? []), applyOverride(kitGlobal(rt), o.siteStyleOverrides)],
      custom: { ...incoming.custom, blockwright: rt },
    }
    if (o.disabled) return config

    config.endpoints = [
      ...(incoming.endpoints ?? []),
      submitEndpoint(rt),
      registryEndpoint(rt),
      importEndpoint(rt),
      demoEndpoint(rt),
      printEntryEndpoint(rt),
      menuEndpoint(),
    ]
    config.admin = {
      ...incoming.admin,
      components: {
        ...incoming.admin?.components,
        beforeDashboard: [...(incoming.admin?.components?.beforeDashboard ?? []), 'blockwright/rsc#BlockwrightWelcome'],
        afterNavLinks: [...(incoming.admin?.components?.afterNavLinks ?? []), 'blockwright/rsc#BlockwrightNavLink'],
        views: {
          ...incoming.admin?.components?.views,
          blockwrightEditor: { Component: 'blockwright/rsc#BlockwrightEditorView', path: '/blockwright/edit/:collection/:id' },
          blockwrightPrint: { Component: 'blockwright/rsc#BlockwrightPrintView', path: '/blockwright/print/:id' },
          blockwrightOverview: { Component: 'blockwright/rsc#BlockwrightOverviewView', path: '/blockwright' },
        },
      },
    }
    return config
  },
})

export default blockwrightPlugin
