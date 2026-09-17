/**
 * Display-condition strings, e.g.
 *   include/general
 *   include/singular/pages/42
 *   exclude/archive/posts/category/7
 */
export type ConditionMode = 'include' | 'exclude'

export interface Condition {
  mode: ConditionMode
  /** `general`, `singular`, `archive` */
  name: string
  /** Remaining path segments, e.g. `['pages', '42']`. */
  args: string[]
}

export function parseCondition(input: string): Condition | null {
  if (typeof input !== 'string') return null
  const parts = input.trim().split('/').filter(Boolean)
  const mode = parts.shift()
  const name = parts.shift()
  if ((mode !== 'include' && mode !== 'exclude') || !name) return null
  return { mode, name, args: parts }
}

export function stringifyCondition(c: Condition): string {
  return [c.mode, c.name, ...c.args].filter(Boolean).join('/')
}

export function parseConditions(list: unknown): Condition[] {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => (typeof item === 'string' ? item : (item as { value?: string })?.value))
    .map((s) => (s ? parseCondition(s) : null))
    .filter((c): c is Condition => c !== null)
}
