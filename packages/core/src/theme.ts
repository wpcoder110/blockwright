import { type Condition, parseConditions } from '@blockwright/schema'

export type ThemeLocation = 'header' | 'footer' | 'single' | 'archive' | 'error-404'

/** Template types that can fill each location. */
export const LOCATION_TYPES: Record<ThemeLocation, string[]> = {
  header: ['header'],
  footer: ['footer'],
  single: ['single', 'single-page', 'single-post', 'product'],
  archive: ['archive', 'search-results', 'product-archive'],
  'error-404': ['error-404'],
}

export interface ThemeTemplate {
  id: string | number
  type: string
  conditions?: unknown
  updatedAt?: string
  [key: string]: unknown
}

/** Describes the page being viewed, for matching display conditions. */
export interface ThemeRequest {
  kind: 'singular' | 'archive' | 'search' | 'not-found'
  collection?: string
  id?: string | number
  isFront?: boolean
  /** Related documents, e.g. `{ field: 'categories', id: 3 }`, for "in category" rules. */
  terms?: Array<{ field: string; id: string | number }>
}

/**
 * Score a single condition. Lower scores are more specific and win.
 * Returns null when the condition does not apply to the request.
 */
export function conditionScore(c: Condition, req: ThemeRequest): number | null {
  const [a, b, c2] = c.args
  switch (c.name) {
    case 'general':
      return 100
    case 'front_page':
    case 'front-page':
      return req.isFront ? 30 : null
    case 'not_found404':
    case '404':
      return req.kind === 'not-found' ? 20 : null
    case 'singular':
      if (req.kind !== 'singular') return null
      if (!a) return 60
      if (a !== req.collection) return null
      if (!b) return 50
      if (b === 'in' || b === 'by') {
        const field = c2
        const id = c.args[3]
        return req.terms?.some((t) => t.field === field && String(t.id) === id) ? 40 : null
      }
      return String(req.id) === b ? 10 : null
    case 'archive':
      if (req.kind !== 'archive' && req.kind !== 'search') return null
      if (!a) return 80
      if (a === 'search') return req.kind === 'search' ? 70 : null
      if (a !== req.collection) return null
      if (!b) return 70
      return req.terms?.some((t) => t.field === b && String(t.id) === c2) ? 40 : null
    default:
      return null
  }
}

/** Pick the best template for a location, honouring include/exclude rules and specificity. */
export function resolveTemplate<T extends ThemeTemplate>(templates: T[], location: ThemeLocation, req: ThemeRequest): T | null {
  const types = LOCATION_TYPES[location]
  let best: { t: T; score: number } | null = null
  for (const t of templates) {
    if (!types.includes(t.type)) continue
    const conds = parseConditions(t.conditions)
    if (conds.some((c) => c.mode === 'exclude' && conditionScore(c, req) !== null)) continue
    const scores = conds.filter((c) => c.mode === 'include').map((c) => conditionScore(c, req)).filter((s): s is number => s !== null)
    if (!scores.length) continue
    const score = Math.min(...scores)
    if (
      !best ||
      score < best.score ||
      (score === best.score && String(t.updatedAt ?? '') > String(best.t.updatedAt ?? ''))
    ) {
      best = { t, score }
    }
  }
  return best?.t ?? null
}

/** Human-readable options for the conditions editor. */
export const CONDITION_EXAMPLES = [
  { value: 'include/general', label: 'Entire site' },
  { value: 'include/front_page', label: 'Front page' },
  { value: 'include/singular', label: 'All single documents' },
  { value: 'include/singular/pages', label: 'All pages' },
  { value: 'include/singular/pages/<id>', label: 'A specific page' },
  { value: 'include/archive', label: 'All archives' },
  { value: 'include/archive/search', label: 'Search results' },
  { value: 'include/not_found404', label: '404 page' },
  { value: 'exclude/singular/pages/<id>', label: 'Exclude a specific page' },
]
