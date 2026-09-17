import type { Element, MediaValue } from '@blockwright/schema'
import type { Kit } from './kit'
import type { Registry } from './registry'

export interface DocumentContext {
  collection: string
  id: string | number
  data: Record<string, unknown>
  url?: string
}

/** A navigation menu item with its final URL. */
export interface MenuItem {
  id: string
  label: string
  url: string
  newTab?: boolean
  rel?: string
  children: MenuItem[]
}

export interface RenderContext {
  registry: Registry
  kit: Kit
  /** `live` = public site, `preview` = draft preview, `edit` = inside the editor canvas. */
  mode: 'live' | 'preview' | 'edit'
  /** The document being rendered (a page, or the current post for theme templates). */
  document?: DocumentContext
  /** The document that owns the layout, when different from `document` (theme templates). */
  owner?: { collection: string; id: string | number }
  site?: { name?: string; url?: string; logo?: MediaValue; description?: string }
  request?: {
    url?: string
    path?: string
    searchParams?: Record<string, string | string[] | undefined>
    locale?: string
  }
  user?: { id: string | number; name?: string; email?: string } | null
  archive?: { title?: string; collection?: string; description?: string }
  /** Where forms post to. */
  formEndpoint?: string
  /** Framework adapters for images and links. */
  components?: {
    Image?: unknown
    Link?: unknown
  }
  /** Data-access helpers for widgets that query content (posts grid, products…). */
  services?: {
    find?: (args: { collection: string; where?: unknown; limit?: number; sort?: string; depth?: number }) => Promise<{ docs: Record<string, unknown>[] }>
    findByID?: (args: { collection: string; id: string | number; depth?: number }) => Promise<Record<string, unknown> | null>
    /** Resolved navigation menu (Menus collection). */
    menu?: (id: string | number) => Promise<MenuItem[] | null>
  }
  /** Free-form extension data for custom widgets. */
  extra?: Record<string, unknown>
}

export interface PreparedElement {
  element: Element
  type: string
  settings: Record<string, unknown>
  /** Data loaded by the widget's `prepare` hook. */
  data?: unknown
  children: PreparedElement[]
  /** True when the widget type is not registered. */
  missing?: boolean
}
