import type { ReactNode } from 'react'
import {
  type RenderProps,
  background,
  border,
  borderRadius,
  boxShadow,
  choose,
  defineElement,
  gaps,
  opts,
  section,
  select,
  slider,
  url,
} from '@blockwright/core'
import { linkAttrs } from '@blockwright/renderer'

const W = '{{WRAPPER}}'
const TAGS = ['div', 'section', 'header', 'footer', 'main', 'article', 'aside', 'nav', 'a'] as const
type Tag = (typeof TAGS)[number]

function Frame({ settings, wrapper, children, element, ctx }: RenderProps & { children?: ReactNode }) {
  const tag: Tag = (TAGS as readonly string[]).includes(settings.html_tag) ? settings.html_tag : 'div'
  // top-level frames are boxed by default, nested frames are full width
  const width = settings.content_width || (element.isInner ? 'full' : 'boxed')
  const boxed = width === 'boxed'
  const classes = [wrapper.className, boxed ? 'bw-boxed' : '', settings.container_type === 'grid' ? 'bw-grid' : ''].filter(Boolean).join(' ')
  const { className: _c, ...attrs } = wrapper
  const link = tag === 'a' ? linkAttrs(settings.link) : null
  const Tag = (tag === 'a' && !link ? 'div' : tag) as 'div'
  const extra: Record<string, unknown> = link ? { href: link.href, target: link.target, rel: link.rel, ...link.extra } : {}
  const empty = !children && ctx.mode === 'edit' ? <div className="bw-frame-empty" /> : null
  return (
    <Tag className={classes} {...(attrs as Record<string, unknown>)} {...extra}>
      {boxed ? <div className="bw-inner">{children ?? empty}</div> : (children ?? empty)}
    </Tag>
  )
}

export const frame = defineElement({
  type: 'container',
  elType: 'container',
  title: 'Frame',
  description: 'Flexible box that holds and arranges other elements in rows, columns or a grid.',
  icon: 'frame',
  category: 'layout',
  keywords: ['container', 'section', 'row', 'column', 'grid', 'flex', 'box'],
  wrapper: false,
  render: Frame as never,
  sections: [
    section('section_layout_container', 'Layout', [
      select('container_type', { label: 'Layout', options: opts({ flex: 'Flexbox', grid: 'Grid' }), default: 'flex' }),
      select('content_width', {
        label: 'Content width',
        options: opts({ '': 'Auto', boxed: 'Boxed', full: 'Full width' }),
        default: '',
      }),
      slider('width', {
        label: 'Width',
        responsive: true,
        units: ['px', '%', 'vw', 'custom'],
        selectors: { [W]: '--bw-width: {{SIZE}}{{UNIT}};' },
      }),
      slider('boxed_width', {
        label: 'Content box width',
        responsive: true,
        units: ['px', '%', 'vw', 'custom'],
        condition: { 'content_width!': 'full' },
        selectors: { [W]: '--bw-boxed: {{SIZE}}{{UNIT}};' },
      }),
      slider('min_height', {
        label: 'Min height',
        responsive: true,
        units: ['px', 'vh', 'em', 'rem', 'custom'],
        selectors: { [W]: '--bw-min-h: {{SIZE}}{{UNIT}};' },
      }),
    ]),
    section(
      'section_flex',
      'Items',
      [
        choose('flex_direction', {
          label: 'Direction',
          responsive: true,
          options: opts({ row: 'Row', column: 'Column', 'row-reverse': 'Row reversed', 'column-reverse': 'Column reversed' }),
          selectors: { [W]: '--bw-dir: {{VALUE}};' },
        }),
        choose('flex_justify_content', {
          label: 'Justify content',
          responsive: true,
          options: opts({ 'flex-start': 'Start', center: 'Center', 'flex-end': 'End', 'space-between': 'Space between', 'space-around': 'Space around', 'space-evenly': 'Space evenly' }),
          selectors: { [W]: '--bw-justify: {{VALUE}};' },
        }),
        choose('flex_align_items', {
          label: 'Align items',
          responsive: true,
          options: opts({ 'flex-start': 'Start', center: 'Center', 'flex-end': 'End', stretch: 'Stretch' }),
          selectors: { [W]: '--bw-align: {{VALUE}};' },
        }),
        gaps('flex_gap', {
          label: 'Gaps',
          responsive: true,
          selectors: { [W]: '--bw-gap-row: {{ROW}}{{UNIT}}; --bw-gap-col: {{COLUMN}}{{UNIT}};' },
        }),
        choose('flex_wrap', {
          label: 'Wrap',
          responsive: true,
          options: opts({ nowrap: 'No wrap', wrap: 'Wrap' }),
          selectors: { [W]: '--bw-wrap: {{VALUE}};' },
        }),
      ],
      { condition: { 'container_type!': 'grid' } },
    ),
    section(
      'section_grid',
      'Grid',
      [
        slider('grid_columns_grid', {
          label: 'Columns',
          responsive: true,
          units: ['fr'],
          default: { unit: 'fr', size: 3 },
          selectors: { [W]: '--bw-cols: repeat({{SIZE}}, minmax(0, 1fr));' },
        }),
        slider('grid_rows_grid', {
          label: 'Rows',
          responsive: true,
          units: ['fr'],
          selectors: { [W]: '--bw-rows: repeat({{SIZE}}, auto);' },
        }),
        gaps('grid_gaps', {
          label: 'Gaps',
          responsive: true,
          selectors: { [W]: '--bw-gap-row: {{ROW}}{{UNIT}}; --bw-gap-col: {{COLUMN}}{{UNIT}};' },
        }),
        select('grid_auto_flow', {
          label: 'Auto flow',
          responsive: true,
          options: opts({ row: 'Row', column: 'Column', dense: 'Dense' }),
          selectors: { [W]: '--bw-flow: {{VALUE}};' },
        }),
        choose('grid_justify_items', {
          label: 'Justify items',
          responsive: true,
          options: opts({ start: 'Start', center: 'Center', end: 'End', stretch: 'Stretch' }),
          selectors: { [W]: '--bw-justify-items: {{VALUE}};' },
        }),
        choose('grid_align_items', {
          label: 'Align items',
          responsive: true,
          options: opts({ start: 'Start', center: 'Center', end: 'End', stretch: 'Stretch' }),
          selectors: { [W]: '--bw-align: {{VALUE}};' },
        }),
      ],
      { condition: { container_type: 'grid' } },
    ),
    section('section_layout_additional_options', 'Additional options', [
      select('overflow', { label: 'Overflow', options: opts({ '': 'Default', hidden: 'Hidden', auto: 'Auto' }), selectors: { [W]: 'overflow: {{VALUE}};' } }),
      select('html_tag', { label: 'HTML tag', options: opts(TAGS.map(String)), default: 'div', description: 'Use semantic tags (header, main, section…) for better SEO and accessibility.' }),
      url('link', { label: 'Link', dynamic: ['url'], condition: { html_tag: 'a' } }),
    ]),
    section('section_background', 'Background', background('background', { selector: W }), { tab: 'style' }),
    section(
      'section_border',
      'Border',
      [...border('border', { selector: W }), borderRadius('border_radius', { selector: W }), ...boxShadow('box_shadow', { selector: W })],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-frame{--bw-dir:column;--bw-wrap:nowrap;--bw-justify:flex-start;--bw-align:stretch;--bw-justify-items:stretch;--bw-flow:row;' +
    '--bw-gap-row:var(--bw-gap,20px);--bw-gap-col:var(--bw-gap,20px);--bw-width:100%;--bw-min-h:auto;--bw-boxed:var(--bw-container,1140px);' +
    '--bw-cols:repeat(3,minmax(0,1fr));--bw-rows:auto;position:relative;min-width:0;width:var(--bw-width);max-width:100%;' +
    'min-height:var(--bw-min-h);padding:10px}' +
    '.bw-frame:not(.bw-boxed),.bw-boxed>.bw-inner{display:flex;flex-direction:var(--bw-dir);flex-wrap:var(--bw-wrap);' +
    'justify-content:var(--bw-justify);align-items:var(--bw-align);gap:var(--bw-gap-row) var(--bw-gap-col)}' +
    '.bw-grid:not(.bw-boxed),.bw-grid.bw-boxed>.bw-inner{display:grid;grid-template-columns:var(--bw-cols);' +
    'grid-template-rows:var(--bw-rows);grid-auto-flow:var(--bw-flow);justify-items:var(--bw-justify-items)}' +
    '.bw-boxed>.bw-inner{width:100%;max-width:min(100%,var(--bw-boxed));margin-inline:auto;min-height:inherit}' +
    'a.bw-frame{color:inherit;text-decoration:none}' +
    '.bw-frame-empty{min-height:80px;border:1px dashed #b7bcc4;border-radius:4px;flex:1}',
})
