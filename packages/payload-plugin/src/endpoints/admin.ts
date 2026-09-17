import { parseTemplateEnvelope } from '@blockwright/schema'
import type { Endpoint } from 'payload'
import type { BlockwrightRuntime } from '../types'
import { getMenu, getRegistry } from '../runtime'

const unauthorized = () => Response.json({ message: 'You must be logged in.' }, { status: 401 })

/** Widget and dynamic-tag metadata for the editor. */
export function registryEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/registry',
    method: 'get',
    handler: async (req) => {
      if (!req.user) return unauthorized()
      const registry = await getRegistry(req.payload).catch(() => rt.registry)
      return Response.json({
        categories: registry.categories(),
        elements: registry.all().map((d) => ({
          type: d.type,
          elType: d.elType,
          title: d.title,
          description: d.description,
          icon: d.icon,
          category: d.category,
          keywords: d.keywords ?? [],
          interactive: !!d.interactive,
          sections: d.sections,
        })),
        tags: registry.tags().map(({ resolve: _r, ...t }) => t),
      })
    },
  }
}

/** Import an exported template file (Blockwright or compatible page-builder JSON). */
export function importEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/templates/import',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return unauthorized()
      const text = (await req.text?.()) ?? ''
      let input: unknown
      try {
        input = JSON.parse(text)
      } catch {
        return Response.json({ message: 'The file is not valid JSON.' }, { status: 400 })
      }
      const wrapper = input as { template?: unknown; target?: string; title?: string; slug?: string }
      const parsed = parseTemplateEnvelope(wrapper.template ?? input)
      if (!parsed.success) return Response.json({ message: 'The file could not be imported.', errors: parsed.errors }, { status: 400 })
      const env = parsed.data!
      const target = wrapper.target && rt.options.collections.includes(wrapper.target) ? wrapper.target : rt.options.templatesSlug
      const knownTypes = ['header', 'footer', 'single', 'single-page', 'single-post', 'archive', 'search-results', 'error-404', 'section', 'page', 'popup', 'pdf']
      const data =
        target === rt.options.templatesSlug
          ? { title: wrapper.title ?? env.title, type: knownTypes.includes(env.type) ? env.type : 'section', layout: env.content, pageSettings: env.page_settings, _status: 'draft' }
          : { title: wrapper.title ?? env.title, slug: wrapper.slug, layout: env.content, _status: 'draft' }
      const doc = await req.payload.create({ collection: target as never, data: data as never, draft: true, req, overrideAccess: false })
      return Response.json({ id: (doc as { id: unknown }).id, collection: target }, { status: 201 })
    },
  }
}

/** Resolved menu items (public; menus are site navigation). */
export function menuEndpoint(): Endpoint {
  return {
    path: '/bw/menus/:id',
    method: 'get',
    handler: async (req) => {
      const id = String(req.routeParams?.id ?? '')
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return Response.json({ message: 'Invalid menu' }, { status: 400 })
      const items = await getMenu(req.payload, id)
      if (!items) return Response.json({ message: 'Menu not found' }, { status: 404 })
      return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
    },
  }
}
