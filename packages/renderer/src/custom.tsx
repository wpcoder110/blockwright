import {
  type Control,
  type ElementDefinition,
  type RenderProps,
  type Section,
  background,
  border,
  borderRadius,
  boxShadow,
  defineWidget,
  margin,
  padding,
  textShadow,
  typography,
} from '@blockwright/core'
import { renderTemplate } from './template'

/** A widget defined in the admin (stored as data, not code). */
export interface CustomWidgetSpec {
  type: string
  title: string
  category?: string
  icon?: string
  description?: string
  keywords?: string[]
  /** HTML template. */
  template: string
  /** CSS; `selector` targets this widget type. */
  css?: string
  /** Full JSON definition: `{ sections: [{ id, label, tab, controls: [...] }] }`. */
  definition?: { sections?: Array<Partial<Section> & { controls?: unknown[] }> } | null
  /** Simple field rows from the admin form. */
  fields?: Array<{
    name: string
    label?: string
    type?: string
    default?: string
    options?: string
    responsive?: boolean
    selector?: string
    css?: string
    tab?: 'content' | 'style'
    section?: string
  }>
}

const NAME = /^[a-z_][a-z0-9_]{0,60}$/
const CONTROL_TYPES = new Set([
  'text', 'textarea', 'number', 'slider', 'dimensions', 'select', 'choose', 'switcher', 'color', 'font', 'media', 'url',
  'wysiwyg', 'code', 'repeater', 'heading', 'gaps', 'icon', 'gallery',
])

const parseOptions = (raw?: string) =>
  (raw ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, value] = l.includes('|') ? l.split('|') : [l, l]
      return { label: label!.trim(), value: (value ?? label)!.trim() }
    })

/** Expand JSON pseudo-controls (typography, background…) and drop unknown types. */
export function normaliseControls(list: unknown[]): Control[] {
  const out: Control[] = []
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const c = raw as Record<string, any>
    const name = String(c.name ?? '')
    if (!NAME.test(name)) continue
    const selector = typeof c.selector === 'string' ? c.selector : '{{WRAPPER}}'
    const label = typeof c.label === 'string' ? c.label : undefined
    switch (c.type) {
      case 'typography':
        out.push(...typography(name, { selector, label }))
        continue
      case 'background':
        out.push(...background(name, { selector, label }))
        continue
      case 'border':
        out.push(...border(name, { selector, label }))
        continue
      case 'border-radius':
        out.push(borderRadius(name, { selector, label }))
        continue
      case 'box-shadow':
        out.push(...boxShadow(name, { selector, label }))
        continue
      case 'text-shadow':
        out.push(...textShadow(name, { selector, label }))
        continue
      case 'padding':
        out.push(padding(name, selector, label))
        continue
      case 'margin':
        out.push(margin(name, selector, label))
        continue
    }
    if (!CONTROL_TYPES.has(c.type)) continue
    const control: Control = { ...(c as Control), name, type: c.type }
    if (c.type === 'repeater') control.fields = normaliseControls(Array.isArray(c.fields) ? c.fields : [])
    if (Array.isArray(c.options)) control.options = c.options.map((o: unknown) => (typeof o === 'string' ? { value: o, label: o } : (o as { value: string; label: string })))
    if (control.selectors && typeof control.selectors !== 'object') delete control.selectors
    out.push(control)
  }
  return out
}

function sectionsFromFields(spec: CustomWidgetSpec): Section[] {
  const sections: Section[] = []
  for (const f of spec.fields ?? []) {
    if (!NAME.test(f.name ?? '')) continue
    const tab = f.tab === 'style' ? 'style' : 'content'
    const label = f.section?.trim() || (tab === 'style' ? 'Style' : 'Content')
    let s = sections.find((x) => x.label === label && x.tab === tab)
    if (!s) {
      s = { id: `${tab}_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, label, tab, controls: [] }
      sections.push(s)
    }
    const type = CONTROL_TYPES.has(f.type ?? '') || ['typography', 'background', 'border', 'box-shadow', 'padding', 'margin', 'border-radius'].includes(f.type ?? '') ? f.type! : 'text'
    let def: unknown = f.default
    if (type === 'number' && f.default) def = Number(f.default)
    if (type === 'switcher') def = f.default === 'yes' || f.default === 'true' ? 'yes' : ''
    if ((type === 'media' || type === 'url') && f.default) def = { url: f.default }
    if (type === 'slider' && f.default) {
      const m = /^(-?[\d.]+)\s*([a-z%]*)$/.exec(f.default.trim())
      def = m ? { size: Number(m[1]), unit: m[2] || 'px' } : undefined
    }
    if (type === 'icon' && f.default) def = { value: f.default.startsWith('bw-') ? f.default : `bw-${f.default}`, library: 'bw' }
    const raw: Record<string, unknown> = {
      name: f.name,
      type,
      label: f.label || f.name,
      default: def,
      responsive: !!f.responsive,
      options: type === 'select' || type === 'choose' ? parseOptions(f.options) : undefined,
      selector: f.selector || undefined,
    }
    if (f.css && !['typography', 'background', 'border', 'box-shadow', 'padding', 'margin', 'border-radius'].includes(type)) {
      raw.selectors = { [f.selector || '{{WRAPPER}}']: f.css }
    }
    s.controls.push(...normaliseControls([raw]))
  }
  return sections
}

export function createCustomWidget(spec: CustomWidgetSpec): ElementDefinition {
  const type = spec.type
  const sections: Section[] = spec.definition?.sections?.length
    ? spec.definition.sections.map((s, i) => ({
        id: String(s.id ?? `section_${i}`),
        label: String(s.label ?? 'Content'),
        tab: s.tab === 'style' || s.tab === 'advanced' ? s.tab : 'content',
        controls: normaliseControls(Array.isArray(s.controls) ? s.controls : []),
        condition: s.condition,
      }))
    : sectionsFromFields(spec)
  const template = spec.template ?? ''
  const scope = `.bw-w-${type.replace(/[^a-z0-9-]/g, '')}`
  const css = (spec.css ?? '').replace(/\bselector\b/g, scope).replace(/<\/?style[^>]*>/gi, '')
  function Render({ settings }: RenderProps) {
    return <div className="bw-custom" dangerouslySetInnerHTML={{ __html: renderTemplate(template, settings) }} />
  }
  return defineWidget({
    type,
    title: spec.title || type,
    description: spec.description,
    icon: spec.icon || 'widget',
    category: spec.category || 'custom',
    keywords: spec.keywords ?? [],
    render: Render as never,
    sections,
    baseCss: css || undefined,
  })
}
