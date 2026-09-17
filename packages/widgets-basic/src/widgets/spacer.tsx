import { defineWidget, section, slider } from '@blockwright/core'

export const spacer = defineWidget({
  type: 'spacer',
  title: 'Spacer',
  description: 'Empty vertical space between elements.',
  icon: 'spacer',
  category: 'essentials',
  keywords: ['space', 'gap', 'spacer'],
  render: () => <div className="bw-spacer" aria-hidden="true" />,
  sections: [
    section('section_spacer', 'Spacer', [
      slider('space', {
        label: 'Space',
        responsive: true,
        units: ['px', 'vh', 'em', 'rem', 'custom'],
        default: { unit: 'px', size: 50 },
        selectors: { '{{WRAPPER}}': '--bw-space: {{SIZE}}{{UNIT}};' },
      }),
    ]),
  ],
  baseCss: '.bw-spacer{height:var(--bw-space,50px)}',
})
