/**
 * Validation and conditional logic shared by the browser enhancer and the
 * server endpoint, so both always agree on what is valid.
 */
import type { FieldLogic, FieldResult, FieldType, FieldValue, FormField, FormMessages, LogicRule, ValidationOutput } from './types'

export const DEFAULT_MESSAGES: FormMessages = {
  success: 'Thanks! Your message has been sent.',
  error: 'Your submission could not be sent. Please check the highlighted fields.',
  required: 'This field is required.',
  invalid: 'Please enter a valid value.',
  server: 'Something went wrong on our side. Please try again in a moment.',
}

const NON_DATA: FieldType[] = ['html', 'step', 'honeypot']
const MAX_LEN: Partial<Record<FieldType, number>> = { textarea: 10000 }
const DEFAULT_MAX_LEN = 1000

export const truthy = (v: unknown) => v === true || v === 'true' || v === 'yes' || v === 'on'

export const fieldKey = (f: FormField) => String(f.custom_id ?? f._id ?? '').replace(/[^A-Za-z0-9_-]/g, '')

export function parseOptions(raw: unknown): Array<{ label: string; value: string }> {
  if (typeof raw !== 'string') return []
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('|')
      return i === -1 ? { label: line, value: line } : { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() }
    })
}

export function isDataField(f: FormField) {
  return !NON_DATA.includes(f.field_type)
}

const asArray = (v: FieldValue | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : v === '' ? [] : [v])
const asString = (v: FieldValue | undefined): string => (Array.isArray(v) ? v.join(', ') : (v ?? ''))

function ruleMatches(rule: LogicRule, values: Record<string, FieldValue>): boolean {
  const actual = values[rule.field]
  const list = asArray(actual).map((s) => s.toLowerCase())
  const expected = String(rule.value ?? '').toLowerCase()
  switch (rule.operator) {
    case 'is':
      return list.length ? list.includes(expected) : expected === ''
    case 'is_not':
      return !(list.length ? list.includes(expected) : expected === '')
    case 'contains':
      return list.some((s) => s.includes(expected))
    case 'not_contains':
      return !list.some((s) => s.includes(expected))
    case 'is_empty':
      return list.length === 0
    case 'not_empty':
      return list.length > 0
    case 'gt':
      return Number(asString(actual)) > Number(expected)
    case 'lt':
      return Number(asString(actual)) < Number(expected)
    default:
      return true
  }
}

export function evaluateLogic(logic: FieldLogic | null | undefined, values: Record<string, FieldValue>): boolean {
  if (!logic || !Array.isArray(logic.rules) || logic.rules.length === 0) return true
  const results = logic.rules.map((r) => ruleMatches(r, values))
  const met = logic.match === 'any' ? results.some(Boolean) : results.every(Boolean)
  return logic.action === 'hide' ? !met : met
}

/** Visibility of every field, taking chained conditions into account. */
export function visibleFields(fields: FormField[], values: Record<string, FieldValue>): Set<string> {
  const visible = new Set<string>()
  const effective: Record<string, FieldValue> = {}
  // fields can only depend on fields above them, so a single pass is enough
  for (const f of fields) {
    const key = fieldKey(f)
    if (evaluateLogic(f.bw_logic, effective)) {
      visible.add(key)
      if (values[key] !== undefined) effective[key] = values[key]!
    }
  }
  return visible
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
const TEL_RE = /^[0-9()#&+*=.\s-]{5,30}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

function validUrl(v: string) {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function safePattern(p: unknown): RegExp | null {
  if (typeof p !== 'string' || !p || p.length > 200) return null
  try {
    return new RegExp(`^(?:${p})$`)
  } catch {
    return null
  }
}

export interface ValidateOptions {
  messages?: Partial<FormMessages>
  /** Only validate these field ids (multi-step: current step). */
  only?: Set<string>
}

/** Normalise raw input (`form_fields[name]`, arrays, plain keys) into field values. */
export function normaliseValues(input: Record<string, unknown>): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {}
  const put = (key: string, v: unknown) => {
    const k = key.replace(/^form_fields\[/, '').replace(/\](\[\])?$/, '')
    const vals = (Array.isArray(v) ? v : [v]).filter((x) => x !== undefined && x !== null).map((x) => String(x))
    const prev = out[k]
    if (prev === undefined) out[k] = Array.isArray(v) || key.endsWith('[]') ? vals : (vals[0] ?? '')
    else out[k] = [...asArray(prev), ...vals]
  }
  const nested = [input.form_fields, input.fields].find((v) => v && typeof v === 'object' && !Array.isArray(v))
  const source = (nested ?? input) as Record<string, unknown>
  for (const [k, v] of Object.entries(source)) {
    if (k.startsWith('_bw')) continue
    put(k, v)
  }
  return out
}

export function validateForm(fields: FormField[], rawValues: Record<string, FieldValue>, opts: ValidateOptions = {}): ValidationOutput {
  const msg = { ...DEFAULT_MESSAGES, ...(opts.messages ?? {}) }
  const errors: Record<string, string> = {}
  const data: Record<string, FieldValue> = {}
  const results: FieldResult[] = []
  let spam = false
  const visible = visibleFields(fields, rawValues)

  for (const f of fields) {
    const key = fieldKey(f)
    if (!key) continue
    if (f.field_type === 'honeypot') {
      if (asString(rawValues[key]).trim() !== '') spam = true
      continue
    }
    if (!isDataField(f) || !visible.has(key)) continue
    if (opts.only && !opts.only.has(key)) continue

    const raw = rawValues[key]
    const multi = f.field_type === 'checkbox' || (f.field_type === 'select' && truthy(f.allow_multiple))
    let value: FieldValue = multi ? asArray(raw).map((s) => s.trim()) : asString(raw).trim()
    if (f.field_type === 'textarea' && typeof value === 'string') value = asString(raw).replace(/\r\n/g, '\n').trim()
    const empty = Array.isArray(value) ? value.length === 0 : value === ''
    const required = truthy(f.required)
    const fail = (m: string) => {
      errors[key] = f.bw_error && m !== msg.required ? f.bw_error : m
    }

    if (empty) {
      if (required) fail(msg.required)
      data[key] = value
      results.push({ id: key, label: f.field_label || key, type: f.field_type, value })
      continue
    }

    const str = asString(value)
    const max = MAX_LEN[f.field_type] ?? DEFAULT_MAX_LEN
    if (str.length > max) fail(msg.invalid)

    switch (f.field_type) {
      case 'email':
        if (!EMAIL_RE.test(str)) fail(msg.invalid)
        break
      case 'url':
        if (!validUrl(str)) fail(msg.invalid)
        break
      case 'tel':
        if (!TEL_RE.test(str)) fail(msg.invalid)
        break
      case 'number':
      case 'range':
      case 'rating': {
        const n = Number(str)
        const min = f.field_min === '' || f.field_min === undefined ? null : Number(f.field_min)
        const mx = f.field_max === '' || f.field_max === undefined ? (f.field_type === 'rating' ? 5 : null) : Number(f.field_max)
        if (!Number.isFinite(n) || (min !== null && n < min) || (mx !== null && n > mx)) fail(msg.invalid)
        break
      }
      case 'date':
        if (!DATE_RE.test(str) || Number.isNaN(Date.parse(str))) fail(msg.invalid)
        else {
          if (f.field_min && str < String(f.field_min)) fail(msg.invalid)
          if (f.field_max && str > String(f.field_max)) fail(msg.invalid)
        }
        break
      case 'time':
        if (!TIME_RE.test(str)) fail(msg.invalid)
        break
      case 'select':
      case 'radio':
      case 'checkbox': {
        const allowed = new Set(parseOptions(f.field_options).map((o) => o.value))
        if (asArray(value).some((v) => !allowed.has(v))) fail(msg.invalid)
        break
      }
      case 'acceptance':
        value = 'on'
        break
    }
    const re = safePattern(f.bw_pattern)
    if (re && typeof value === 'string' && !re.test(value)) fail(msg.invalid)

    data[key] = value
    results.push({ id: key, label: f.field_label || key, type: f.field_type, value })
  }

  return { valid: Object.keys(errors).length === 0 && !spam, errors, data, fields: results, spam }
}

/** Split fields into steps at each `step` field. */
export function splitSteps(fields: FormField[]): Array<{ step: FormField | null; fields: FormField[] }> {
  const steps: Array<{ step: FormField | null; fields: FormField[] }> = []
  let current: { step: FormField | null; fields: FormField[] } = { step: null, fields: [] }
  for (const f of fields) {
    if (f.field_type === 'step') {
      if (current.fields.length || current.step) steps.push(current)
      current = { step: f, fields: [] }
    } else current.fields.push(f)
  }
  if (current.fields.length || current.step) steps.push(current)
  return steps
}

export function readMessages(settings: Record<string, unknown>): FormMessages {
  const custom = truthy(settings.custom_messages)
  const pick = (k: string, d: string) => (custom && typeof settings[k] === 'string' && settings[k] ? String(settings[k]) : d)
  return {
    success: pick('success_message', DEFAULT_MESSAGES.success),
    error: pick('error_message', DEFAULT_MESSAGES.error),
    required: pick('required_field_message', DEFAULT_MESSAGES.required),
    invalid: pick('invalid_message', DEFAULT_MESSAGES.invalid),
    server: pick('server_message', DEFAULT_MESSAGES.server),
  }
}
