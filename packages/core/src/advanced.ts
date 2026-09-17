import { background, border, borderRadius, boxShadow, margin, padding } from './groups'
import { type Section, code, dimensions, number, opts, section, select, slider, switcher, text, choose } from './controls'
import { type Breakpoints, DEFAULT_BREAKPOINTS } from './breakpoints'

const W = '{{WRAPPER}}'

export const ANIMATIONS = ['fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'zoomIn', 'slideInUp'] as const

const layoutControls = (prefix: '_' | '') => [
  margin(`${prefix}margin`, W),
  padding(`${prefix}padding`, W),
]

const positionControls = [
  select('_element_width', {
    label: 'Width',
    options: opts({ '': 'Default', inherit: 'Full width (100%)', auto: 'Inline (auto)', initial: 'Custom' }),
    selectorsDictionary: {
      inherit: 'width:100%;max-width:100%',
      auto: 'width:auto;max-width:none',
      initial: 'width:var(--bw-w,auto);max-width:100%',
    },
    responsive: true,
    selectors: { [W]: '{{VALUE}};' },
  }),
  slider('_element_custom_width', {
    label: 'Custom width',
    responsive: true,
    units: ['px', '%', 'vw', 'custom'],
    condition: { _element_width: 'initial' },
    selectors: { [W]: '--bw-w: {{SIZE}}{{UNIT}};' },
  }),
  choose('_flex_align_self', {
    label: 'Align self',
    responsive: true,
    options: opts({ 'flex-start': 'Start', center: 'Center', 'flex-end': 'End', stretch: 'Stretch' }),
    selectors: { [W]: 'align-self: {{VALUE}};' },
  }),
  choose('_flex_size', {
    label: 'Size',
    responsive: true,
    options: opts({ none: 'None', grow: 'Grow', shrink: 'Shrink' }),
    selectorsDictionary: { none: '0 0 auto', grow: '1 1 auto', shrink: '0 1 auto' },
    selectors: { [W]: 'flex: {{VALUE}};' },
  }),
  number('_flex_order_custom', { label: 'Order', responsive: true, selectors: { [W]: 'order: {{VALUE}};' } }),
  select('_position', {
    label: 'Position',
    options: opts({ '': 'Default', relative: 'Relative', absolute: 'Absolute', fixed: 'Fixed', sticky: 'Sticky' }),
    selectors: { [W]: 'position: {{VALUE}};' },
  }),
  slider('_offset_x', {
    label: 'Horizontal offset',
    responsive: true,
    condition: { '_position!': '' },
    units: ['px', '%', 'vw', 'custom'],
    selectors: { [W]: 'left: {{SIZE}}{{UNIT}};' },
  }),
  slider('_offset_y', {
    label: 'Vertical offset',
    responsive: true,
    condition: { '_position!': '' },
    units: ['px', '%', 'vh', 'custom'],
    selectors: { [W]: 'top: {{SIZE}}{{UNIT}};' },
  }),
  number('_z_index', { label: 'Z-index', responsive: true, selectors: { [W]: 'z-index: {{VALUE}};' } }),
  text('_element_id', { label: 'CSS ID', description: 'Unique id without the # sign.' }),
  text('_css_classes', { label: 'CSS classes', description: 'Separate classes with spaces, without the dot.' }),
]

const motionControls = [
  select('_animation', {
    label: 'Entrance animation',
    options: opts({ '': 'None', ...Object.fromEntries(ANIMATIONS.map((a) => [a, a.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())])) }),
  }),
  select('animation_duration', {
    label: 'Animation duration',
    options: opts({ slow: 'Slow', '': 'Normal', fast: 'Fast' }),
    condition: { '_animation!': '' },
  }),
]

const visibilityControls = [
  switcher('hide_desktop', { label: 'Hide on desktop', returnValue: 'hidden-desktop' }),
  switcher('hide_tablet', { label: 'Hide on tablet', returnValue: 'hidden-tablet' }),
  switcher('hide_mobile', { label: 'Hide on mobile', returnValue: 'hidden-mobile' }),
]

const customCss = [code('custom_css', { label: 'Custom CSS', language: 'css', restricted: true, description: 'Use "selector" to target this element.' })]

/** Advanced tab for widgets (keys prefixed with `_`). */
export const advancedSections: Section[] = [
  section('_section_style', 'Layout', [...layoutControls('_'), ...positionControls], { tab: 'advanced' }),
  section('section_effects', 'Motion effects', motionControls, { tab: 'advanced' }),
  section('_section_background', 'Background', background('_background', { selector: W }), { tab: 'advanced' }),
  section(
    '_section_border',
    'Border',
    [...border('_border', { selector: W }), borderRadius('_border_radius', { selector: W }), ...boxShadow('_box_shadow', { selector: W })],
    { tab: 'advanced' },
  ),
  section('_section_responsive', 'Responsive', visibilityControls, { tab: 'advanced' }),
  section('section_custom_css', 'Custom CSS', customCss, { tab: 'advanced' }),
]

/** Advanced tab for frames (containers use unprefixed margin/padding). */
export const containerAdvancedSections: Section[] = [
  section(
    'section_layout_advanced',
    'Layout',
    [
      margin('margin', W),
      padding('padding', W, 'Padding'),
      ...positionControls.filter((c) => !['_element_id', '_css_classes'].includes(c.name)),
      text('_element_id', { label: 'CSS ID' }),
      text('css_classes', { label: 'CSS classes' }),
    ],
    { tab: 'advanced' },
  ),
  section('section_effects', 'Motion effects', motionControls, { tab: 'advanced' }),
  section('_section_responsive', 'Responsive', visibilityControls, { tab: 'advanced' }),
  section('section_custom_css', 'Custom CSS', customCss, { tab: 'advanced' }),
]

/* ---------------------------------------------------------------- */
/* Shared base CSS, emitted only when a feature is used              */
/* ---------------------------------------------------------------- */

export const CORE_BASE_CSS =
  '.bw-content{display:flow-root}.bw-content *,.bw-content *::before,.bw-content *::after{box-sizing:border-box}' +
  '.bw-el{position:relative;min-width:0}.bw-content img{max-width:100%;height:auto}'

const ANIM_KEYFRAMES: Record<string, string> = {
  fadeIn: 'from{opacity:0}to{opacity:1}',
  fadeInUp: 'from{opacity:0;transform:translate3d(0,40px,0)}to{opacity:1;transform:none}',
  fadeInDown: 'from{opacity:0;transform:translate3d(0,-40px,0)}to{opacity:1;transform:none}',
  fadeInLeft: 'from{opacity:0;transform:translate3d(-40px,0,0)}to{opacity:1;transform:none}',
  fadeInRight: 'from{opacity:0;transform:translate3d(40px,0,0)}to{opacity:1;transform:none}',
  zoomIn: 'from{opacity:0;transform:scale3d(.85,.85,.85)}to{opacity:1;transform:none}',
  slideInUp: 'from{transform:translate3d(0,100%,0)}to{transform:none}',
}

/**
 * Entrance animations use CSS scroll-driven animations: zero JavaScript, and
 * browsers without support (or users preferring reduced motion) simply see the content.
 */
export function animationCss(names: Iterable<string>): string {
  const list = [...new Set(names)].filter((n) => n in ANIM_KEYFRAMES)
  if (!list.length) return ''
  const kf = list.map((n) => `@keyframes bw-${n}{${ANIM_KEYFRAMES[n]}}`).join('')
  const cls = list.map((n) => `.bw-anim-${n}{animation:bw-${n} linear both;animation-timeline:view();animation-range:entry 0 entry 160px}`).join('')
  const dur = '.bw-anim-fast{animation-range:entry 0 entry 80px}.bw-anim-slow{animation-range:entry 0 entry 320px}'
  return `@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){${kf}${cls}${dur}}}`
}

export function visibilityCss(devices: Iterable<'desktop' | 'tablet' | 'mobile'>, bp: Breakpoints = DEFAULT_BREAKPOINTS): string {
  const tablet = bp.tablet.value
  const mobile = bp.mobile.value
  const out: string[] = []
  for (const d of new Set(devices)) {
    if (d === 'desktop') out.push(`@media (min-width:${tablet + 1}px){.bw-hide-desktop{display:none!important}}`)
    if (d === 'tablet') out.push(`@media (min-width:${mobile + 1}px) and (max-width:${tablet}px){.bw-hide-tablet{display:none!important}}`)
    if (d === 'mobile') out.push(`@media (max-width:${mobile}px){.bw-hide-mobile{display:none!important}}`)
  }
  return out.join('')
}
