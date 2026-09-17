import type { Element } from '@blockwright/schema'
import type { Control, Section } from './controls'
import type { PreparedElement, RenderContext } from './context'

export interface RenderProps<S extends Record<string, unknown> = Record<string, any>> {
  element: Element
  settings: S
  /** Already-rendered children (containers only). */
  children?: unknown
  /** Data returned by `prepare`. */
  data?: any
  ctx: RenderContext
  /** Class names and attributes for the element wrapper. */
  wrapper: WrapperProps
  prepared: PreparedElement
}

export interface WrapperProps {
  className: string
  id?: string
  [attr: string]: unknown
}

export interface ElementDefinition {
  /** `widgetType` for widgets, or `container` for the layout frame. */
  type: string
  elType: 'widget' | 'container'
  title: string
  description?: string
  icon?: string
  category: string
  keywords?: string[]
  sections: Section[]
  /** Framework component. For the React renderer this is a (sync) React component. */
  render: (props: RenderProps) => unknown
  /** Async data loader run before rendering (queries, remote data). */
  prepare?: (settings: Record<string, any>, ctx: RenderContext, element: Element) => Promise<unknown> | unknown
  /** Base CSS included once per page when this element is used. */
  baseCss?: string
  /** Set false when `render` outputs its own wrapper element (containers). */
  wrapper?: boolean
  /** Other type names that should resolve to this definition on import. */
  aliases?: string[]
  /** Include the shared Advanced tab. Default true. */
  advanced?: boolean
  /** Whether this element needs client JavaScript. */
  interactive?: boolean
  /** Marks a widget as a paid add-on (unused in the free build). */
  pro?: boolean
}

export function defineElement(def: ElementDefinition): ElementDefinition {
  return { wrapper: true, advanced: true, ...def }
}

export const defineWidget = (def: Omit<ElementDefinition, 'elType'> & { elType?: 'widget' }) =>
  defineElement({ ...def, elType: 'widget' })

export interface FlatControl extends Control {
  tab: Section['tab']
  section: string
  sectionCondition?: Section['condition']
}

const flatCache = new WeakMap<ElementDefinition, FlatControl[]>()
const defaultsCache = new WeakMap<ElementDefinition, Record<string, unknown>>()

export function flattenControls(def: ElementDefinition, extraSections: Section[] = []): FlatControl[] {
  const cached = flatCache.get(def)
  if (cached && extraSections.length === 0) return cached
  const out: FlatControl[] = []
  for (const s of [...def.sections, ...extraSections]) {
    for (const c of s.controls) {
      out.push({ ...c, tab: s.tab, section: s.id, sectionCondition: s.condition })
    }
  }
  if (extraSections.length === 0) flatCache.set(def, out)
  return out
}

/** Default values for every control (non-empty defaults only). */
export function getDefaults(controls: Control[]): Record<string, unknown> {
  const d: Record<string, unknown> = {}
  for (const c of controls) {
    if (c.default !== undefined && c.type !== 'heading') d[c.name] = c.default
  }
  return d
}

export function getDefinitionDefaults(def: ElementDefinition, controls: Control[]): Record<string, unknown> {
  const cached = defaultsCache.get(def)
  if (cached) return cached
  const d = getDefaults(controls)
  defaultsCache.set(def, d)
  return d
}

export function elementTypeOf(el: Element): string {
  return el.elType === 'widget' ? String((el as { widgetType?: string }).widgetType ?? '') : el.elType
}
