import { type Element, cloneWithNewIds, generateId } from '@blockwright/schema'

export type Layout = Element[]

export interface Position {
  /** Parent element id, or null for the top level. */
  parentId: string | null
  index: number
}

export function findWithParent(layout: Layout, id: string): { el: Element; parent: Element | null; index: number } | null {
  const visit = (list: Element[], parent: Element | null): ReturnType<typeof findWithParent> => {
    for (let i = 0; i < list.length; i++) {
      const el = list[i]!
      if (el.id === id) return { el, parent, index: i }
      const found = visit(el.elements ?? [], el)
      if (found) return found
    }
    return null
  }
  return visit(layout, null)
}

export function findElementById(layout: Layout, id: string | null | undefined): Element | null {
  return id ? (findWithParent(layout, id)?.el ?? null) : null
}

/** Ids from the top level down to (and including) the element. */
export function pathTo(layout: Layout, id: string): string[] {
  const visit = (list: Element[], trail: string[]): string[] | null => {
    for (const el of list) {
      const next = [...trail, el.id]
      if (el.id === id) return next
      const found = visit(el.elements ?? [], next)
      if (found) return found
    }
    return null
  }
  return visit(layout, []) ?? []
}

export function isDescendant(layout: Layout, ancestorId: string, id: string): boolean {
  return pathTo(layout, id).includes(ancestorId)
}

const mapChildren = (layout: Layout, parentId: string | null, fn: (children: Element[]) => Element[]): Layout => {
  if (parentId === null) return fn(layout)
  const visit = (list: Element[]): Element[] =>
    list.map((el) => {
      if (el.id === parentId) return { ...el, elements: fn(el.elements ?? []) } as Element
      if (!el.elements?.length) return el
      return { ...el, elements: visit(el.elements) } as Element
    })
  return visit(layout)
}

export function insertAt(layout: Layout, pos: Position, items: Element[]): Layout {
  return mapChildren(layout, pos.parentId, (children) => {
    const next = [...children]
    next.splice(Math.max(0, Math.min(pos.index, next.length)), 0, ...items)
    return next
  })
}

export function removeById(layout: Layout, id: string): Layout {
  const visit = (list: Element[]): Element[] =>
    list.filter((el) => el.id !== id).map((el) => (el.elements?.length ? ({ ...el, elements: visit(el.elements) } as Element) : el))
  return visit(layout)
}

export function updateById(layout: Layout, id: string, fn: (el: Element) => Element): Layout {
  const visit = (list: Element[]): Element[] =>
    list.map((el) => {
      if (el.id === id) return fn(el)
      if (!el.elements?.length) return el
      return { ...el, elements: visit(el.elements) } as Element
    })
  return visit(layout)
}

/** Move an element to a new position. Indexes refer to the tree before the move. */
export function moveTo(layout: Layout, id: string, pos: Position): Layout {
  const found = findWithParent(layout, id)
  if (!found) return layout
  if (pos.parentId && (pos.parentId === id || isDescendant(layout, id, pos.parentId))) return layout
  const sameParent = (found.parent?.id ?? null) === pos.parentId
  let index = pos.index
  if (sameParent && found.index < index) index -= 1
  if (sameParent && found.index === index) return layout
  const without = removeById(layout, id)
  const inner = pos.parentId !== null
  const el = { ...found.el, isInner: found.el.elType === 'container' ? inner : found.el.isInner } as Element
  return insertAt(without, { parentId: pos.parentId, index }, [el])
}

export function duplicateById(layout: Layout, id: string): { layout: Layout; newId: string | null } {
  const found = findWithParent(layout, id)
  if (!found) return { layout, newId: null }
  const copy = cloneWithNewIds(found.el)
  return { layout: insertAt(layout, { parentId: found.parent?.id ?? null, index: found.index + 1 }, [copy]), newId: copy.id }
}

export function setSetting(layout: Layout, id: string, key: string, value: unknown): Layout {
  return updateById(layout, id, (el) => {
    const settings = { ...(el.settings ?? {}) }
    if (value === undefined) delete settings[key]
    else settings[key] = value
    // a static value replaces a dynamic or global one
    for (const bag of ['__dynamic__', '__globals__'] as const) {
      const map = settings[bag] as Record<string, unknown> | undefined
      if (map && key in map && value !== undefined) {
        const next = { ...map }
        delete next[key]
        settings[bag] = next
      }
    }
    return { ...el, settings } as Element
  })
}

export function setBagValue(layout: Layout, id: string, bag: '__dynamic__' | '__globals__', key: string, value: string | undefined): Layout {
  return updateById(layout, id, (el) => {
    const settings = { ...(el.settings ?? {}) }
    const map = { ...((settings[bag] as Record<string, unknown>) ?? {}) }
    if (value === undefined) delete map[key]
    else map[key] = value
    settings[bag] = map
    return { ...el, settings } as Element
  })
}

export function newWidget(type: string, settings: Record<string, unknown> = {}): Element {
  return { id: generateId(), elType: 'widget', widgetType: type, settings, elements: [] } as Element
}

export function newFrame(settings: Record<string, unknown> = {}, elements: Element[] = [], isInner = false): Element {
  return { id: generateId(), elType: 'container', isInner, settings, elements } as Element
}

/** Frame presets offered when adding a section. */
export const STRUCTURES: Array<{ id: string; label: string; columns: number[] }> = [
  { id: '1', label: 'One column', columns: [100] },
  { id: '2', label: 'Two columns', columns: [50, 50] },
  { id: '3', label: 'Three columns', columns: [33.33, 33.33, 33.33] },
  { id: '4', label: 'Four columns', columns: [25, 25, 25, 25] },
  { id: '1-2', label: 'Narrow and wide', columns: [33.33, 66.66] },
  { id: '2-1', label: 'Wide and narrow', columns: [66.66, 33.33] },
]

export function frameFromStructure(columns: number[]): Element {
  if (columns.length === 1) return newFrame({}, [], false)
  const children = columns.map((w) => newFrame({ width: { unit: '%', size: w }, width_mobile: { unit: '%', size: 100 } }, [], true))
  return newFrame({ flex_direction: 'row', flex_direction_mobile: 'column', flex_wrap: 'nowrap' }, children, false)
}

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

export interface History {
  past: Layout[]
  present: Layout
  future: Layout[]
  /** Key of the last change, used to merge rapid edits of the same setting. */
  lastKey?: string
  lastAt?: number
}

export const HISTORY_LIMIT = 100
export const MERGE_WINDOW_MS = 800

export function commit(h: History, next: Layout, key?: string, now = Date.now()): History {
  if (next === h.present) return h
  const merge = key !== undefined && key === h.lastKey && h.lastAt !== undefined && now - h.lastAt < MERGE_WINDOW_MS
  const past = merge ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT)
  return { past, present: next, future: [], lastKey: key, lastAt: now }
}

export function undo(h: History): History {
  if (!h.past.length) return h
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1]!, future: [h.present, ...h.future] }
}

export function redo(h: History): History {
  if (!h.future.length) return h
  return { past: [...h.past, h.present], present: h.future[0]!, future: h.future.slice(1) }
}
