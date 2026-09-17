import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { type Control, type Device, evaluateCondition, getResponsiveValue, responsiveKey } from '@blockwright/core'
import { buildTagString, generateId, parseGlobalRef, parseTagString } from '@blockwright/schema'
import { useEditor } from '../context'
import { Icon } from '../icons'
import { MediaPicker } from './media'
import { LogicEditor } from './logic'
import { RichText } from './richtext'
import { IconPicker } from './icon'
import { buildNotification, replacePlaceholders } from '@blockwright/forms'
import { type TemplateSummary, fetchMenu, listDocs, listTemplates } from '../api'
import { createContext, useContext } from 'react'

/** Fields of the form being edited, for placeholders and routing rules. */
export const FormFieldsContext = createContext<Array<{ id: string; label: string; type: string; options?: string }>>([])
export const useFormFields = () => useContext(FormFieldsContext)

type Values = Record<string, unknown>

export interface FieldProps {
  control: Control
  values: Values
  setValue: (key: string, value: unknown) => void
  /** Global colors/fonts and dynamic values; only for element-level settings. */
  bags?: {
    get: (bag: '__dynamic__' | '__globals__', key: string) => string | undefined
    set: (bag: '__dynamic__' | '__globals__', key: string, value: string | undefined) => void
  } | null
  /** Items of the enclosing repeater (used by conditional logic). */
  siblings?: Values[]
  /** Controls that belong to popover groups, keyed by group name. */
  groups?: Map<string, Control[]>
}

const DEVICES: Device[] = ['desktop', 'tablet', 'mobile']
const DEVICE_ICON: Record<string, () => ReactNode> = { desktop: Icon.desktop, tablet: Icon.tablet, mobile: Icon.mobile }

export const isEmpty = (v: unknown) => v === undefined || v === null || v === ''

function useOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [active, onOutside, ref])
}

function Menu({ button, children, label }: { button: ReactNode; children: (close: () => void) => ReactNode; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, () => setOpen(false), open)
  return (
    <div className="bwe-pop" ref={ref}>
      <button type="button" className="bwe-mini" aria-label={label} title={label} aria-expanded={open} aria-pressed={open} onClick={() => setOpen((o) => !o)}>
        {button}
      </button>
      {open ? <div className="bwe-menu">{children(() => setOpen(false))}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Field wrapper                                                       */
/* ------------------------------------------------------------------ */

export function ControlField(props: FieldProps) {
  const { control: c, values, bags } = props
  const { device, setDevice, registry, meta, cfg } = useEditor()
  const pdf = cfg.collection === cfg.templatesSlug && meta.templateType === 'pdf'
  if (c.type === 'hidden') return null
  if (!evaluateCondition(c.condition, values)) return null
  if (c.name === 'bw_email_preview') return <EmailPreviewButton notification={values} />
  if (c.type === 'heading') return <div className="bwe-heading">{c.label}</div>

  const key = c.responsive ? responsiveKey(c.name, device) : c.name
  const dynamicTag = bags?.get('__dynamic__', key)
  const tagRef = dynamicTag ? parseTagString(dynamicTag) : null
  const returns = c.type === 'media' ? 'image' : c.type === 'url' ? 'url' : 'text'
  const tags = c.dynamic?.length && bags ? registry.tags().filter((t) => t.returns.includes(returns as never) && (t.group !== 'forms' || pdf)) : []

  const deviceSwitch = c.responsive ? (
    <Menu label="Device" button={DEVICE_ICON[device]?.() ?? Icon.desktop()}>
      {(close) =>
        DEVICES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDevice(d)
              close()
            }}
          >
            {DEVICE_ICON[d]?.()} {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))
      }
    </Menu>
  ) : null

  const dynamicButton = tags.length ? (
    <Menu label="Dynamic value" button={Icon.bolt()}>
      {(close) => (
        <>
          <h4>Insert dynamic value</h4>
          {tags.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => {
                bags!.set('__dynamic__', key, buildTagString({ id: generateId(), name: t.name, settings: {} }))
                close()
              }}
            >
              {t.title}
            </button>
          ))}
        </>
      )}
    </Menu>
  ) : null

  const inline = c.type === 'switcher' || c.type === 'color' || c.type === 'popover-toggle'
  const shortChoose = c.type === 'choose' && (c.options ?? []).length <= 4 && !(c.options ?? []).some((o) => o.label.length > 9)
  const sideBySide = !tagRef && !inline && ((c.type === 'select' && !c.multiple) || c.type === 'number' || c.type === 'font' || shortChoose || c.type === 'icon')
  let input: ReactNode
  if (tagRef) {
    input = <DynamicChip tagString={dynamicTag!} onChange={(v) => bags!.set('__dynamic__', key, v)} returnsText={returns === 'text'} />
  } else {
    input = <ControlInput {...props} fieldKey={key} device={device} />
  }

  if (c.type === 'repeater') return <>{input}</>
  if (c.type === 'popover-toggle') return <>{input}</>

  if (sideBySide) {
    return (
      <div className="bwe-field is-inline">
        <span className="bwe-label" title={c.label ?? c.name}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label ?? c.name}</span>
          {deviceSwitch}
        </span>
        <div className="bwe-control">
          {dynamicButton}
          {input}
        </div>
        {c.description ? <p className="bwe-desc">{c.description}</p> : null}
      </div>
    )
  }

  return (
    <div className="bwe-field">
      <div className="bwe-field-row">
        <span className="bwe-label">
          {c.label ?? c.name}
          {deviceSwitch}
        </span>
        <span className="bwe-inline">
          {c.shortcodes ? <ShortcodeMenu onInsert={(token) => props.setValue(key, `${String(values[key] ?? '')}${token}`)} /> : null}
          {dynamicButton}
          {inline && !tagRef ? input : null}
        </span>
      </div>
      {!inline || tagRef ? input : null}
      {c.description ? <p className="bwe-desc">{c.description}</p> : null}
    </div>
  )
}

/** Inserts form placeholders such as [field id="email"] into email settings. */
function ShortcodeMenu({ onInsert }: { onInsert: (token: string) => void }) {
  const fields = useFormFields()
  return (
    <Menu label="Insert form field" button={<span style={{ fontSize: 11, fontWeight: 600 }}>{'{ }'}</span>}>
      {(close) => (
        <>
          <h4>Form fields</h4>
          {fields.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                onInsert(`[field id="${f.id}"]`)
                close()
              }}
            >
              {f.label} <span className="bwe-rep-type">{f.id}</span>
            </button>
          ))}
          <h4>Other values</h4>
          {[
            ['[all-fields]', 'All answers'],
            ['{form_name}', 'Form name'],
            ['{site_name}', 'Site name'],
            ['{page_url}', 'Page URL'],
            ['{date}', 'Date'],
          ].map(([token, label]) => (
            <button
              key={token}
              type="button"
              onClick={() => {
                onInsert(token!)
                close()
              }}
            >
              {label} <span className="bwe-rep-type">{token}</span>
            </button>
          ))}
        </>
      )}
    </Menu>
  )
}

function DynamicChip({ tagString, onChange, returnsText }: { tagString: string; onChange: (v: string | undefined) => void; returnsText: boolean }) {
  const { registry } = useEditor()
  const ref = parseTagString(tagString)!
  const tag = registry.tag(ref.name)
  const [open, setOpen] = useState(false)
  const update = (k: string, v: string) => onChange(buildTagString({ ...ref, settings: { ...ref.settings, [k]: v } }))
  const extra = [...(tag?.settings ?? []), ...(returnsText ? [{ name: 'before', label: 'Before', type: 'text' as const }, { name: 'after', label: 'After', type: 'text' as const }] : []), { name: 'fallback', label: 'Fallback', type: 'text' as const }]
  return (
    <div className="bwe-field">
      <div className="bwe-chip">
        {Icon.bolt()}
        <span>{tag?.title ?? ref.name}</span>
        <button type="button" title="Settings" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {Icon.settings()}
        </button>
        <button type="button" title="Remove dynamic value" onClick={() => onChange(undefined)}>
          {Icon.close()}
        </button>
      </div>
      {open ? (
        <div className="bwe-group">
          {extra.map((s) => (
            <label key={s.name} className="bwe-field">
              <span className="bwe-label">{s.label}</span>
              {'options' in s && s.options ? (
                <select className="bwe-select" value={String(ref.settings[s.name] ?? s.default ?? '')} onChange={(e) => update(s.name, e.target.value)}>
                  {s.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="bwe-input" value={String(ref.settings[s.name] ?? '')} onChange={(e) => update(s.name, e.target.value)} />
              )}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

type InputProps = FieldProps & { fieldKey: string; device: Device }

const UNIT_RANGES: Record<string, { min: number; max: number; step: number }> = {
  px: { min: 0, max: 200, step: 1 },
  '%': { min: 0, max: 100, step: 1 },
  em: { min: 0, max: 10, step: 0.1 },
  rem: { min: 0, max: 10, step: 0.1 },
  vw: { min: 0, max: 100, step: 1 },
  vh: { min: 0, max: 100, step: 1 },
  deg: { min: 0, max: 360, step: 1 },
  fr: { min: 1, max: 12, step: 1 },
  ms: { min: 0, max: 3000, step: 50 },
  s: { min: 0, max: 10, step: 0.1 },
}

const parseNum = (v: string): number | '' => (v === '' ? '' : Number.isFinite(Number(v)) ? Number(v) : '')

function inherited(values: Values, name: string, device: Device) {
  if (device === 'desktop') return undefined
  return getResponsiveValue(values, name, device === 'mobile' ? 'tablet' : 'desktop')
}

export function ControlInput(props: InputProps) {
  const { control: c, values, setValue, fieldKey: key, device } = props
  const value = values[key]
  const parentValue = c.responsive ? inherited(values, c.name, device) : undefined
  const set = (v: unknown) => setValue(key, v)

  switch (c.type) {
    case 'text':
    case 'number':
      return (
        <input
          className="bwe-input"
          type={c.type === 'number' ? 'number' : 'text'}
          value={value === undefined || value === null ? '' : String(value)}
          placeholder={c.placeholder ?? (parentValue !== undefined && typeof parentValue !== 'object' ? String(parentValue) : undefined)}
          onChange={(e) => set(c.type === 'number' ? parseNum(e.target.value) : e.target.value)}
        />
      )
    case 'textarea':
      return <textarea className="bwe-textarea" rows={c.rows ?? 4} value={String(value ?? '')} placeholder={c.placeholder} onChange={(e) => set(e.target.value)} />
    case 'code':
      return <textarea className="bwe-textarea bwe-mono" rows={c.rows ?? 8} spellCheck={false} value={String(value ?? '')} onChange={(e) => set(e.target.value)} />
    case 'font':
      return (
        <>
          <input className="bwe-input" list="bwe-fonts" value={String(value ?? '')} placeholder="Default" onChange={(e) => set(e.target.value)} />
          <FontList />
        </>
      )
    case 'select': {
      const options = c.options ?? []
      if (c.multiple) {
        const list = Array.isArray(value) ? (value as string[]) : []
        return (
          <div className="bwe-group">
            {options.map((o) => (
              <label key={o.value} className="bwe-field-row">
                <span>{o.label}</span>
                <input
                  type="checkbox"
                  checked={list.includes(o.value)}
                  onChange={(e) => set(e.target.checked ? [...list, o.value] : list.filter((x) => x !== o.value))}
                />
              </label>
            ))}
          </div>
        )
      }
      return (
        <select className="bwe-select" value={String(value ?? '')} onChange={(e) => set(e.target.value)}>
          {!options.some((o) => o.value === '') ? <option value="">{parentValue ? `Inherit (${String(parentValue)})` : 'Default'}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === '' && parentValue ? `Inherit (${String(parentValue)})` : o.label}
            </option>
          ))}
        </select>
      )
    }
    case 'choose': {
      const options = c.options ?? []
      const long = options.some((o) => o.label.length > 9) || options.length > 5
      if (long) {
        return (
          <select className="bwe-select" value={String(value ?? '')} onChange={(e) => set(e.target.value)}>
            <option value="">{parentValue ? `Inherit (${String(parentValue)})` : 'Default'}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )
      }
      return (
        <div className="bwe-choose" role="group">
          {options.map((o) => (
            <button key={o.value} type="button" aria-pressed={value === o.value} title={o.label} onClick={() => set(value === o.value ? '' : o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )
    }
    case 'switcher': {
      const on = !isEmpty(value) && value !== 'no' && value !== false
      return (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={c.label}
          className="bwe-switch"
          onClick={() => set(on ? '' : (c.returnValue ?? 'yes'))}
        />
      )
    }
    case 'color':
      return <ColorInput {...props} />
    case 'slider':
      return <SliderInput {...props} parentValue={parentValue} />
    case 'dimensions':
      return <DimensionsInput {...props} />
    case 'gaps':
      return <GapsInput {...props} />
    case 'media':
      return <MediaInput {...props} />
    case 'url':
      return <UrlInput {...props} />
    case 'wysiwyg':
      return <RichText value={String(value ?? '')} onChange={(v) => set(v)} />
    case 'icon':
      return <IconPicker value={value as never} onChange={set} />
    case 'gallery':
      return <GalleryInput value={value} onChange={set} />
    case 'template':
      return <TemplateSelect value={value} onChange={set} type={c.templateType} />
    case 'doc-select':
      return <DocSelect value={value} onChange={set} collection={c.collection ?? ''} manage={c.manageUrl} />
    case 'repeater':
      return <RepeaterInput {...props} />
    case 'popover-toggle':
      return <PopoverToggle {...props} />
    case 'box-shadow':
      return <ShadowInput {...props} />
    case 'json':
      if (c.name === 'bw_logic') return <LogicEditor value={value as never} onChange={set} siblings={props.siblings ?? []} self={values} />
      if (c.name === 'bw_route') return <RouteEditor value={value} onChange={set} />
      return <JsonInput value={value} onChange={set} />
    default:
      return <input className="bwe-input" value={String(value ?? '')} onChange={(e) => set(e.target.value)} />
  }
}

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Manrope', 'Sora', 'DM Sans', 'Nunito', 'Work Sans', 'Raleway',
  'Rubik', 'Outfit', 'Plus Jakarta Sans', 'Figtree', 'Urbanist', 'Space Grotesk', 'IBM Plex Sans', 'Source Sans 3', 'Karla', 'Mulish',
  'Playfair Display', 'Merriweather', 'Lora', 'Libre Baskerville', 'Fraunces', 'DM Serif Display', 'Cormorant Garamond', 'EB Garamond',
  'JetBrains Mono', 'IBM Plex Mono', 'Noto Sans', 'Noto Naskh Arabic', 'Noto Nastaliq Urdu', 'Cairo', 'Tajawal',
]

function FontList() {
  return (
    <datalist id="bwe-fonts">
      {FONTS.map((f) => (
        <option key={f} value={f} />
      ))}
    </datalist>
  )
}

function ColorInput({ control: c, values, setValue, fieldKey: key, bags }: InputProps) {
  const { kit } = useEditor()
  const value = typeof values[key] === 'string' ? (values[key] as string) : ''
  const gRef = bags?.get('__globals__', key)
  const global = parseGlobalRef(gRef)
  const globalColor = global ? kit.colors.find((k) => k.id === global.id) : undefined
  if (global) {
    return (
      <span className="bwe-chip" style={{ maxWidth: 170 }}>
        <span className="bwe-dot" style={{ background: globalColor?.color ?? '#ccc', flex: 'none', width: 14 }} />
        <span>{globalColor?.title ?? global.id}</span>
        <button type="button" title="Unlink global color" onClick={() => bags!.set('__globals__', key, undefined)}>
          {Icon.close()}
        </button>
      </span>
    )
  }
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : /^#[0-9a-f]{3}$/i.test(value) ? `#${value.slice(1).replace(/./g, '$&$&')}` : '#000000'
  return (
    <span className="bwe-color">
      {c.global === 'colors' && bags ? (
        <Menu label="Global colors" button={Icon.globe()}>
          {(close) => (
            <>
              <h4>Global colors</h4>
              {kit.colors.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    bags.set('__globals__', key, `globals/colors?id=${k.id}`)
                    close()
                  }}
                >
                  <span className="bwe-dot" style={{ background: k.color }} /> {k.title}
                </button>
              ))}
            </>
          )}
        </Menu>
      ) : null}
      <input className="bwe-input bwe-mono" style={{ width: 92 }} value={value} placeholder="—" onChange={(e) => setValue(key, e.target.value)} aria-label={`${c.label} value`} />
      <span className="bwe-swatch">
        <span style={{ background: value || 'transparent' }} />
        <input type="color" value={hex} onChange={(e) => setValue(key, e.target.value)} aria-label={c.label} />
      </span>
    </span>
  )
}

function SliderInput({ control: c, values, setValue, fieldKey: key, parentValue }: InputProps & { parentValue: unknown }) {
  const v = (values[key] && typeof values[key] === 'object' ? values[key] : {}) as { unit?: string; size?: number | string }
  const units = c.units ?? ['px']
  const unit = v.unit ?? (parentValue as { unit?: string } | undefined)?.unit ?? units[0] ?? 'px'
  const r = c.range?.[unit] ?? UNIT_RANGES[unit] ?? { min: 0, max: 100, step: 1 }
  const step = 'step' in r && r.step ? r.step : 1
  const placeholder = parentValue && typeof parentValue === 'object' ? String((parentValue as { size?: unknown }).size ?? '') : ''
  const put = (size: number | string | '', u = unit) => setValue(key, size === '' ? undefined : { unit: u, size, sizes: [] })
  return (
    <div className="bwe-inline">
      {unit === 'custom' ? (
        <input className="bwe-input" value={String(v.size ?? '')} placeholder="calc(…)" onChange={(e) => put(e.target.value)} />
      ) : (
        <>
          <input className="bwe-range" type="range" min={r.min} max={r.max} step={step} value={v.size === '' || v.size === undefined ? r.min : Number(v.size)} onChange={(e) => put(Number(e.target.value))} aria-label={c.label} />
          <input className="bwe-input bwe-num" type="number" step={step} value={v.size ?? ''} placeholder={placeholder} onChange={(e) => put(parseNum(e.target.value))} />
        </>
      )}
      {units.length > 1 ? (
        <select className="bwe-select bwe-unit" value={unit} onChange={(e) => put(v.size ?? '', e.target.value)} aria-label="Unit">
          {units.map((u) => (
            <option key={u} value={u}>
              {u === 'custom' ? 'fx' : u}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}

function DimensionsInput({ control: c, values, setValue, fieldKey: key }: InputProps) {
  const v = (values[key] && typeof values[key] === 'object' ? values[key] : {}) as Record<string, unknown>
  const units = c.units ?? ['px']
  const unit = String(v.unit ?? units[0])
  const linked = v.isLinked !== false
  const sides = ['top', 'right', 'bottom', 'left'] as const
  const put = (patch: Record<string, unknown>) => {
    const next = { unit, top: '', right: '', bottom: '', left: '', isLinked: linked, ...v, ...patch }
    const empty = sides.every((s) => next[s] === '' || next[s] === undefined)
    setValue(key, empty ? undefined : next)
  }
  return (
    <div className="bwe-dims">
      {sides.map((s) => (
        <label key={s}>
          <input
            className="bwe-input"
            type={unit === 'custom' ? 'text' : 'number'}
            value={String(v[s] ?? '')}
            onChange={(e) => {
              const n = unit === 'custom' ? e.target.value : parseNum(e.target.value)
              put(linked ? { top: n, right: n, bottom: n, left: n } : { [s]: n })
            }}
          />
          {s}
        </label>
      ))}
      <button type="button" className="bwe-mini" aria-pressed={linked} title={linked ? 'Unlink values' : 'Link values'} onClick={() => put({ isLinked: !linked })}>
        {Icon.link()}
      </button>
      {units.length > 1 ? (
        <select className="bwe-select" style={{ gridColumn: '1 / 3' }} value={unit} onChange={(e) => put({ unit: e.target.value })} aria-label="Unit">
          {units.map((u) => (
            <option key={u} value={u}>
              {u === 'custom' ? 'custom' : u}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}

function GapsInput({ control: c, values, setValue, fieldKey: key }: InputProps) {
  const v = (values[key] && typeof values[key] === 'object' ? values[key] : {}) as Record<string, unknown>
  const units = c.units ?? ['px']
  const unit = String(v.unit ?? units[0])
  const linked = v.isLinked !== false
  const put = (patch: Record<string, unknown>) => {
    const next = { unit, column: '', row: '', isLinked: linked, ...v, ...patch }
    setValue(key, next.column === '' && next.row === '' ? undefined : next)
  }
  return (
    <div className="bwe-dims" style={{ gridTemplateColumns: '1fr 1fr 30px 1fr' }}>
      {(['column', 'row'] as const).map((s) => (
        <label key={s}>
          <input
            className="bwe-input"
            type="number"
            value={String(v[s] ?? '')}
            onChange={(e) => {
              const n = parseNum(e.target.value)
              put(linked ? { column: n, row: n } : { [s]: n })
            }}
          />
          {s === 'column' ? 'columns' : 'rows'}
        </label>
      ))}
      <button type="button" className="bwe-mini" aria-pressed={linked} title="Link values" onClick={() => put({ isLinked: !linked })}>
        {Icon.link()}
      </button>
      <select className="bwe-select" value={unit} onChange={(e) => put({ unit: e.target.value })} aria-label="Unit">
        {units.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  )
}

function MediaInput({ values, setValue, fieldKey: key }: InputProps) {
  const v = (values[key] && typeof values[key] === 'object' ? values[key] : {}) as { url?: string; alt?: string }
  const [picking, setPicking] = useState(false)
  return (
    <div className="bwe-media">
      <button type="button" className="bwe-media-preview" style={{ backgroundImage: v.url ? `url("${v.url}")` : undefined }} onClick={() => setPicking(true)}>
        {v.url ? null : 'Choose image'}
      </button>
      <div className="bwe-inline">
        <input className="bwe-input" placeholder="Image URL" value={v.url ?? ''} onChange={(e) => setValue(key, e.target.value ? { ...v, id: undefined, url: e.target.value } : undefined)} />
        <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => setPicking(true)}>
          Library
        </button>
      </div>
      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(m) => {
            setValue(key, { id: m.id, url: m.url, alt: m.alt ?? '', width: m.width, height: m.height, source: 'library' })
            setPicking(false)
          }}
        />
      ) : null}
    </div>
  )
}

function UrlInput({ values, setValue, fieldKey: key }: InputProps) {
  const v = (values[key] && typeof values[key] === 'object' ? values[key] : typeof values[key] === 'string' ? { url: values[key] } : {}) as Record<string, string>
  const [open, setOpen] = useState(false)
  const put = (patch: Record<string, string>) => setValue(key, { url: '', is_external: '', nofollow: '', custom_attributes: '', ...v, ...patch })
  return (
    <div className="bwe-field">
      <div className="bwe-inline">
        <input className="bwe-input" placeholder="https:// or /page" value={v.url ?? ''} onChange={(e) => put({ url: e.target.value })} />
        <button type="button" className="bwe-mini" aria-pressed={open} title="Link options" onClick={() => setOpen((o) => !o)}>
          {Icon.settings()}
        </button>
      </div>
      {open ? (
        <div className="bwe-group">
          <label className="bwe-field-row">
            <span>Open in new window</span>
            <input type="checkbox" checked={v.is_external === 'on'} onChange={(e) => put({ is_external: e.target.checked ? 'on' : '' })} />
          </label>
          <label className="bwe-field-row">
            <span>Add nofollow</span>
            <input type="checkbox" checked={v.nofollow === 'on'} onChange={(e) => put({ nofollow: e.target.checked ? 'on' : '' })} />
          </label>
          <label className="bwe-field">
            <span className="bwe-label">Custom attributes</span>
            <input className="bwe-input" placeholder="key|value, key|value" value={v.custom_attributes ?? ''} onChange={(e) => put({ custom_attributes: e.target.value })} />
          </label>
        </div>
      ) : null}
    </div>
  )
}

function JsonInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => (value === undefined ? '' : JSON.stringify(value, null, 2)))
  const [error, setError] = useState(false)
  return (
    <textarea
      className="bwe-textarea bwe-mono"
      style={error ? { borderColor: '#c92a2a' } : undefined}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        if (!e.target.value.trim()) {
          setError(false)
          onChange(undefined)
          return
        }
        try {
          onChange(JSON.parse(e.target.value))
          setError(false)
        } catch {
          setError(true)
        }
      }}
    />
  )
}

function ShadowInput({ values, setValue, fieldKey: key }: InputProps) {
  const v = (values[key] && typeof values[key] === 'object' ? values[key] : {}) as Record<string, unknown>
  const put = (k: string, val: unknown) => setValue(key, { horizontal: 0, vertical: 0, blur: 10, spread: 0, color: 'rgba(0,0,0,0.5)', ...v, [k]: val })
  const nums = ['horizontal', 'vertical', 'blur', ...('spread' in v || !('color' in v) ? ['spread'] : [])]
  return (
    <div className="bwe-field">
      <div className="bwe-dims" style={{ gridTemplateColumns: `repeat(${nums.length}, 1fr)` }}>
        {nums.map((n) => (
          <label key={n}>
            <input className="bwe-input" type="number" value={String(v[n] ?? '')} onChange={(e) => put(n, parseNum(e.target.value) || 0)} />
            {n}
          </label>
        ))}
      </div>
      <div className="bwe-inline">
        <span className="bwe-label" style={{ flex: 1 }}>
          Color
        </span>
        <input className="bwe-input bwe-mono" style={{ width: 150 }} value={String(v.color ?? '')} onChange={(e) => put('color', e.target.value)} />
      </div>
    </div>
  )
}

function PopoverToggle({ control: c, values, setValue, bags, groups, siblings }: InputProps) {
  const { kit } = useEditor()
  const on = c.name.endsWith('_typography') ? 'custom' : 'yes'
  const active = !isEmpty(values[c.name])
  const [open, setOpen] = useState(false)
  const gRef = bags?.get('__globals__', c.name)
  const global = parseGlobalRef(gRef)
  const children = groups?.get(c.name) ?? []
  const reset = () => {
    setValue(c.name, undefined)
    for (const child of children) {
      for (const k of Object.keys(values)) if (k === child.name || k.startsWith(`${child.name}_`)) setValue(k, undefined)
    }
    setOpen(false)
  }
  return (
    <div className="bwe-field">
      <div className="bwe-field-row">
        <span className="bwe-label">{c.label}</span>
        <span className="bwe-inline">
          {c.global === 'typography' && bags ? (
            global ? (
              <span className="bwe-chip" style={{ maxWidth: 140 }}>
                <span>{kit.typography.find((t) => t.id === global.id)?.title ?? global.id}</span>
                <button type="button" title="Unlink global font" onClick={() => bags.set('__globals__', c.name, undefined)}>
                  {Icon.close()}
                </button>
              </span>
            ) : (
              <Menu label="Global fonts" button={Icon.globe()}>
                {(close) => (
                  <>
                    <h4>Global fonts</h4>
                    {kit.typography.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          bags.set('__globals__', c.name, `globals/typography?id=${t.id}`)
                          close()
                        }}
                      >
                        <span style={{ fontFamily: t.fontFamily, fontWeight: t.fontWeight as never }}>{t.title}</span>
                      </button>
                    ))}
                  </>
                )}
              </Menu>
            )
          ) : null}
          {active ? (
            <button type="button" className="bwe-mini" title="Reset" onClick={reset}>
              {Icon.undo()}
            </button>
          ) : null}
          <button
            type="button"
            className="bwe-mini"
            aria-pressed={open}
            aria-expanded={open}
            title="Edit"
            onClick={() => {
              if (!active) setValue(c.name, on)
              setOpen((o) => !o)
            }}
          >
            {Icon.settings()}
          </button>
        </span>
      </div>
      {open ? (
        <div className="bwe-group">
          {children.map((child) => (
            <ControlField key={child.name} control={child} values={values} setValue={setValue} bags={bags} siblings={siblings} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Repeater                                                            */
/* ------------------------------------------------------------------ */

function itemTitle(c: Control, item: Values, index: number): { title: string; type?: string } {
  const raw = c.titleField ? item[c.titleField] : undefined
  const title = typeof raw === 'string' && raw ? raw : typeof item.custom_id === 'string' && item.custom_id ? item.custom_id : `Item ${index + 1}`
  const type = typeof item.field_type === 'string' ? item.field_type : undefined
  return { title, type }
}

function RepeaterInput({ control: c, values, setValue, fieldKey: key }: InputProps) {
  const { focusField } = useEditor()
  const items = (Array.isArray(values[key]) ? values[key] : []) as Values[]
  const [openId, setOpenId] = useState<string | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const dragIndex = useRef<number | null>(null)
  const fields = c.fields ?? []
  const idOf = (item: Values, i: number) => String(item._id ?? item.custom_id ?? i)

  useEffect(() => {
    if (!focusField || c.name !== 'form_fields') return
    const match = items.find((it) => it.custom_id === focusField)
    if (match) setOpenId(idOf(match, items.indexOf(match)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusField])

  const put = (next: Values[]) => setValue(key, next)
  const groups = useMemo(() => {
    const popovers = new Set(fields.filter((f) => f.type === 'popover-toggle').map((f) => f.name))
    const m = new Map<string, Control[]>()
    for (const f of fields) if (f.group && popovers.has(f.group)) m.set(f.group, [...(m.get(f.group) ?? []), f])
    return m
  }, [fields])

  const addItem = () => {
    const id = generateId()
    const base: Values = { _id: id }
    for (const f of fields) if (f.default !== undefined && f.type !== 'heading') base[f.name] = f.default
    if (c.name === 'form_fields') {
      const n = items.length + 1
      Object.assign(base, { custom_id: `field_${id}`, field_label: `Field ${n}`, field_type: 'text', width: '100' })
    }
    put([...items, base])
    setOpenId(id)
  }

  return (
    <div className="bwe-field">
      <span className="bwe-label">{c.label}</span>
      <div className="bwe-rep">
        {items.map((item, i) => {
          const id = idOf(item, i)
          const open = openId === id
          const { title, type } = itemTitle(c, item, i)
          const setItem = (k: string, v: unknown) => {
            const next = [...items]
            const copy = { ...item }
            if (v === undefined) delete copy[k]
            else copy[k] = v
            if (k === 'custom_id' && typeof v === 'string') copy.custom_id = v.replace(/[^A-Za-z0-9_-]/g, '_')
            next[i] = copy
            put(next)
          }
          const itemGroups = groups
          return (
            <div
              key={id}
              className={`bwe-rep-item${dropAt === i ? ' is-drop' : ''}${open ? ' is-open' : ''}`}
              onDragOver={(e) => {
                if (dragIndex.current === null) return
                e.preventDefault()
                setDropAt(i)
              }}
              onDragLeave={() => setDropAt((d) => (d === i ? null : d))}
              onDrop={(e) => {
                e.preventDefault()
                const from = dragIndex.current
                dragIndex.current = null
                setDropAt(null)
                if (from === null || from === i) return
                const next = [...items]
                const [moved] = next.splice(from, 1)
                next.splice(from < i ? i - 1 : i, 0, moved!)
                put(next)
              }}
            >
              <div className="bwe-rep-head">
                <span
                  className="bwe-grip"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(e) => {
                    dragIndex.current = i
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', 'bw-repeater')
                  }}
                  onDragEnd={() => {
                    dragIndex.current = null
                    setDropAt(null)
                  }}
                >
                  {Icon.move()}
                </span>
                <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : id)}>
                  <span>{title}</span>
                  {type ? <span className="bwe-rep-type">{type}</span> : null}
                </button>
                <button type="button" className="bwe-mini" title="Duplicate" onClick={() => {
                  const next = [...items]
                  const nid = generateId()
                  const copy: Values = { ...structuredClone(item), _id: nid }
                  if (typeof copy.custom_id === 'string') copy.custom_id = `${copy.custom_id}_copy`
                  next.splice(i + 1, 0, copy)
                  put(next)
                }}>
                  {Icon.copy()}
                </button>
                <button type="button" className="bwe-mini" title="Remove" onClick={() => put(items.filter((_, n) => n !== i))}>
                  {Icon.trash()}
                </button>
              </div>
              {open ? (
                <div className="bwe-rep-body">
                  {fields
                    .filter((f) => !(f.group && itemGroups.has(f.group)))
                    .map((f) => (
                      <ControlField key={f.name} control={f} values={item} setValue={setItem} bags={null} siblings={items.slice(0, i)} groups={itemGroups} />
                    ))}
                </div>
              ) : null}
            </div>
          )
        })}
        <button type="button" className="bwe-add-btn" onClick={addItem}>
          {Icon.plus()} Add {c.addLabel ?? (c.name === 'form_fields' ? 'field' : 'item')}
        </button>
      </div>
      {c.description ? <p className="bwe-desc">{c.description}</p> : null}
    </div>
  )
}

function RouteEditor({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const fields = useFormFields()
  const siblings = fields.map((f) => ({ custom_id: f.id, field_label: f.label, field_type: f.type, field_options: f.options }))
  return <LogicEditor value={value as never} onChange={onChange} siblings={siblings} self={{}} actionLabels={{ show: 'Send this email', hide: 'Do not send' }} />
}

function GalleryInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const items = (Array.isArray(value) ? value : []) as Array<{ id?: string | number; url?: string; alt?: string }>
  const [picking, setPicking] = useState(false)
  const dragFrom = useRef<number | null>(null)
  return (
    <div className="bwe-field">
      <div className="bwe-gallery">
        {items.map((m, i) => (
          <div
            key={`${m.id ?? m.url}-${i}`}
            className="bwe-gallery-item"
            draggable
            style={{ backgroundImage: m.url ? `url("${m.url}")` : undefined }}
            title={m.alt || 'Image'}
            onDragStart={(e) => {
              dragFrom.current = i
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', 'bw-gallery')
            }}
            onDragOver={(e) => dragFrom.current !== null && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const from = dragFrom.current
              dragFrom.current = null
              if (from === null || from === i) return
              const next = [...items]
              const [moved] = next.splice(from, 1)
              next.splice(i, 0, moved!)
              onChange(next)
            }}
          >
            <button type="button" aria-label="Remove image" onClick={() => onChange(items.filter((_, n) => n !== i))}>
              {Icon.close()}
            </button>
          </div>
        ))}
        <button type="button" className="bwe-gallery-add" onClick={() => setPicking(true)} aria-label="Add images">
          {Icon.plus()}
        </button>
      </div>
      <p className="bwe-desc">{items.length ? `${items.length} images. Drag to reorder.` : 'Add images from the media library.'}</p>
      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(m) => {
            onChange([...items, { id: m.id, url: m.url, alt: m.alt ?? '', width: m.width, height: m.height }])
            setPicking(false)
          }}
        />
      ) : null}
    </div>
  )
}

function EmailPreviewButton({ notification }: { notification: Values }) {
  const { kit, site, meta } = useEditor()
  const fields = useFormFields()
  const [open, setOpen] = useState(false)
  const sample = useMemo(
    () =>
      fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type as never,
        value: f.type === 'email' ? 'visitor@example.com' : f.type === 'tel' ? '03001234567' : f.type === 'textarea' ? 'This is an example message.\nIt has two lines.' : f.options ? (f.options.split(/\r?\n/)[0] ?? '').split('|').pop()!.trim() : `Example ${f.label.toLowerCase()}`,
      })),
    [fields],
  )
  const mail = open
    ? buildNotification(
        notification as never,
        (t, o) => replacePlaceholders(t, { formName: meta.title || 'Form', siteName: site.name, siteUrl: site.url, pageUrl: site.url, entryId: 123, entryUrl: '#', fields: sample }, o),
        { siteName: site.name, siteUrl: site.url, accent: kit.colors.find((k) => k.id === 'primary')?.color },
      )
    : null
  return (
    <>
      <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => setOpen(true)}>
        {Icon.eye()} Preview email
      </button>
      {mail ? (
        <div className="bwe-modal-back" role="dialog" aria-modal="true" aria-label="Email preview" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bwe-modal" style={{ width: 'min(720px, 100%)' }}>
            <header>
              <h2>Email preview</h2>
              <button type="button" className="bwe-ibtn" onClick={() => setOpen(false)} aria-label="Close">
                {Icon.close()}
              </button>
            </header>
            <div className="bwe-modal-body">
              <div className="bwe-group">
                <div className="bwe-field-row"><span className="bwe-label">To</span><span>{replacePlaceholders(String(notification.to ?? ''), { fields: sample }) || 'Site default recipient'}</span></div>
                <div className="bwe-field-row"><span className="bwe-label">Subject</span><strong>{mail.subject}</strong></div>
              </div>
              <iframe title="Email preview" srcDoc={mail.html} sandbox="" style={{ width: '100%', height: 460, border: '1px solid #e2e5ea', borderRadius: 8, background: '#f1f3f5' }} />
              <p className="bwe-desc">Filled with example answers. Links in the preview are disabled.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function TemplateSelect({ value, onChange, type }: { value: unknown; onChange: (v: unknown) => void; type?: string }) {
  const { cfg } = useEditor()
  const [items, setItems] = useState<TemplateSummary[] | null>(null)
  useEffect(() => {
    listTemplates(cfg)
      .then((docs) => setItems(docs.filter((d) => !type || d.type === type)))
      .catch(() => setItems([]))
  }, [cfg, type])
  return (
    <div className="bwe-field">
      <select className="bwe-select" value={String(value ?? '')} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">Newest {type === 'pdf' ? 'PDF ' : ''}template</option>
        {(items ?? []).map((t) => (
          <option key={t.id} value={String(t.id)}>
            {t.title}
          </option>
        ))}
      </select>
      {items && !items.length ? (
        <p className="bwe-desc">
          No {type === 'pdf' ? 'PDF ' : ''}templates yet. Create one under{' '}
          <a href={`${cfg.adminRoute}/collections/${cfg.templatesSlug}/create`} target="_blank" rel="noopener">
            Templates
          </a>
          .
        </p>
      ) : null}
    </div>
  )
}

function DocSelect({ value, onChange, collection, manage }: { value: unknown; onChange: (v: unknown) => void; collection: string; manage?: string }) {
  const { cfg, apply } = useEditor()
  const [docs, setDocs] = useState<Array<{ id: string | number; title: string }> | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!collection) return
    listDocs(cfg, collection)
      .then(setDocs)
      .catch(() => setDocs([]))
  }, [cfg, collection, tick])
  const refresh = () => {
    setTick((t) => t + 1)
    if (value && collection === 'bw-menus') {
      // reload the menu and re-render the canvas
      void fetchMenu(cfg, String(value), true).then(() => apply((l) => [...l]))
    }
  }
  const manageHref = manage ? `${cfg.adminRoute}/collections/${manage}` : null
  return (
    <div className="bwe-field">
      <div className="bwe-inline">
        <select className="bwe-select" value={String(value ?? '')} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">{docs === null ? 'Loading…' : docs.length ? 'Choose…' : 'Nothing to choose yet'}</option>
          {(docs ?? []).map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.title}
            </option>
          ))}
        </select>
        <button type="button" className="bwe-mini" title="Reload" onClick={refresh}>
          {Icon.undo()}
        </button>
      </div>
      {manageHref ? (
        <p className="bwe-desc">
          <a href={value ? `${manageHref}/${value}` : `${manageHref}/create`} target="_blank" rel="noopener">
            {value ? 'Edit this menu' : 'Create a menu'}
          </a>{' '}
          in a new tab, then press reload.
        </p>
      ) : null}
    </div>
  )
}
