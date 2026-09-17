import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BREAKPOINTS,
  DEFAULT_KIT,
  evaluateCondition,
  getResponsiveValue,
  kitToCss,
  resolveTemplate,
  sanitizeCssValue,
  substitute,
} from '../src'

describe('conditions', () => {
  it('supports equality, lists and negation', () => {
    expect(evaluateCondition({ a: 'x' }, { a: 'x' })).toBe(true)
    expect(evaluateCondition({ a: ['x', 'y'] }, { a: 'y' })).toBe(true)
    expect(evaluateCondition({ 'a!': '' }, { a: '' })).toBe(false)
    expect(evaluateCondition({ 'a!': ['', 'none'] }, { a: 'solid' })).toBe(true)
    expect(evaluateCondition({ actions: 'email' }, { actions: ['save', 'email'] })).toBe(true)
  })
})

describe('responsive values', () => {
  it('inherit from larger devices', () => {
    const s = { size: 'a', size_tablet: 'b' }
    expect(getResponsiveValue(s, 'size', 'mobile', DEFAULT_BREAKPOINTS)).toBe('b')
    expect(getResponsiveValue(s, 'size', 'desktop', DEFAULT_BREAKPOINTS)).toBe('a')
  })
})

describe('css helpers', () => {
  it('substitutes tokens and skips missing values', () => {
    expect(substitute('padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}};', { unit: 'em', top: 1, right: '' }, {}, 'desktop')).toBe('padding: 1em 0em;')
    expect(substitute('width: {{SIZE}}{{UNIT}};', { unit: 'px', size: '' }, {}, 'desktop')).toBeNull()
    expect(substitute('width: {{SIZE}}{{UNIT}};', { unit: 'custom', size: 'calc(100% - 2rem)' }, {}, 'desktop')).toBe('width: calc(100% - 2rem);')
    expect(substitute('c: {{other.VALUE}};', 'x', { other: '#fff' }, 'desktop')).toBe('c: #fff;')
    expect(substitute('c: {{other.VALUE}};', 'x', { __globals__: { other: 'globals/colors?id=text' } }, 'desktop')).toBe('c: var(--bw-c-text);')
  })

  it('sanitises values and builds kit variables', () => {
    expect(sanitizeCssValue('red;}</style><script>')).toBe('red/stylescript')
    const css = kitToCss({ ...DEFAULT_KIT, customCss: 'body{margin:0}</style><script>x</script>' })
    expect(css).toContain('--bw-c-primary:#1d3557')
    expect(css).toContain('--bw-t-primary-font-family:"Inter",system-ui,sans-serif')
    expect(css).toContain('--bw-container:1140px')
    expect(css).not.toContain('</style>')
  })
})

describe('theme templates', () => {
  const templates = [
    { id: 1, type: 'header', conditions: ['include/general'], updatedAt: '2026-01-01' },
    { id: 2, type: 'header', conditions: ['include/singular/pages/9'], updatedAt: '2026-01-01' },
    { id: 3, type: 'footer', conditions: ['include/general', 'exclude/singular/pages/9'] },
    { id: 4, type: 'error-404', conditions: ['include/not_found404'] },
    { id: 5, type: 'header', conditions: ['include/general'], updatedAt: '2026-02-01' },
  ]

  it('prefers the most specific, then the newest', () => {
    expect(resolveTemplate(templates, 'header', { kind: 'singular', collection: 'pages', id: 9 })?.id).toBe(2)
    expect(resolveTemplate(templates, 'header', { kind: 'singular', collection: 'pages', id: 1 })?.id).toBe(5)
  })

  it('honours exclusions and special pages', () => {
    expect(resolveTemplate(templates, 'footer', { kind: 'singular', collection: 'pages', id: 9 })).toBeNull()
    expect(resolveTemplate(templates, 'footer', { kind: 'archive', collection: 'posts' })?.id).toBe(3)
    expect(resolveTemplate(templates, 'error-404', { kind: 'not-found' })?.id).toBe(4)
    expect(resolveTemplate(templates, 'error-404', { kind: 'singular' })).toBeNull()
  })
})
