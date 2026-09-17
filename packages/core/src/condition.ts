import type { ControlCondition } from './controls'

const eq = (a: unknown, b: unknown) => {
  if (a === b) return true
  if ((a === undefined || a === null) && b === '') return true
  if ((b === undefined || b === null) && a === '') return true
  return false
}

/** Evaluate a control/section condition against element settings. */
export function evaluateCondition(condition: ControlCondition | undefined, settings: Record<string, unknown>): boolean {
  if (!condition) return true
  for (const [rawKey, expected] of Object.entries(condition)) {
    const negate = rawKey.endsWith('!')
    const key = negate ? rawKey.slice(0, -1) : rawKey
    const actual = settings[key]
    let match: boolean
    if (Array.isArray(expected)) {
      match = Array.isArray(actual)
        ? actual.some((a) => expected.some((e) => eq(a, e)))
        : expected.some((e) => eq(actual, e))
    } else if (Array.isArray(actual)) {
      match = actual.some((a) => eq(a, expected))
    } else {
      match = eq(actual, expected)
    }
    if (negate ? match : !match) return false
  }
  return true
}
