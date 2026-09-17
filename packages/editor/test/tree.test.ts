import { describe, expect, it } from 'vitest'
import type { Element } from '@blockwright/schema'
import { commit, duplicateById, frameFromStructure, insertAt, moveTo, pathTo, redo, removeById, setBagValue, setSetting, undo } from '../src/tree'

const w = (id: string): Element => ({ id, elType: 'widget', widgetType: 'heading', settings: {}, elements: [] }) as Element
const f = (id: string, elements: Element[] = [], isInner = false): Element => ({ id, elType: 'container', settings: {}, elements, isInner }) as Element
const ids = (l: Element[]): unknown => l.map((e) => (e.elements.length ? { [e.id]: ids(e.elements) } : e.id))

const base = () => [f('A', [w('a1'), w('a2'), f('B', [w('b1')], true)]), f('C', [w('c1')])]

describe('tree operations', () => {
  it('inserts and removes', () => {
    const l = insertAt(base(), { parentId: 'C', index: 0 }, [w('new')])
    expect(ids(l)).toEqual([{ A: ['a1', 'a2', { B: ['b1'] }] }, { C: ['new', 'c1'] }])
    expect(ids(removeById(l, 'B'))).toEqual([{ A: ['a1', 'a2'] }, { C: ['new', 'c1'] }])
  })

  it('moves within and across parents', () => {
    expect(ids(moveTo(base(), 'a1', { parentId: 'A', index: 2 }))).toEqual([{ A: ['a2', 'a1', { B: ['b1'] }] }, { C: ['c1'] }])
    expect(ids(moveTo(base(), 'b1', { parentId: 'C', index: 1 }))).toEqual([{ A: ['a1', 'a2', 'B'] }, { C: ['c1', 'b1'] }])
    const moved = moveTo(base(), 'B', { parentId: null, index: 2 })
    expect(ids(moved)).toEqual([{ A: ['a1', 'a2'] }, { C: ['c1'] }, { B: ['b1'] }])
    expect(moved[2]!.isInner).toBe(false)
  })

  it('refuses to move a frame into itself', () => {
    const l = base()
    expect(moveTo(l, 'A', { parentId: 'B', index: 0 })).toBe(l)
  })

  it('duplicates with fresh ids', () => {
    const { layout, newId } = duplicateById(base(), 'B')
    expect(layout[0]!.elements).toHaveLength(4)
    expect(newId).not.toBe('B')
    expect(layout[0]!.elements[3]!.elements[0]!.id).not.toBe('b1')
  })

  it('updates settings and clears dynamic or global overrides', () => {
    let l = setBagValue(base(), 'a1', '__globals__', 'title_color', 'globals/colors?id=primary')
    l = setSetting(l, 'a1', 'title_color', '#fff')
    const s = l[0]!.elements[0]!.settings
    expect(s.title_color).toBe('#fff')
    expect(s.__globals__).toEqual({})
    expect(setSetting(l, 'a1', 'title_color', undefined)[0]!.elements[0]!.settings).not.toHaveProperty('title_color')
  })

  it('finds paths', () => {
    expect(pathTo(base(), 'b1')).toEqual(['A', 'B', 'b1'])
  })

  it('builds column structures', () => {
    const fr = frameFromStructure([50, 50])
    expect(fr.settings.flex_direction).toBe('row')
    expect(fr.elements).toHaveLength(2)
    expect(fr.elements[0]!.isInner).toBe(true)
  })
})

describe('history', () => {
  it('undoes, redoes and merges rapid edits', () => {
    const a = base()
    const b = removeById(a, 'C')
    const c = removeById(b, 'A')
    let h = { past: [], present: a, future: [] }
    h = commit(h, b, 'x', 1000)
    h = commit(h, c, 'x', 1200)
    expect(h.past).toHaveLength(1)
    h = undo(h)
    expect(h.present).toBe(a)
    h = redo(h)
    expect(h.present).toBe(c)
    h = commit(h, b, 'y', 5000)
    expect(h.past).toHaveLength(2)
    expect(h.future).toHaveLength(0)
  })
})
