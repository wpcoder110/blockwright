import type { RenderContext } from './context'

export type TagGroup = 'site' | 'document' | 'archive' | 'request' | 'user' | 'media' | 'commerce' | 'forms'

export interface DynamicTagDefinition {
  name: string
  title: string
  group: TagGroup
  /** Other names this tag answers to, for imported content. */
  aliases?: string[]
  returns: Array<'text' | 'url' | 'image' | 'number' | 'color' | 'html'>
  /** Settings the editor shows for the tag. */
  settings?: Array<{ name: string; label: string; type: 'text' | 'select'; options?: string[]; default?: string }>
  resolve: (ctx: RenderContext, settings: Record<string, unknown>) => unknown | Promise<unknown>
}

export const defineTag = (t: DynamicTagDefinition) => t

/** Read a dotted path (`hero.image.url`) from an object. */
export function getPath(obj: unknown, path: string): unknown {
  if (!path) return undefined
  let cur: unknown = obj
  for (const part of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    if (Array.isArray(cur) && /^\d+$/.test(part)) cur = cur[Number(part)]
    else if (typeof cur === 'object') cur = (cur as Record<string, unknown>)[part]
    else return undefined
  }
  return cur
}

const docField = (ctx: RenderContext, ...paths: string[]) => {
  for (const p of paths) {
    const v = getPath(ctx.document?.data, p)
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

export function formatDate(value: unknown, format = 'medium', locale = 'en'): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  if (format === 'iso') return d.toISOString().slice(0, 10)
  const style = (['short', 'medium', 'long', 'full'].includes(format) ? format : 'medium') as 'short' | 'medium' | 'long' | 'full'
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

/** Turn a Payload upload value into a media value. */
export function toMedia(value: unknown): { id?: string | number; url?: string; alt?: string; width?: number; height?: number } | null {
  if (!value) return null
  if (typeof value === 'string') return { url: value }
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.url === 'string') {
      return {
        id: v.id as string | number | undefined,
        url: v.url,
        alt: typeof v.alt === 'string' ? v.alt : '',
        width: typeof v.width === 'number' ? v.width : undefined,
        height: typeof v.height === 'number' ? v.height : undefined,
      }
    }
  }
  return null
}

export const CORE_TAGS: DynamicTagDefinition[] = [
  defineTag({
    name: 'site-title',
    title: 'Site title',
    group: 'site',
    returns: ['text'],
    resolve: (ctx) => ctx.site?.name ?? '',
  }),
  defineTag({
    name: 'site-tagline',
    title: 'Site tagline',
    group: 'site',
    returns: ['text'],
    resolve: (ctx) => ctx.site?.description ?? '',
  }),
  defineTag({
    name: 'site-url',
    title: 'Site URL',
    group: 'site',
    aliases: ['site-url'],
    returns: ['url'],
    resolve: (ctx) => ctx.site?.url ?? '/',
  }),
  defineTag({
    name: 'site-logo',
    title: 'Site logo',
    group: 'site',
    returns: ['image'],
    resolve: (ctx) => ctx.site?.logo ?? null,
  }),
  defineTag({
    name: 'doc-title',
    title: 'Title',
    group: 'document',
    aliases: ['post-title', 'page-title'],
    returns: ['text'],
    resolve: (ctx) => docField(ctx, 'title', 'name') ?? '',
  }),
  defineTag({
    name: 'doc-excerpt',
    title: 'Excerpt',
    group: 'document',
    aliases: ['post-excerpt'],
    returns: ['text'],
    resolve: (ctx) => docField(ctx, 'excerpt', 'meta.description', 'description') ?? '',
  }),
  defineTag({
    name: 'doc-url',
    title: 'URL',
    group: 'document',
    aliases: ['post-url'],
    returns: ['url'],
    resolve: (ctx) => ctx.document?.url ?? ctx.request?.path ?? '',
  }),
  defineTag({
    name: 'doc-id',
    title: 'ID',
    group: 'document',
    aliases: ['post-id'],
    returns: ['text', 'number'],
    resolve: (ctx) => ctx.document?.id ?? '',
  }),
  defineTag({
    name: 'doc-date',
    title: 'Date',
    group: 'document',
    aliases: ['post-date'],
    returns: ['text'],
    settings: [
      { name: 'type', label: 'Type', type: 'select', options: ['published', 'modified'], default: 'published' },
      { name: 'format', label: 'Format', type: 'select', options: ['short', 'medium', 'long', 'full', 'iso'], default: 'medium' },
    ],
    resolve: (ctx, s) => {
      const v = s.type === 'modified' ? docField(ctx, 'updatedAt') : docField(ctx, 'publishedAt', 'publishedDate', 'createdAt')
      return formatDate(v, String(s.format ?? 'medium'), ctx.request?.locale)
    },
  }),
  defineTag({
    name: 'featured-image',
    title: 'Featured image',
    group: 'document',
    aliases: ['post-featured-image'],
    returns: ['image'],
    settings: [{ name: 'field', label: 'Field', type: 'text', default: '' }],
    resolve: (ctx, s) =>
      toMedia(s.field ? docField(ctx, String(s.field)) : docField(ctx, 'featuredImage', 'image', 'heroImage', 'hero.media', 'meta.image')),
  }),
  defineTag({
    name: 'doc-field',
    title: 'Field value',
    group: 'document',
    aliases: ['acf-text', 'post-custom-field'],
    returns: ['text', 'url', 'image', 'number', 'color'],
    settings: [{ name: 'path', label: 'Field path (e.g. hero.title)', type: 'text' }],
    resolve: (ctx, s) => {
      const v = docField(ctx, String(s.path ?? s.key ?? ''))
      if (v && typeof v === 'object') return toMedia(v) ?? ''
      return v ?? ''
    },
  }),
  defineTag({
    name: 'archive-title',
    title: 'Archive title',
    group: 'archive',
    returns: ['text'],
    resolve: (ctx) => ctx.archive?.title ?? '',
  }),
  defineTag({
    name: 'current-date-time',
    title: 'Current date',
    group: 'site',
    returns: ['text'],
    settings: [{ name: 'format', label: 'Format', type: 'select', options: ['short', 'medium', 'long', 'full', 'iso'], default: 'long' }],
    resolve: (ctx, s) => formatDate(new Date(), String(s.format ?? 'long'), ctx.request?.locale),
  }),
  defineTag({
    name: 'request-parameter',
    title: 'URL parameter',
    group: 'request',
    returns: ['text'],
    settings: [{ name: 'query_var', label: 'Parameter name', type: 'text' }],
    resolve: (ctx, s) => {
      const v = ctx.request?.searchParams?.[String(s.query_var ?? s.name ?? '')]
      return Array.isArray(v) ? v[0] ?? '' : v ?? ''
    },
  }),
  defineTag({
    name: 'user-info',
    title: 'User info',
    group: 'user',
    returns: ['text'],
    settings: [{ name: 'type', label: 'Field', type: 'select', options: ['name', 'email', 'id'], default: 'name' }],
    resolve: (ctx, s) => {
      const u = ctx.user
      if (!u) return ''
      if (s.type === 'email') return u.email ?? ''
      if (s.type === 'id') return String(u.id)
      return u.name ?? u.email ?? ''
    },
  }),
]
