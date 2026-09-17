import { describe, expect, it } from 'vitest'
import {
  buildTagString,
  collectTypes,
  countElements,
  ensureUniqueIds,
  parseCondition,
  parseGlobalRef,
  parseTagString,
  parseTemplateEnvelope,
  validateLayout,
} from '../src'

describe('validateLayout', () => {
  it('accepts a container layout and fills defaults', () => {
    const res = validateLayout([
      { id: 'a1', elType: 'container', elements: [{ elType: 'widget', widgetType: 'heading', settings: { title: 'Hi' } }] },
    ])
    expect(res.success).toBe(true)
    const w = res.data![0]!.elements[0]!
    expect(w.id).toMatch(/^[0-9a-f]{7}$/)
    expect(w.elements).toEqual([])
  })

  it('rejects widgets without widgetType', () => {
    const res = validateLayout([{ id: 'x', elType: 'widget' }])
    expect(res.success).toBe(false)
  })

  it('upgrades legacy section/column trees into containers', () => {
    const res = validateLayout([
      {
        id: 's1',
        elType: 'section',
        settings: {},
        elements: [
          { id: 'c1', elType: 'column', settings: { _column_size: 50 }, elements: [{ id: 'w1', elType: 'widget', widgetType: 'heading' }] },
        ],
      },
    ])
    expect(res.success).toBe(true)
    const section = res.data![0]!
    expect(section.elType).toBe('container')
    expect(section.settings.flex_direction).toBe('row')
    expect(section.elements[0]!.elType).toBe('container')
    expect(section.elements[0]!.settings.width).toEqual({ unit: '%', size: 50 })
  })

  it('parses JSON strings and rejects garbage', () => {
    expect(validateLayout('[]').success).toBe(true)
    expect(validateLayout('{nope').success).toBe(false)
  })
})

describe('ids', () => {
  it('regenerates duplicate ids', () => {
    const out = ensureUniqueIds([
      { id: 'dup', elType: 'container', settings: {}, elements: [{ id: 'dup', elType: 'container', settings: {}, elements: [] }] },
    ])
    expect(out[0]!.id).toBe('dup')
    expect(out[0]!.elements[0]!.id).not.toBe('dup')
  })
})

describe('tree helpers', () => {
  it('counts and collects types', () => {
    const layout = validateLayout([
      { elType: 'container', elements: [{ elType: 'widget', widgetType: 'form' }, { elType: 'widget', widgetType: 'heading' }] },
    ]).data!
    expect(countElements(layout)).toBe(3)
    expect([...collectTypes(layout)].sort()).toEqual(['container', 'form', 'heading'])
  })
})

describe('template envelope', () => {
  it('parses an exported file', () => {
    const res = parseTemplateEnvelope(
      JSON.stringify({ content: [], page_settings: [], version: '0.4', title: 'Header', type: 'header' }),
    )
    expect(res.success).toBe(true)
    expect(res.data!.page_settings).toEqual({})
    expect(res.data!.type).toBe('header')
  })
})

describe('conditions and tags', () => {
  it('parses condition strings', () => {
    expect(parseCondition('include/singular/pages/42')).toEqual({ mode: 'include', name: 'singular', args: ['pages', '42'] })
    expect(parseCondition('maybe/general')).toBeNull()
  })

  it('round-trips dynamic tag strings and reads the legacy prefix', () => {
    const s = buildTagString({ id: 't1', name: 'doc-title', settings: { before: '» ' } })
    expect(parseTagString(s)).toEqual({ id: 't1', name: 'doc-title', settings: { before: '» ' } })
    const legacy = '[elementor-tag id="9" name="post-title" settings="%7B%7D"]'
    expect(parseTagString(legacy)?.name).toBe('post-title')
  })

  it('parses global references', () => {
    expect(parseGlobalRef('globals/colors?id=primary')).toEqual({ group: 'colors', id: 'primary' })
    expect(parseGlobalRef('#fff')).toBeNull()
  })
})
