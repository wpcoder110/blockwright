import type { DragPayload } from './context'
import { type Layout, type Position, findWithParent, isDescendant } from './tree'

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export interface DropTarget {
  pos: Position
  /** Where to draw the indicator (iframe viewport coordinates). */
  indicator: Rect
  kind: 'line' | 'inside'
}

const idOf = (el: Element | null) => (el as HTMLElement | null)?.dataset?.bwId ?? null
const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

/** The element that lays out a frame's children (the inner box for boxed frames). */
export function layoutBox(frame: HTMLElement): HTMLElement {
  if (frame.classList.contains('bw-boxed')) {
    const inner = Array.from(frame.children).find((c) => c.classList.contains('bw-inner'))
    if (inner) return inner as HTMLElement
  }
  return frame
}

function childNodes(box: HTMLElement): HTMLElement[] {
  return Array.from(box.children).filter((c): c is HTMLElement => !!(c as HTMLElement).dataset?.bwId)
}

function isRow(box: HTMLElement): boolean {
  const cs = box.ownerDocument.defaultView?.getComputedStyle(box)
  if (!cs) return false
  if (cs.display.includes('grid')) return true
  return cs.flexDirection.startsWith('row')
}

function lineBetween(children: HTMLElement[], index: number, row: boolean, box: HTMLElement): Rect {
  const T = 3
  if (!children.length) return rectOf(box)
  const ref = children[Math.min(index, children.length - 1)]!
  const r = rectOf(ref)
  const after = index >= children.length
  if (row) return { top: r.top, left: (after ? r.left + r.width : r.left) - T / 2, width: T, height: r.height }
  return { top: (after ? r.top + r.height : r.top) - T / 2, left: r.left, width: r.width, height: T }
}

function indexFor(children: HTMLElement[], x: number, y: number, row: boolean): number {
  for (let i = 0; i < children.length; i++) {
    const r = children[i]!.getBoundingClientRect()
    if (row) {
      // grid or wrapped rows: only consider items on the pointer's line
      if (y < r.top) return i
      if (y <= r.bottom && x < r.left + r.width / 2) return i
    } else if (y < r.top + r.height / 2) return i
  }
  return children.length
}

export function computeDrop(doc: Document, x: number, y: number, layout: Layout, drag: DragPayload): DropTarget | null {
  const movingId = drag.kind === 'move' ? drag.id : null
  let node = doc.elementFromPoint(x, y)?.closest('[data-bw-id]') ?? null
  while (node && movingId) {
    const id = idOf(node)!
    if (id !== movingId && !isDescendant(layout, movingId, id)) break
    node = node.parentElement?.closest('[data-bw-id]') ?? null
  }

  if (!node) {
    const root = doc.querySelector('.bw-content') as HTMLElement | null
    const children = root ? childNodes(root) : []
    const index = indexFor(children, x, y, false)
    const indicator = children.length
      ? lineBetween(children, index, false, root!)
      : (() => {
          const add = doc.querySelector('.bwe-add')
          return add ? rectOf(add) : { top: 20, left: 20, width: doc.documentElement.clientWidth - 40, height: 80 }
        })()
    return { pos: { parentId: null, index }, indicator, kind: children.length ? 'line' : 'inside' }
  }

  const el = node as HTMLElement
  const id = el.dataset.bwId!
  const found = findWithParent(layout, id)
  if (!found) return null
  const parentEl = el.parentElement?.closest('[data-bw-id]') as HTMLElement | null
  const parentBox = parentEl ? layoutBox(parentEl) : ((doc.querySelector('.bw-content') as HTMLElement | null) ?? el.parentElement!)
  const parentRow = parentEl ? isRow(parentBox) : false
  const r = el.getBoundingClientRect()

  const sibling = (after: boolean): DropTarget => {
    const siblings = childNodes(parentBox)
    const index = found.index + (after ? 1 : 0)
    return { pos: { parentId: found.parent?.id ?? null, index }, indicator: lineBetween(siblings, index, parentRow, parentBox), kind: 'line' }
  }

  if (el.dataset.bwType === 'container') {
    const edge = Math.min(12, r.height / 4, r.width / 4)
    if (parentRow ? x - r.left < edge : y - r.top < edge) return sibling(false)
    if (parentRow ? r.right - x < edge : r.bottom - y < edge) return sibling(true)
    const box = layoutBox(el)
    const children = childNodes(box)
    const row = isRow(box)
    const index = indexFor(children, x, y, row)
    if (!children.length) return { pos: { parentId: id, index: 0 }, indicator: rectOf(box), kind: 'inside' }
    return { pos: { parentId: id, index }, indicator: lineBetween(children, index, row, box), kind: 'line' }
  }

  const after = parentRow ? x > r.left + r.width / 2 : y > r.top + r.height / 2
  return sibling(after)
}
