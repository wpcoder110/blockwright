import type { ReactNode } from 'react'
import type { FieldValue, FormField } from './types'
import { evaluateLogic, fieldKey, parseOptions, truthy } from './validate'

const WIDTHS = ['100', '80', '75', '66', '60', '50', '40', '33', '25', '20']
const width = (v: unknown, fallback = '100') => (WIDTHS.includes(String(v)) ? String(v) : fallback)
const cls = (s: unknown) => (typeof s === 'string' ? s.split(/\s+/).map((c) => c.replace(/[^\w-]/g, '')).filter(Boolean).join(' ') : '')

const AUTOCOMPLETE: Record<string, string> = { email: 'email', tel: 'tel', url: 'url' }

export interface FieldRenderOptions {
  formId: string
  size: string
  showLabels: boolean
  markRequired: boolean
  values: Record<string, FieldValue>
}

export function Field({ field, opts }: { field: FormField; opts: FieldRenderOptions }): ReactNode {
  const key = fieldKey(field)
  if (!key) return null
  const id = `${opts.formId}-${key}`
  const name = `form_fields[${key}]`
  const type = field.field_type
  const required = truthy(field.required)
  const label = field.field_label ?? ''
  const errId = `${id}-error`
  const visible = evaluateLogic(field.bw_logic, opts.values)

  if (type === 'honeypot') {
    return (
      <div className="bw-hp" aria-hidden="true">
        <label htmlFor={id}>Leave this field empty</label>
        <input type="text" id={id} name={name} tabIndex={-1} autoComplete="off" />
      </div>
    )
  }
  if (type === 'hidden') {
    return <input type="hidden" name={name} value={field.field_value ?? ''} data-field={key} />
  }

  const groupClass = [
    'bw-field-group',
    `bw-col-${width(field.width)}`,
    field.width_tablet ? `bw-md-col-${width(field.width_tablet)}` : '',
    field.width_mobile ? `bw-sm-col-${width(field.width_mobile)}` : '',
    `bw-field-type-${type}`,
    required ? 'bw-field-required' : '',
    required && opts.markRequired ? 'bw-mark-required' : '',
    cls(field.css_classes),
  ]
    .filter(Boolean)
    .join(' ')

  const common = {
    id,
    name,
    required: required || undefined,
    'aria-required': required || undefined,
    'aria-describedby': errId,
    className: `bw-field bw-size-${opts.size}`,
  }

  let control: ReactNode
  let asFieldset = false
  const options = parseOptions(field.field_options)
  const defaultValue = field.field_value ?? ''

  switch (type) {
    case 'html':
      return (
        <div className={groupClass} data-field={key} hidden={!visible || undefined}>
          <div className="bw-field-html" dangerouslySetInnerHTML={{ __html: String(field.field_html ?? '') }} />
        </div>
      )
    case 'textarea':
      control = (
        <textarea {...common} rows={Number(field.rows) || 4} placeholder={field.placeholder || undefined} defaultValue={defaultValue} maxLength={10000} />
      )
      break
    case 'select': {
      const multiple = truthy(field.allow_multiple)
      control = (
        <div className="bw-select-wrap">
          <select
            {...common}
            name={multiple ? `${name}[]` : name}
            multiple={multiple || undefined}
            size={multiple ? Number(field.select_size) || undefined : undefined}
            defaultValue={multiple ? defaultValue.split(',').filter(Boolean) : defaultValue}
          >
            {!multiple && field.placeholder ? <option value="">{field.placeholder}</option> : null}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )
      break
    }
    case 'radio':
    case 'checkbox': {
      asFieldset = true
      const inputType = type
      const defaults = defaultValue.split(',').map((s) => s.trim())
      control = (
        <div className={`bw-options ${field.inline_list ? 'bw-options-inline' : ''}`}>
          {options.map((o, i) => (
            <span className="bw-option" key={o.value}>
              <input
                type={inputType}
                id={`${id}-${i}`}
                name={type === 'checkbox' ? `${name}[]` : name}
                value={o.value}
                defaultChecked={defaults.includes(o.value)}
                required={type === 'radio' && required ? true : undefined}
                aria-describedby={errId}
              />
              <label htmlFor={`${id}-${i}`}>{o.label}</label>
            </span>
          ))}
        </div>
      )
      break
    }
    case 'acceptance':
      control = (
        <span className="bw-option">
          <input type="checkbox" {...common} className="bw-acceptance" defaultChecked={truthy(field.checked_by_default)} />
          <label htmlFor={id}>{field.acceptance_text || label}</label>
        </span>
      )
      break
    case 'rating': {
      asFieldset = true
      const max = Math.min(Number(field.field_max) || 5, 10)
      control = (
        <div className="bw-rating">
          {Array.from({ length: max }, (_, i) => max - i).map((n) => (
            <span key={n} className="bw-rating-item">
              <input type="radio" id={`${id}-${n}`} name={name} value={String(n)} required={required || undefined} aria-describedby={errId} />
              <label htmlFor={`${id}-${n}`} title={`${n}`}>
                <span className="bw-sr">{n} of {max}</span>
              </label>
            </span>
          ))}
        </div>
      )
      break
    }
    case 'range':
      control = (
        <div className="bw-range">
          <input
            {...common}
            type="range"
            min={field.field_min === '' ? undefined : (field.field_min ?? 0)}
            max={field.field_max === '' ? undefined : (field.field_max ?? 100)}
            step={field.field_step || undefined}
            defaultValue={defaultValue || undefined}
          />
          <output htmlFor={id} className="bw-range-value">
            {defaultValue}
          </output>
        </div>
      )
      break
    default: {
      const inputType = ['email', 'url', 'tel', 'number', 'date', 'time', 'password'].includes(type) ? type : 'text'
      control = (
        <input
          {...common}
          type={inputType}
          placeholder={field.placeholder || undefined}
          defaultValue={defaultValue}
          autoComplete={field.autocomplete || AUTOCOMPLETE[type] || undefined}
          min={['number', 'date'].includes(type) && field.field_min !== '' ? (field.field_min as string) : undefined}
          max={['number', 'date'].includes(type) && field.field_max !== '' ? (field.field_max as string) : undefined}
          step={type === 'number' && field.field_step ? (field.field_step as string) : undefined}
          pattern={field.bw_pattern || undefined}
          inputMode={type === 'tel' ? 'tel' : type === 'number' ? 'decimal' : undefined}
          maxLength={type === 'number' ? undefined : 1000}
        />
      )
    }
  }

  const labelClass = `bw-field-label${opts.showLabels ? '' : ' bw-sr'}`
  const showLabel = label && type !== 'acceptance'
  const error = <p className="bw-field-error" id={errId} hidden />

  if (asFieldset) {
    return (
      <fieldset className={groupClass} data-field={key} hidden={!visible || undefined}>
        {showLabel ? <legend className={labelClass}>{label}</legend> : null}
        {control}
        {error}
      </fieldset>
    )
  }
  return (
    <div className={groupClass} data-field={key} hidden={!visible || undefined}>
      {showLabel ? (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      ) : null}
      {control}
      {error}
    </div>
  )
}
