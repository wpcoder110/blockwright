import { CORE_TAGS, createRegistry } from '@blockwright/core'
import { ENTRY_TAGS, formElements } from '@blockwright/forms'
import { basicElements } from '@blockwright/widgets-basic'
import type { Config, Plugin, PayloadRequest } from 'payload'
import { submissionsCollection } from './collections/submissions'
import { templatesCollection } from './collections/templates'
import { widgetsCollection } from './collections/widgets'
import { menusCollection } from './collections/menus'
import { importEndpoint, menuEndpoint, registryEndpoint } from './endpoints/admin'
import { submitEndpoint } from './endpoints/submit'
import { printEntryEndpoint } from './endpoints/print'
import { demoEndpoint } from './demo'
import { kitGlobal } from './kit'
import { withLayout } from './layoutField'
import type { BlockwrightPluginOptions, BlockwrightRuntime, ResolvedOptions } from './types'

export type { BlockwrightPluginOptions, BlockwrightRuntime, ResolvedOptions } from './types'
export { documentUrl, getBlockwrightRuntime, getCustomWidgetSpecs, getMenu, getRegistry, getSiteInfo, getTemplates, type SiteInfo, type StoredTemplate } from './runtime'
export { MENUS_SLUG } from './collections/menus'
export { invalidateBlockwrightCache } from './cache'
export { kitFromDoc } from './kit'
export { cleanHtml, sanitizeLayout } from './sanitize'
export { layoutField, LAYOUT_FIELD } from './layoutField'
export { TEMPLATE_TYPES } from './collections/templates'
export { installDemoContent, type DemoResult } from './demo'

function resolveOptions(opts: BlockwrightPluginOptions, config: Config): ResolvedOptions {
  const userSlug = config.admin?.user ?? 'users'
  const hasMedia = (config.collections ?? []).some((c) => c.slug === 'media' && c.upload)
  return {
    collections: opts.collections ?? ['pages'],
    templatesSlug: opts.templates?.slug ?? 'bw-templates',
    kitSlug: opts.kit?.slug ?? 'bw-site-style',
    submissionsSlug: opts.forms?.submissionsSlug ?? 'bw-form-entries',
    mediaCollection: opts.mediaCollection ?? (hasMedia ? 'media' : false),
    adminGroup: opts.adminGroup ?? 'Blockwright',
    forms: opts.forms ?? {},
    onChange: opts.onChange,
    previewUrl: opts.previewUrl,
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
 * Blockwright for Payload.
 *
 * ```ts
 * plugins: [blockwrightPlugin({ collections: ['pages'] })]
 * ```
 */
export const blockwrightPlugin =
  (opts: BlockwrightPluginOptions = {}): Plugin =>
  (incoming: Config): Config => {
    const options = resolveOptions(opts, incoming)
    const registry = createRegistry([...basicElements, ...formElements, ...(opts.elements ?? [])], [...CORE_TAGS, ...ENTRY_TAGS, ...(opts.tags ?? [])])
    const rt: BlockwrightRuntime = { registry, options }

    const existing = incoming.collections ?? []
    const missing = options.collections.filter((slug) => !existing.some((c) => c.slug === slug))
    if (missing.length) {
      console.warn(`[blockwright] These collections were not found and will not get a layout field: ${missing.join(', ')}`)
    }

    const config: Config = {
      ...incoming,
      collections: [
        ...existing.map((c) => (options.collections.includes(c.slug) ? withLayout(c, rt) : c)),
        templatesCollection(rt),
        submissionsCollection(rt),
        menusCollection(rt),
        widgetsCollection(rt),
      ],
      globals: [...(incoming.globals ?? []), kitGlobal(rt)],
      custom: { ...incoming.custom, blockwright: rt },
    }
    if (opts.enabled === false) return config

    config.endpoints = [...(incoming.endpoints ?? []), submitEndpoint(rt), registryEndpoint(rt), importEndpoint(rt), demoEndpoint(rt), printEntryEndpoint(rt), menuEndpoint()]
    config.admin = {
      ...incoming.admin,
      components: {
        ...incoming.admin?.components,
        beforeDashboard: [...(incoming.admin?.components?.beforeDashboard ?? []), '@blockwright/payload-plugin/rsc#BlockwrightWelcome'],
        views: {
          ...incoming.admin?.components?.views,
          blockwrightEditor: {
            Component: '@blockwright/payload-plugin/rsc#BlockwrightEditorView',
            path: '/blockwright/edit/:collection/:id',
          },
          blockwrightPrint: {
            Component: '@blockwright/payload-plugin/rsc#BlockwrightPrintView',
            path: '/blockwright/print/:id',
          },
        },
      },
    }
    return config
  }

export default blockwrightPlugin
