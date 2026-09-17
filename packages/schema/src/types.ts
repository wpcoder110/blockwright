/**
 * Core data model. The envelope and settings format intentionally mirror the
 * widely used "container" JSON format of popular WordPress page builders so
 * existing templates and HTML→JSON converters can be imported without loss.
 */

/** Element kinds. `section` and `column` are accepted on import only and converted to `container`. */
export type ElType = 'container' | 'widget' | 'section' | 'column'

export type Settings = Record<string, unknown>

export interface ElementBase {
  /** Short unique id (7 hex chars by default). */
  id: string
  elType: ElType
  settings: Settings
  elements: Element[]
  isInner?: boolean
  isLocked?: boolean
}

export interface ContainerElement extends ElementBase {
  elType: 'container'
}

export interface WidgetElement extends ElementBase {
  elType: 'widget'
  /** Widget identifier, e.g. `heading`, `form`, `text-editor`. */
  widgetType: string
  elements: []
}

export type Element = ContainerElement | WidgetElement | (ElementBase & { widgetType?: string })

export type Layout = Element[]

/** Template kinds understood by the theme builder. */
export type TemplateType =
  | 'page'
  | 'section'
  | 'container'
  | 'header'
  | 'footer'
  | 'single'
  | 'single-page'
  | 'single-post'
  | 'archive'
  | 'search-results'
  | 'error-404'
  | 'product'
  | 'product-archive'
  | 'loop-item'
  | 'popup'

/** Import/export file envelope. */
export interface TemplateEnvelope {
  content: Layout
  page_settings: Settings
  version: string
  title: string
  type: TemplateType | string
}

/* ------------------------------------------------------------------ */
/* Common setting value shapes                                         */
/* ------------------------------------------------------------------ */

export type CssUnit = 'px' | '%' | 'em' | 'rem' | 'vw' | 'vh' | 'fr' | 'deg' | 's' | 'ms' | 'custom' | ''

export interface SliderValue {
  unit?: CssUnit | string
  size?: number | string | ''
  sizes?: unknown[]
}

export interface DimensionsValue {
  unit?: CssUnit | string
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  isLinked?: boolean
}

export interface GapsValue {
  unit?: CssUnit | string
  column?: number | string
  row?: number | string
  size?: number | string
  isLinked?: boolean
}

export interface MediaValue {
  id?: number | string
  url?: string
  alt?: string
  width?: number
  height?: number
  source?: string
}

export interface UrlValue {
  url?: string
  is_external?: string | boolean
  nofollow?: string | boolean
  custom_attributes?: string
}

/** Reserved settings keys shared by every element. */
export const RESERVED_KEYS = {
  globals: '__globals__',
  dynamic: '__dynamic__',
} as const

export const SCHEMA_VERSION = '0.4'
export const BW_DATA_VERSION = 1
