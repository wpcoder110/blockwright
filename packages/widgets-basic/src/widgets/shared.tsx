import { type Control, color, slider, typography } from '@blockwright/core'

/** Color + typography pair for a text part of a widget. */
export const textStyle = (prefix: string, selector: string, label: string, colorKey = `${prefix}_color`): Control[] => [
  color(colorKey, { label: `${label} color`, global: 'colors', selectors: { [selector]: 'color: {{VALUE}};' } }),
  ...typography(`${prefix}_typography`, { selector, label: `${label} typography` }),
]

export const spacing = (name: string, label: string, selector: string, prop: string): Control =>
  slider(name, { label, responsive: true, units: ['px', 'em', 'rem', 'custom'], selectors: { [selector]: `${prop}: {{SIZE}}{{UNIT}};` } })

export const TAG_OPTIONS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p']
export const safeTag = (v: unknown, fallback = 'h3') => (TAG_OPTIONS.includes(String(v)) ? String(v) : fallback) as 'h3'

export const truthy = (v: unknown) => v === 'yes' || v === 'true' || v === true || v === 'on'
