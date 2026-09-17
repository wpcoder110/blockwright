import type { ReactNode } from 'react'
import { cache } from 'react'
import { type RenderContext, type ThemeLocation, type ThemeRequest, resolveTemplate } from '@blockwright/core'
import { getBlockwrightRuntime, getMenu, getRegistry, getSiteInfo, getTemplates } from '@blockwright/payload-plugin'
import { Blockwright, buildLayout } from '@blockwright/renderer'
import type { Element } from '@blockwright/schema'
import type { BasePayload } from 'payload'
import { BlockwrightNextLink, createNextImage } from './adapters'

export { BlockwrightNextImage, BlockwrightNextLink, createNextImage, toLocalSrc } from './adapters'
export type { ThemeLocation, ThemeRequest }

export type SearchParams = Record<string, string | string[] | undefined>

export interface RequestInfo {
  path: string
  searchParams?: SearchParams
  locale?: string
}

export interface ContextOptions {
  payload: BasePayload
  request: RequestInfo
  /** The document being viewed. */
  document?: { collection: string; id: string | number; data: Record<string, unknown>; url?: string }
  owner?: { collection: string; id: string | number }
  mode?: RenderContext['mode']
  user?: RenderContext['user']
  archive?: RenderContext['archive']
  /** Use plain <img>/<a> instead of next/image and next/link. */
  plainElements?: boolean
}

/** Build the render context for a request. */
export async function createRenderContext(opts: ContextOptions): Promise<RenderContext> {
  const { payload } = opts
  const [registry, { kit, site }] = await Promise.all([getRegistry(payload), getSiteInfo(payload)])
  const api = payload.config.routes?.api ?? '/api'
  return {
    registry,
    kit,
    mode: opts.mode ?? 'live',
    site,
    document: opts.document,
    owner: opts.owner,
    request: { path: opts.request.path, searchParams: opts.request.searchParams ?? {}, locale: opts.request.locale },
    user: opts.user ?? null,
    archive: opts.archive,
    formEndpoint: `${api}/bw/forms/submit`,
    components: opts.plainElements ? {} : { Image: createNextImage({ serverURL: payload.config.serverURL }), Link: BlockwrightNextLink },
    services: {
      find: async ({ collection, where, limit, sort, depth }) => {
        const res = await payload.find({ collection: collection as never, where: where as never, limit, sort, depth: depth ?? 1, overrideAccess: false })
        return { docs: res.docs as unknown as Record<string, unknown>[] }
      },
      menu: (id) => getMenu(payload, id),
      findByID: async ({ collection, id, depth }) =>
        (await payload.findByID({ collection: collection as never, id, depth: depth ?? 1, overrideAccess: false, disableErrors: true })) as Record<string, unknown> | null,
    },
  }
}

type Tag = 'div' | 'main' | 'header' | 'footer' | 'section' | 'article' | 'aside'

export interface DocumentProps extends Omit<ContextOptions, 'document' | 'owner'> {
  collection: string
  doc: Record<string, unknown> & { id: string | number }
  /** Path of the document on the site, used by dynamic "URL" values. */
  url?: string
  as?: Tag
  className?: string
  /** Field that holds the layout. Default: `layout`. */
  field?: string
}

/** Render a document's Blockwright layout (async Server Component). */
export async function BlockwrightDocument({ collection, doc, url, as = 'main', className, field = 'layout', ...rest }: DocumentProps): Promise<ReactNode> {
  const document = { collection, id: doc.id, data: doc, url: url ?? rest.request.path }
  const ctx = await createRenderContext({ ...rest, document, owner: { collection, id: doc.id } })
  const built = await buildLayout(doc[field] as Element[] | undefined, ctx)
  return <Blockwright built={built} ctx={ctx} as={as} className={className} />
}

export interface LocationProps extends Omit<ContextOptions, 'owner'> {
  location: ThemeLocation
  theme: ThemeRequest
  as?: Tag
  className?: string
  /** Rendered when no template matches. */
  fallback?: ReactNode
}

const TAG_FOR: Record<ThemeLocation, Tag> = { header: 'header', footer: 'footer', single: 'main', archive: 'main', 'error-404': 'main' }

/** Find the template for a location (header, footer…) and render it. */
export async function BlockwrightLocation({ location, theme, as, className, fallback = null, ...rest }: LocationProps): Promise<ReactNode> {
  const templates = await getTemplates(rest.payload)
  const template = resolveTemplate(templates, location, theme)
  if (!template) return fallback
  const { options } = getBlockwrightRuntime(rest.payload)
  const ctx = await createRenderContext({ ...rest, owner: { collection: options.templatesSlug, id: template.id } })
  const built = await buildLayout(template.layout as Element[] | undefined, ctx)
  if (!built.prepared.length) return fallback
  return <Blockwright built={built} ctx={ctx} as={as ?? TAG_FOR[location]} className={className} />
}

/** True when a location has a matching template (e.g. to skip your own header). */
export async function hasLocation(payload: BasePayload, location: ThemeLocation, theme: ThemeRequest): Promise<boolean> {
  return !!resolveTemplate(await getTemplates(payload), location, theme)
}

export interface FindBySlugOptions {
  payload: BasePayload
  collection: string
  slug: string
  draft?: boolean
  field?: string
}

/** Load a document by slug, deduplicated within a request. */
export const findDocumentBySlug = cache(async ({ payload, collection, slug, draft = false, field = 'slug' }: FindBySlugOptions) => {
  const res = await payload.find({
    collection: collection as never,
    where: { [field]: { equals: slug } },
    limit: 1,
    depth: 1,
    draft,
    overrideAccess: draft,
    pagination: false,
  })
  return (res.docs[0] as (Record<string, unknown> & { id: string | number }) | undefined) ?? null
})

/** Build a theme request for a single document. */
export function singularTheme(collection: string, doc: { id: string | number }, opts: { isFront?: boolean; terms?: ThemeRequest['terms'] } = {}): ThemeRequest {
  return { kind: 'singular', collection, id: doc.id, isFront: opts.isFront, terms: opts.terms }
}

export const notFoundTheme: ThemeRequest = { kind: 'not-found' }

/** Basic metadata for a Blockwright document. */
export function documentMetadata(doc: Record<string, any> | null, siteName?: string) {
  if (!doc) return {}
  const title = [doc.meta?.title ?? doc.title, siteName].filter(Boolean).join(' | ')
  const description = doc.meta?.description ?? doc.excerpt ?? undefined
  return { title, description }
}
