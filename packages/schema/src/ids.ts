import type { Element, Layout } from './types'

const HEX = '0123456789abcdef'

/** Generate a short random element id (7 hex chars), the same shape used by common page-builder exports. */
export function generateId(length = 7): string {
  let out = ''
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  for (let i = 0; i < length; i++) out += HEX[bytes[i]! % 16]
  return out
}

/**
 * Walk a layout and give a fresh id to any element whose id is missing or
 * duplicated. Returns a new tree; the input is not mutated.
 */
export function ensureUniqueIds(layout: Layout): Layout {
  const seen = new Set<string>()
  const visit = (el: Element): Element => {
    let id = typeof el.id === 'string' && el.id ? el.id : generateId()
    while (seen.has(id)) id = generateId()
    seen.add(id)
    return { ...el, id, elements: (el.elements ?? []).map(visit) } as Element
  }
  return layout.map(visit)
}

/** Deep-clone an element subtree with brand-new ids (used for duplicate / paste). */
export function cloneWithNewIds<T extends Element>(el: T): T {
  return {
    ...structuredClone(el),
    id: generateId(),
    elements: (el.elements ?? []).map((c) => cloneWithNewIds(c)),
  } as T
}
