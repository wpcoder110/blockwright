import { z } from 'zod'
import { ensureUniqueIds } from './ids'
import { countElements, maxDepth } from './tree'
import type { Element, Layout, TemplateEnvelope } from './types'

export const LIMITS = {
  maxElements: 5000,
  maxDepth: 24,
  maxBytes: 2_000_000,
}

const settingsSchema = z.record(z.string(), z.unknown())

interface RawElement {
  id?: string
  elType: string
  widgetType?: string
  settings?: Record<string, unknown>
  elements?: RawElement[]
  isInner?: boolean
  isLocked?: boolean
  [key: string]: unknown
}

export const elementSchema: z.ZodType<RawElement> = z.lazy(() =>
  z.looseObject({
    id: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,40}$/, 'Element id may only contain letters, numbers, _ and -')
      .optional(),
    elType: z.enum(['container', 'widget', 'section', 'column']),
    widgetType: z
      .string()
      .regex(/^[a-z0-9][a-z0-9._-]{0,80}$/i, 'Invalid widgetType')
      .optional(),
    settings: settingsSchema.optional(),
    elements: z.array(elementSchema).optional(),
    isInner: z.boolean().optional(),
    isLocked: z.boolean().optional(),
  }).refine((el) => el.elType !== 'widget' || !!el.widgetType, {
    message: 'Widgets must have a widgetType',
    path: ['widgetType'],
  }),
)

export const layoutSchema = z.array(elementSchema)

export const templateEnvelopeSchema = z.looseObject({
  content: layoutSchema,
  page_settings: z.union([settingsSchema, z.array(z.unknown())]).optional(),
  version: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional(),
})

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: string[]
}

/** Convert legacy section → column → widget structures into nested containers. */
function upgradeLegacy(el: RawElement, parentIsSection = false): RawElement {
  const children = (el.elements ?? []).map((c) => upgradeLegacy(c, el.elType === 'section'))
  if (el.elType === 'section') {
    return {
      ...el,
      elType: 'container',
      settings: {
        flex_direction: 'row',
        content_width: 'boxed',
        ...(el.settings ?? {}),
      },
      elements: children,
    }
  }
  if (el.elType === 'column') {
    const colSize = (el.settings as { _column_size?: number } | undefined)?._column_size
    return {
      ...el,
      elType: 'container',
      isInner: true,
      settings: {
        content_width: 'full',
        ...(colSize && parentIsSection ? { width: { unit: '%', size: colSize } } : {}),
        ...(el.settings ?? {}),
      },
      elements: children,
    }
  }
  return { ...el, elements: children }
}

function normalize(el: RawElement): Element {
  const base = {
    ...el,
    id: el.id ?? '',
    settings: Array.isArray(el.settings) ? {} : (el.settings ?? {}),
    elements: el.elType === 'widget' ? [] : (el.elements ?? []).map(normalize),
  }
  return base as unknown as Element
}

/**
 * Validate an untrusted layout (from the editor, an API call or an import),
 * convert legacy structures, fill in missing fields and guarantee unique ids.
 */
export function validateLayout(input: unknown): ValidationResult<Layout> {
  let value = input
  if (typeof value === 'string') {
    if (value.length > LIMITS.maxBytes) return { success: false, errors: ['Layout is too large'] }
    try {
      value = JSON.parse(value)
    } catch {
      return { success: false, errors: ['Layout is not valid JSON'] }
    }
  }
  if (value == null) return { success: true, data: [], errors: [] }
  const parsed = layoutSchema.safeParse(value)
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || 'layout'}: ${i.message}`),
    }
  }
  const upgraded = parsed.data.map((el) => upgradeLegacy(el)).map(normalize)
  const layout = ensureUniqueIds(upgraded)
  const errors: string[] = []
  if (countElements(layout) > LIMITS.maxElements) errors.push(`Layout exceeds ${LIMITS.maxElements} elements`)
  if (maxDepth(layout) > LIMITS.maxDepth) errors.push(`Layout is nested deeper than ${LIMITS.maxDepth} levels`)
  if (errors.length) return { success: false, errors }
  return { success: true, data: layout, errors: [] }
}

/** Parse an exported template file. Accepts a bare layout array as well. */
export function parseTemplateEnvelope(input: unknown): ValidationResult<TemplateEnvelope> {
  let value = input
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return { success: false, errors: ['File is not valid JSON'] }
    }
  }
  if (Array.isArray(value)) value = { content: value }
  const parsed = templateEnvelopeSchema.safeParse(value)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }
  }
  const layout = validateLayout(parsed.data.content)
  if (!layout.success) return { success: false, errors: layout.errors }
  const ps = parsed.data.page_settings
  return {
    success: true,
    errors: [],
    data: {
      content: layout.data!,
      page_settings: Array.isArray(ps) || !ps ? {} : ps,
      version: parsed.data.version ?? '0.4',
      title: parsed.data.title ?? 'Imported template',
      type: parsed.data.type ?? 'page',
    },
  }
}
