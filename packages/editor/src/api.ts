export interface EditorConfig {
  /** e.g. `/api` */
  apiRoute: string
  /** e.g. `/admin` */
  adminRoute: string
  collection: string
  id: string | number
  /** Whether the collection uses drafts. */
  drafts: boolean
  /** Slug of the templates collection. */
  templatesSlug: string
  /** Upload collection for images, or false. */
  mediaCollection: string | false
  /** Collections with Blockwright layouts (for display conditions). */
  collections: string[]
  /** Public URL of the document, if it has one. */
  previewUrl?: string | null
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init, headers: { Accept: 'application/json', ...(init.headers ?? {}) } })
  const data = (await res.json().catch(() => ({}))) as Record<string, any>
  if (!res.ok) {
    const msg = data?.errors?.[0]?.data?.errors?.[0]?.message ?? data?.errors?.[0]?.message ?? data?.message ?? `Request failed (${res.status})`
    throw new ApiError(String(msg), res.status)
  }
  return data as T
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

export function saveDocument(cfg: EditorConfig, data: Record<string, unknown>, publish: boolean) {
  const draft = cfg.drafts && !publish
  const body = cfg.drafts ? { ...data, _status: publish ? 'published' : 'draft' } : data
  const qs = draft ? '?draft=true' : ''
  return request<{ doc: Record<string, unknown> }>(`${cfg.apiRoute}/${cfg.collection}/${cfg.id}${qs}`, { method: 'PATCH', ...json(body) })
}

export interface TemplateSummary {
  id: string | number
  title: string
  type: string
  updatedAt?: string
}

export async function listTemplates(cfg: EditorConfig): Promise<TemplateSummary[]> {
  const qs = new URLSearchParams({ limit: '100', depth: '0', sort: '-updatedAt', 'select[title]': 'true', 'select[type]': 'true', 'select[updatedAt]': 'true' })
  const res = await request<{ docs: TemplateSummary[] }>(`${cfg.apiRoute}/${cfg.templatesSlug}?${qs}`)
  return res.docs
}

export function getTemplate(cfg: EditorConfig, id: string | number) {
  return request<{ layout?: unknown; title?: string }>(`${cfg.apiRoute}/${cfg.templatesSlug}/${id}?depth=0&draft=true`)
}

export function createTemplate(cfg: EditorConfig, data: { title: string; type: string; layout: unknown }) {
  return request<{ doc: { id: string | number } }>(`${cfg.apiRoute}/${cfg.templatesSlug}`, { method: 'POST', ...json({ ...data, _status: 'published' }) })
}

export interface MediaItem {
  id: string | number
  url: string
  alt?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

export async function listMedia(cfg: EditorConfig, page = 1): Promise<{ docs: MediaItem[]; hasNextPage: boolean }> {
  if (!cfg.mediaCollection) return { docs: [], hasNextPage: false }
  return request(`${cfg.apiRoute}/${cfg.mediaCollection}?limit=40&page=${page}&depth=0&sort=-createdAt`)
}

export async function uploadMedia(cfg: EditorConfig, file: File, alt: string): Promise<MediaItem> {
  if (!cfg.mediaCollection) throw new ApiError('No media collection is configured.', 400)
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt }))
  const res = await request<{ doc: MediaItem }>(`${cfg.apiRoute}/${cfg.mediaCollection}`, { method: 'POST', body: form })
  return res.doc
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function listDocs(cfg: EditorConfig, collection: string): Promise<Array<{ id: string | number; title: string }>> {
  const qs = new URLSearchParams({ limit: '100', depth: '0', sort: 'title' })
  const res = await request<{ docs: Array<Record<string, unknown>> }>(`${cfg.apiRoute}/${collection}?${qs}`)
  return res.docs.map((d) => ({ id: d.id as string | number, title: String(d.title ?? d.name ?? d.id) }))
}

const menuCache = new Map<string, Promise<unknown>>()

/** Resolved menu items for the canvas. */
export function fetchMenu(cfg: EditorConfig, id: string | number, fresh = false) {
  const key = String(id)
  if (fresh) menuCache.delete(key)
  let p = menuCache.get(key)
  if (!p) {
    p = request<{ items: unknown[] }>(`${cfg.apiRoute}/bw/menus/${encodeURIComponent(key)}`)
      .then((r) => r.items)
      .catch(() => {
        menuCache.delete(key)
        return null
      })
    menuCache.set(key, p)
  }
  return p as Promise<never>
}
