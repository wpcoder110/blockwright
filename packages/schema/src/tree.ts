import type { Element, Layout } from './types'

export type Visitor = (el: Element, parent: Element | null, depth: number) => void | false

/** Depth-first walk. Return `false` from the visitor to skip an element's children. */
export function walk(layout: Layout, visitor: Visitor): void {
  const visit = (el: Element, parent: Element | null, depth: number) => {
    if (visitor(el, parent, depth) === false) return
    for (const child of el.elements ?? []) visit(child, el, depth + 1)
  }
  for (const el of layout) visit(el, null, 0)
}

export function findElement(layout: Layout, id: string): Element | undefined {
  let found: Element | undefined
  walk(layout, (el) => {
    if (found) return false
    if (el.id === id) found = el
  })
  return found
}

export function countElements(layout: Layout): number {
  let n = 0
  walk(layout, () => {
    n++
  })
  return n
}

export function maxDepth(layout: Layout): number {
  let max = 0
  walk(layout, (_el, _p, depth) => {
    if (depth > max) max = depth
  })
  return layout.length ? max + 1 : 0
}

/** Collect the set of widget types (and `container`) used in a layout. */
export function collectTypes(layout: Layout): Set<string> {
  const types = new Set<string>()
  walk(layout, (el) => {
    types.add(el.elType === 'widget' ? String((el as { widgetType?: string }).widgetType) : el.elType)
  })
  return types
}

/** Immutable map over every element. */
export function mapTree(layout: Layout, fn: (el: Element) => Element): Layout {
  const visit = (el: Element): Element => {
    const next = fn(el)
    return { ...next, elements: (next.elements ?? []).map(visit) } as Element
  }
  return layout.map(visit)
}
