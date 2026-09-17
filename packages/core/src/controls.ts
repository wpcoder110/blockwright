/**
 * Control definitions describe every setting a widget exposes. They drive
 * the editor UI, default values, validation and CSS generation.
 */
export type ControlType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'slider'
  | 'dimensions'
  | 'select'
  | 'choose'
  | 'switcher'
  | 'color'
  | 'font'
  | 'media'
  | 'url'
  | 'wysiwyg'
  | 'code'
  | 'repeater'
  | 'hidden'
  | 'heading'
  | 'gaps'
  | 'box-shadow'
  | 'popover-toggle'
  | 'json'
  | 'icon'
  | 'gallery'
  | 'template'
  | 'doc-select'

export type Tab = 'content' | 'style' | 'advanced'

export type DynamicReturn = 'text' | 'url' | 'image' | 'number' | 'color' | 'html'

/** `{ key: value }` equals, `{ key: [a, b] }` one of, `{ 'key!': value }` not equal. */
export type ControlCondition = Record<string, unknown>

export interface ControlOption {
  value: string
  label: string
  icon?: string
}

export interface Control {
  name: string
  type: ControlType
  label?: string
  description?: string
  placeholder?: string
  default?: unknown
  responsive?: boolean
  /** Map of selector template → declaration template. `{{WRAPPER}}` is the element's unique class. */
  selectors?: Record<string, string>
  /** Maps a raw option value to the CSS value used in selectors. */
  selectorsDictionary?: Record<string, string>
  /** Emit CSS even when the value equals the default (base CSS normally covers defaults). */
  cssDefault?: boolean
  condition?: ControlCondition
  dynamic?: DynamicReturn[]
  global?: 'colors' | 'typography'
  options?: ControlOption[]
  units?: string[]
  range?: Record<string, { min: number; max: number; step?: number }>
  /** Repeater sub-fields. */
  fields?: Control[]
  titleField?: string
  /** Name of the group control this sub-control belongs to (typography, background…). */
  group?: string
  /** Only users with the `unfilteredHtml` capability may change this control. */
  restricted?: boolean
  /** Separator above the control in the editor. */
  separator?: 'before' | 'after'
  labelBlock?: boolean
  /** Offer form placeholders ([field id="…"]) in the editor. */
  shortcodes?: boolean
  /** Label for the repeater's add button. */
  addLabel?: string
  /** For document pickers: which collection to list. */
  collection?: string
  /** Link shown next to a document picker, e.g. to manage menus. */
  manageUrl?: string
  /** For template pickers: which template type to list. */
  templateType?: string
  /** Value stored when a switcher is on. Default: `yes`. */
  returnValue?: string
  /** Allow selecting several options (select control). */
  multiple?: boolean
  rows?: number
  language?: string
}

export interface Section {
  id: string
  label: string
  tab: Tab
  controls: Control[]
  condition?: ControlCondition
}

type Opts = Omit<Control, 'name' | 'type'>

const make =
  (type: ControlType) =>
  (name: string, opts: Opts = {}): Control => ({ name, type, ...opts })

export const text = make('text')
export const textarea = make('textarea')
export const number = make('number')
export const select = make('select')
export const choose = make('choose')
export const color = make('color')
export const font = make('font')
export const media = make('media')
export const url = make('url')
export const wysiwyg = make('wysiwyg')
export const code = make('code')
export const hidden = make('hidden')
export const heading = (name: string, label: string, opts: Opts = {}): Control => ({
  name,
  type: 'heading',
  label,
  separator: 'before',
  ...opts,
})
export const json = make('json')
export const icon = make('icon')
export const gallery = make('gallery')
export const templatePicker = make('template')
export const docSelect = make('doc-select')

export const switcher = (name: string, opts: Opts = {}): Control => ({ name, type: 'switcher', default: '', ...opts })

export const slider = (name: string, opts: Opts = {}): Control => ({
  name,
  type: 'slider',
  units: ['px', 'em', 'rem', '%', 'vw', 'custom'],
  ...opts,
})

export const dimensions = (name: string, opts: Opts = {}): Control => ({
  name,
  type: 'dimensions',
  units: ['px', '%', 'em', 'rem', 'vw', 'custom'],
  ...opts,
})

export const gaps = (name: string, opts: Opts = {}): Control => ({
  name,
  type: 'gaps',
  units: ['px', '%', 'em', 'rem', 'vw', 'custom'],
  ...opts,
})

export const repeater = (name: string, fields: Control[], opts: Opts = {}): Control => ({
  name,
  type: 'repeater',
  fields,
  ...opts,
})

export const section = (
  id: string,
  label: string,
  controls: Array<Control | Control[]>,
  opts: { tab?: Tab; condition?: ControlCondition } = {},
): Section => ({
  id,
  label,
  tab: opts.tab ?? 'content',
  controls: controls.flat(),
  condition: opts.condition,
})

export const ALIGN_OPTIONS: ControlOption[] = [
  { value: 'left', label: 'Left', icon: 'align-left' },
  { value: 'center', label: 'Center', icon: 'align-center' },
  { value: 'right', label: 'Right', icon: 'align-right' },
  { value: 'justify', label: 'Justified', icon: 'align-justify' },
]

export const opts = (values: string[] | Record<string, string>): ControlOption[] =>
  Array.isArray(values)
    ? values.map((v) => ({ value: v, label: v === '' ? 'Default' : v.charAt(0).toUpperCase() + v.slice(1) }))
    : Object.entries(values).map(([value, label]) => ({ value, label }))
