import type { BasePayload, Endpoint } from 'payload'
import { invalidateBlockwrightCache } from '../cache'
import { getBlockwrightRuntime } from '../runtime'
import type { BlockwrightRuntime } from '../types'
import { contactLayout, footerLayout, headerLayout, homeLayout, notFoundLayout, pdfLayout } from './layouts'

export { contactLayout, footerLayout, headerLayout, homeLayout, notFoundLayout, pdfLayout }

export interface DemoResult {
  pages: string[]
  templates: string[]
  skipped: string[]
}

type AnyCollection = { config: { fields: Array<{ name?: string }>; versions?: { drafts?: unknown } } }

/**
 * Install demo content: site style, a home page, a quote form page, and
 * header, footer and 404 templates. Safe to run again; demo documents are replaced.
 */
export async function installDemoContent(payload: BasePayload, opts: { collection?: string; siteUrl?: string } = {}): Promise<DemoResult> {
  const { options } = getBlockwrightRuntime(payload)
  const result: DemoResult = { pages: [], templates: [], skipped: [] }
  const slugOf = options.templatesSlug as never

  await payload.updateGlobal({
    slug: options.kitSlug as never,
    overrideAccess: true,
    data: {
      siteName: 'Rangrez Textiles',
      siteDescription: 'Hand block-printed textiles from Lahore',
      ...(opts.siteUrl ? { siteUrl: opts.siteUrl } : {}),
      colors: [
        { colorId: 'primary', title: 'Indigo', color: '#1e2a4a' },
        { colorId: 'secondary', title: 'Slate', color: '#5b6b8c' },
        { colorId: 'text', title: 'Text', color: '#2a2f3a' },
        { colorId: 'accent', title: 'Teal', color: '#0f766e' },
      ],
      typography: [
        { typoId: 'primary', title: 'Headings', fontFamily: 'Sora', fontWeight: '600', lineHeight: 1.15 },
        { typoId: 'secondary', title: 'Labels', fontFamily: 'Manrope', fontWeight: '600' },
        { typoId: 'text', title: 'Body', fontFamily: 'Manrope', fontWeight: '400', lineHeight: 1.65 },
        { typoId: 'accent', title: 'Buttons', fontFamily: 'Manrope', fontWeight: '600' },
      ],
      containerWidth: 1140,
      elementGap: 20,
      fontProvider: 'google',
    } as never,
  })

  const collectionSlug = opts.collection ?? options.collections[0]
  const collection = collectionSlug ? ((payload.collections as Record<string, AnyCollection>)[collectionSlug] ?? null) : null
  if (collection) {
    const hasSlug = collection.config.fields.some((f) => f.name === 'slug')
    const hasTitle = collection.config.fields.some((f) => f.name === 'title')
    const drafts = !!collection.config.versions?.drafts
    const pages: Array<[string, string, unknown]> = [
      ['home', 'Home', homeLayout()],
      ['contact', 'Request a quote', contactLayout()],
    ]
    for (const [slug, title, layout] of pages) {
      const data: Record<string, unknown> = { layout }
      if (hasTitle) data.title = title
      if (hasSlug) data.slug = slug
      if (drafts) data._status = 'published'
      const existing = hasSlug
        ? await payload.find({ collection: collectionSlug as never, where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
        : { docs: [] }
      if (existing.docs[0]) {
        await payload.update({ collection: collectionSlug as never, id: (existing.docs[0] as { id: string | number }).id, data: data as never, overrideAccess: true })
      } else {
        await payload.create({ collection: collectionSlug as never, data: data as never, overrideAccess: true })
      }
      result.pages.push(hasSlug ? slug : title)
    }
    if (!hasSlug) result.skipped.push(`"${collectionSlug}" has no slug field, so the demo pages cannot be opened by URL`)
  } else {
    result.skipped.push('No Blockwright collection found for demo pages')
  }

  // main menu (links to the demo pages when they exist)
  let menuId: string | number | undefined
  {
    const pages = collection
      ? await payload.find({ collection: collectionSlug as never, where: { slug: { in: ['home', 'contact'] } }, depth: 0, limit: 5, overrideAccess: true }).catch(() => ({ docs: [] }))
      : { docs: [] }
    const bySlug = new Map((pages.docs as Array<{ id: string | number; slug?: string }>).map((d) => [d.slug, d.id]))
    const pageItem = (label: string, slug: string, fallback: string) =>
      bySlug.has(slug) ? { label, type: 'page', doc: bySlug.get(slug) } : { label, type: 'custom', url: fallback }
    const items = [
      pageItem('Home', 'home', '/'),
      { label: 'Our process', type: 'custom', url: '/#process' },
      {
        label: 'Services',
        type: 'custom',
        url: '/contact#services',
        submenu: [
          pageItem('Request a quote', 'contact', '/contact'),
          { label: 'Custom orders', type: 'custom', url: '/contact#custom' },
          { label: 'Red Lions Tech', type: 'custom', url: 'https://redlionstech.com', newTab: true },
        ],
      },
      pageItem('Contact', 'contact', '/contact'),
    ]
    const existing = await payload.find({ collection: 'bw-menus' as never, where: { title: { equals: 'Main menu' } }, limit: 1, depth: 0, overrideAccess: true })
    const saved = existing.docs[0]
      ? await payload.update({ collection: 'bw-menus' as never, id: (existing.docs[0] as { id: string | number }).id, data: { title: 'Main menu', items } as never, overrideAccess: true })
      : await payload.create({ collection: 'bw-menus' as never, data: { title: 'Main menu', items } as never, overrideAccess: true })
    menuId = (saved as { id: string | number }).id
  }

  const templates: Array<[string, string, string[], unknown]> = [
    ['Site header', 'header', ['include/general'], headerLayout(menuId)],
    ['Site footer', 'footer', ['include/general'], footerLayout()],
    ['Not found', 'error-404', ['include/not_found404'], notFoundLayout()],
    ['Entry PDF', 'pdf', [], pdfLayout()],
  ]
  for (const [title, type, conditions, layout] of templates) {
    const data = { title, type, conditions, layout, _status: 'published' }
    const existing = await payload.find({ collection: slugOf, where: { title: { equals: title } }, limit: 1, depth: 0, overrideAccess: true })
    if (existing.docs[0]) {
      await payload.update({ collection: slugOf, id: (existing.docs[0] as { id: string | number }).id, data: data as never, overrideAccess: true })
    } else {
      await payload.create({ collection: slugOf, data: data as never, overrideAccess: true })
    }
    result.templates.push(title)
  }
  invalidateBlockwrightCache()
  return result
}

/** POST /api/bw/demo — used by the dashboard button. */
export function demoEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/demo',
    method: 'post',
    handler: async (req) => {
      const admin = req.payload.config.routes?.admin ?? '/admin'
      const wantsJson = (req.headers.get('accept') ?? '').includes('application/json')
      if (!req.user || !rt.options.canUseUnfilteredHtml(req)) {
        return wantsJson
          ? Response.json({ message: 'Only administrators can install demo content.' }, { status: 403 })
          : new Response(null, { status: 303, headers: { Location: `${admin}?bw_demo=forbidden` } })
      }
      try {
        const res = await installDemoContent(req.payload)
        return wantsJson ? Response.json(res) : new Response(null, { status: 303, headers: { Location: `${admin}?bw_demo=done` } })
      } catch (err) {
        req.payload.logger.error({ err, msg: 'Blockwright: installing demo content failed' })
        return wantsJson
          ? Response.json({ message: (err as Error).message }, { status: 500 })
          : new Response(null, { status: 303, headers: { Location: `${admin}?bw_demo=failed` } })
      }
    },
  }
}
