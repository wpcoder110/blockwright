import { ALIGN_OPTIONS, choose, color, defineWidget, opts, section, select, slider } from '@blockwright/core'

const W = '{{WRAPPER}}'

export const divider = defineWidget({
  type: 'divider',
  title: 'Divider',
  description: 'Horizontal line that separates content.',
  icon: 'divider',
  category: 'essentials',
  keywords: ['divider', 'line', 'separator', 'hr'],
  render: () => <hr className="bw-divider" />,
  sections: [
    section('section_divider', 'Divider', [
      select('style', {
        label: 'Style',
        options: opts({ solid: 'Solid', double: 'Double', dotted: 'Dotted', dashed: 'Dashed' }),
        default: 'solid',
        selectors: { [W]: '--bw-div-style: {{VALUE}};' },
      }),
      slider('width', { label: 'Width', responsive: true, units: ['%', 'px', 'vw', 'custom'], selectors: { [W]: '--bw-div-width: {{SIZE}}{{UNIT}};' } }),
      choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [W]: 'text-align: {{VALUE}};' } }),
    ]),
    section(
      'section_divider_style',
      'Divider',
      [
        color('color', { label: 'Color', global: 'colors', selectors: { [W]: '--bw-div-color: {{VALUE}};' } }),
        slider('weight', { label: 'Weight', units: ['px', 'em', 'rem', 'custom'], selectors: { [W]: '--bw-div-w: {{SIZE}}{{UNIT}};' } }),
        slider('gap', { label: 'Gap', responsive: true, units: ['px', 'em', 'rem', 'custom'], selectors: { [W]: '--bw-div-gap: {{SIZE}}{{UNIT}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-divider{display:inline-block;vertical-align:middle;border:0;border-top:var(--bw-div-w,1px) var(--bw-div-style,solid) var(--bw-div-color,var(--bw-c-secondary,#ccc));' +
    'width:var(--bw-div-width,100%);margin:var(--bw-div-gap,15px) 0}',
})
