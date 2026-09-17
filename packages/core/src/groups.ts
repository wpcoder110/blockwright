/**
 * Group controls expand into several prefixed settings, using the same key
 * naming as the common page-builder JSON format (e.g. `title_typography_font_size`).
 */
import { type Control, type ControlCondition, color, dimensions, font, media, opts, select, slider } from './controls'

interface GroupOpts {
  /** Selector template for the group, e.g. `{{WRAPPER}} .bw-heading`. */
  selector: string
  label?: string
  condition?: ControlCondition
  /** Exclude sub-controls by short name, e.g. ['font_family']. */
  exclude?: string[]
}

const withCond = (c: Control, extra?: ControlCondition): Control =>
  extra || c.condition ? { ...c, condition: { ...(c.condition ?? {}), ...(extra ?? {}) } } : c

/* ---------------------------------------------------------------- */
/* Typography                                                        */
/* ---------------------------------------------------------------- */

export const FONT_WEIGHTS = opts({
  '': 'Default',
  '100': '100 (Thin)',
  '200': '200 (Extra light)',
  '300': '300 (Light)',
  '400': '400 (Normal)',
  '500': '500 (Medium)',
  '600': '600 (Semi bold)',
  '700': '700 (Bold)',
  '800': '800 (Extra bold)',
  '900': '900 (Black)',
  normal: 'Normal',
  bold: 'Bold',
})

export function typography(name: string, o: GroupOpts): Control[] {
  const p = name
  const s = o.selector
  const toggle = `${p}_typography`
  const on = { [toggle]: 'custom' }
  const ex = new Set(o.exclude ?? [])
  const list: Control[] = [
    { name: toggle, type: 'popover-toggle', label: o.label ?? 'Typography', global: 'typography', default: '' },
    font(`${p}_font_family`, { label: 'Family', selectors: { [s]: 'font-family: "{{VALUE}}", system-ui, sans-serif;' } }),
    slider(`${p}_font_size`, {
      label: 'Size',
      responsive: true,
      units: ['px', 'em', 'rem', 'vw', 'custom'],
      range: { px: { min: 1, max: 200 } },
      selectors: { [s]: 'font-size: {{SIZE}}{{UNIT}};' },
    }),
    select(`${p}_font_weight`, { label: 'Weight', options: FONT_WEIGHTS, selectors: { [s]: 'font-weight: {{VALUE}};' } }),
    select(`${p}_text_transform`, {
      label: 'Transform',
      options: opts({ '': 'Default', uppercase: 'Uppercase', lowercase: 'Lowercase', capitalize: 'Capitalize', none: 'Normal' }),
      selectors: { [s]: 'text-transform: {{VALUE}};' },
    }),
    select(`${p}_font_style`, {
      label: 'Style',
      options: opts({ '': 'Default', normal: 'Normal', italic: 'Italic', oblique: 'Oblique' }),
      selectors: { [s]: 'font-style: {{VALUE}};' },
    }),
    select(`${p}_text_decoration`, {
      label: 'Decoration',
      options: opts({ '': 'Default', underline: 'Underline', overline: 'Overline', 'line-through': 'Line through', none: 'None' }),
      selectors: { [s]: 'text-decoration: {{VALUE}};' },
    }),
    slider(`${p}_line_height`, {
      label: 'Line height',
      responsive: true,
      units: ['px', 'em', 'rem', 'custom'],
      selectors: { [s]: 'line-height: {{SIZE}}{{UNIT}};' },
    }),
    slider(`${p}_letter_spacing`, {
      label: 'Letter spacing',
      responsive: true,
      units: ['px', 'em', 'rem', 'custom'],
      selectors: { [s]: 'letter-spacing: {{SIZE}}{{UNIT}};' },
    }),
    slider(`${p}_word_spacing`, {
      label: 'Word spacing',
      responsive: true,
      units: ['px', 'em', 'rem', 'custom'],
      selectors: { [s]: 'word-spacing: {{SIZE}}{{UNIT}};' },
    }),
  ]
  return list
    .filter((c) => c.name === toggle || !ex.has(c.name.slice(p.length + 1)))
    .map((c) => (c.name === toggle ? withCond(c, o.condition) : withCond({ ...c, group: toggle }, { ...on, ...(o.condition ?? {}) })))
    .map((c) => (c.name === toggle ? { ...c, selectors: { [s]: '' } } : c))
}

/* ---------------------------------------------------------------- */
/* Background                                                        */
/* ---------------------------------------------------------------- */

export function background(name: string, o: GroupOpts & { types?: Array<'classic' | 'gradient'> }): Control[] {
  const p = name
  const s = o.selector
  const type = `${p}_background`
  const g = `linear-gradient({{${p}_gradient_angle.SIZE}}deg, {{${p}_color.VALUE}} {{${p}_color_stop.SIZE}}%, {{${p}_color_b.VALUE}} {{${p}_color_b_stop.SIZE}}%)`
  const r = `radial-gradient(at {{${p}_gradient_position.VALUE}}, {{${p}_color.VALUE}} {{${p}_color_stop.SIZE}}%, {{${p}_color_b.VALUE}} {{${p}_color_b_stop.SIZE}}%)`
  const list: Control[] = [
    select(type, {
      label: o.label ?? 'Background type',
      options: opts({ '': 'None', classic: 'Classic', gradient: 'Gradient' }),
      default: '',
    }),
    color(`${p}_color`, {
      label: 'Color',
      global: 'colors',
      condition: { [type]: ['classic', 'gradient'] },
      selectors: { [s]: 'background-color: {{VALUE}};' },
    }),
    media(`${p}_image`, {
      label: 'Image',
      responsive: true,
      dynamic: ['image'],
      condition: { [type]: 'classic' },
      selectors: { [s]: 'background-image: url("{{URL}}");' },
    }),
    select(`${p}_position`, {
      label: 'Position',
      responsive: true,
      options: opts(['', 'center center', 'center left', 'center right', 'top center', 'top left', 'top right', 'bottom center', 'bottom left', 'bottom right']),
      condition: { [type]: 'classic' },
      selectors: { [s]: 'background-position: {{VALUE}};' },
    }),
    select(`${p}_attachment`, {
      label: 'Attachment',
      options: opts({ '': 'Default', scroll: 'Scroll', fixed: 'Fixed' }),
      condition: { [type]: 'classic' },
      selectors: { [s]: 'background-attachment: {{VALUE}};' },
    }),
    select(`${p}_repeat`, {
      label: 'Repeat',
      responsive: true,
      options: opts({ '': 'Default', 'no-repeat': 'No-repeat', repeat: 'Repeat', 'repeat-x': 'Repeat-x', 'repeat-y': 'Repeat-y' }),
      condition: { [type]: 'classic' },
      selectors: { [s]: 'background-repeat: {{VALUE}};' },
    }),
    select(`${p}_size`, {
      label: 'Display size',
      responsive: true,
      options: opts({ '': 'Default', auto: 'Auto', cover: 'Cover', contain: 'Contain' }),
      condition: { [type]: 'classic' },
      selectors: { [s]: 'background-size: {{VALUE}};' },
    }),
    color(`${p}_color_b`, { label: 'Second color', default: '#f2295b', global: 'colors', condition: { [type]: 'gradient' } }),
    slider(`${p}_color_stop`, { label: 'Location', units: ['%'], default: { unit: '%', size: 0 }, condition: { [type]: 'gradient' } }),
    slider(`${p}_color_b_stop`, { label: 'Second location', units: ['%'], default: { unit: '%', size: 100 }, condition: { [type]: 'gradient' } }),
    select(`${p}_gradient_type`, {
      label: 'Gradient type',
      options: opts({ linear: 'Linear', radial: 'Radial' }),
      default: 'linear',
      condition: { [type]: 'gradient' },
    }),
    slider(`${p}_gradient_angle`, {
      label: 'Angle',
      units: ['deg'],
      default: { unit: 'deg', size: 180 },
      cssDefault: true,
      condition: { [type]: 'gradient', [`${p}_gradient_type`]: 'linear' },
      selectors: { [s]: `background-color: transparent; background-image: ${g};` },
    }),
    select(`${p}_gradient_position`, {
      label: 'Position',
      options: opts(['center center', 'center left', 'center right', 'top center', 'top left', 'top right', 'bottom center', 'bottom left', 'bottom right']),
      default: 'center center',
      cssDefault: true,
      condition: { [type]: 'gradient', [`${p}_gradient_type`]: 'radial' },
      selectors: { [s]: `background-color: transparent; background-image: ${r};` },
    }),
  ]
  return list.map((c) => withCond(c.name === type ? c : { ...c, group: type }, o.condition))
}

/* ---------------------------------------------------------------- */
/* Border / radius / shadow                                          */
/* ---------------------------------------------------------------- */

export function border(name: string, o: GroupOpts): Control[] {
  const p = name
  const s = o.selector
  const type = `${p}_border`
  return [
    select(type, {
      label: o.label ?? 'Border type',
      options: opts({ '': 'Default', none: 'None', solid: 'Solid', double: 'Double', dotted: 'Dotted', dashed: 'Dashed', groove: 'Groove' }),
      selectors: { [s]: 'border-style: {{VALUE}};' },
    }),
    dimensions(`${p}_width`, {
      label: 'Width',
      responsive: true,
      units: ['px', 'em', 'rem', 'vw', 'custom'],
      condition: { [`${type}!`]: ['', 'none'] },
      selectors: { [s]: 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' },
    }),
    color(`${p}_color`, {
      label: 'Color',
      global: 'colors',
      condition: { [`${type}!`]: ['', 'none'] },
      selectors: { [s]: 'border-color: {{VALUE}};' },
    }),
  ].map((c) => withCond(c.name === type ? c : { ...c, group: type }, o.condition))
}

export function borderRadius(name: string, o: GroupOpts): Control {
  return dimensions(name, {
    label: o.label ?? 'Border radius',
    responsive: true,
    units: ['px', '%', 'em', 'rem', 'custom'],
    condition: o.condition,
    selectors: { [o.selector]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' },
  })
}

export function boxShadow(name: string, o: GroupOpts): Control[] {
  const p = name
  const toggle = `${p}_box_shadow_type`
  const list: Control[] = [
    { name: toggle, type: 'popover-toggle', label: o.label ?? 'Box shadow', default: '' },
    {
      name: `${p}_box_shadow`,
      type: 'box-shadow',
      label: 'Box shadow',
      group: toggle,
      default: { horizontal: 0, vertical: 0, blur: 10, spread: 0, color: 'rgba(0,0,0,0.5)' },
      cssDefault: true,
      condition: { [toggle]: 'yes' },
      selectors: {
        [o.selector]:
          'box-shadow: {{HORIZONTAL}}px {{VERTICAL}}px {{BLUR}}px {{SPREAD}}px {{COLOR}} {{' + p + '_box_shadow_position.VALUE}};',
      },
    },
    select(`${p}_box_shadow_position`, {
      label: 'Position',
      group: toggle,
      options: opts({ '': 'Outline', inset: 'Inset' }),
      default: '',
      condition: { [toggle]: 'yes' },
    }),
  ]
  return list.map((c) => withCond(c, o.condition))
}

export function textShadow(name: string, o: GroupOpts): Control[] {
  const p = name
  const toggle = `${p}_text_shadow_type`
  const list: Control[] = [
    { name: toggle, type: 'popover-toggle', label: o.label ?? 'Text shadow', default: '' },
    {
      name: `${p}_text_shadow`,
      type: 'box-shadow',
      label: 'Text shadow',
      group: toggle,
      default: { horizontal: 0, vertical: 0, blur: 10, color: 'rgba(0,0,0,0.3)' },
      cssDefault: true,
      condition: { [toggle]: 'yes' },
      selectors: { [o.selector]: 'text-shadow: {{HORIZONTAL}}px {{VERTICAL}}px {{BLUR}}px {{COLOR}};' },
    },
  ]
  return list.map((c) => withCond(c, o.condition))
}

/** Padding control with the standard selector. */
export function padding(name: string, selector: string, label = 'Padding', extra: Partial<Control> = {}): Control {
  return dimensions(name, {
    label,
    responsive: true,
    selectors: { [selector]: 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' },
    ...extra,
  })
}

export function margin(name: string, selector: string, label = 'Margin', extra: Partial<Control> = {}): Control {
  return dimensions(name, {
    label,
    responsive: true,
    selectors: { [selector]: 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' },
    ...extra,
  })
}
