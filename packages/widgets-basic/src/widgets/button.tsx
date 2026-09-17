import {
  type RenderProps,
  background,
  border,
  borderRadius,
  boxShadow,
  choose,
  color,
  defineWidget,
  opts,
  padding,
  section,
  select,
  text,
  textShadow,
  typography,
  url,
  heading,
} from '@blockwright/core'
import { BwLink, linkAttrs } from '@blockwright/renderer'

const W = '{{WRAPPER}}'
const B = '{{WRAPPER}} .bw-btn'
const H = '{{WRAPPER}} .bw-btn:hover, {{WRAPPER}} .bw-btn:focus-visible'
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']

function Button({ settings, ctx }: RenderProps) {
  const label = String(settings.text ?? '')
  const link = linkAttrs(settings.link)
  const size = SIZES.includes(settings.size) ? settings.size : 'sm'
  const cls = `bw-btn bw-btn-${size}`
  const id = typeof settings.button_css_id === 'string' && /^[A-Za-z][\w-]*$/.test(settings.button_css_id) ? settings.button_css_id : undefined
  const content = <span className="bw-btn-text">{label}</span>
  if (link) {
    return (
      <BwLink ctx={ctx} href={link.href} className={cls} id={id} target={link.target} rel={link.rel} {...link.extra}>
        {content}
      </BwLink>
    )
  }
  return (
    <button type="button" className={cls} id={id}>
      {content}
    </button>
  )
}

export const button = defineWidget({
  type: 'button',
  title: 'Button',
  description: 'Call-to-action link styled as a button.',
  icon: 'button',
  category: 'essentials',
  keywords: ['button', 'cta', 'link', 'call to action'],
  render: Button as never,
  sections: [
    section('section_button', 'Button', [
      text('text', { label: 'Text', default: 'Click here', dynamic: ['text'] }),
      url('link', { label: 'Link', default: { url: '#' }, dynamic: ['url'] }),
      choose('align', {
        label: 'Alignment',
        responsive: true,
        options: opts({ left: 'Left', center: 'Center', right: 'Right', justify: 'Justified' }),
        selectorsDictionary: {
          left: 'text-align:left;--bw-btn-w:auto',
          center: 'text-align:center;--bw-btn-w:auto',
          right: 'text-align:right;--bw-btn-w:auto',
          justify: '--bw-btn-w:100%',
        },
        selectors: { [W]: '{{VALUE}};' },
      }),
      select('size', { label: 'Size', options: opts({ xs: 'Extra small', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' }), default: 'sm' }),
      text('button_css_id', { label: 'Button ID', description: 'Useful for analytics click tracking.' }),
    ]),
    section(
      'section_style',
      'Button',
      [
        ...typography('typography', { selector: B }),
        ...textShadow('text_shadow', { selector: B }),
        heading('heading_normal', 'Normal'),
        color('button_text_color', { label: 'Text color', global: 'colors', selectors: { [B]: 'color: {{VALUE}}; fill: {{VALUE}};' } }),
        ...background('background', { selector: B }),
        heading('heading_hover', 'Hover'),
        color('hover_color', { label: 'Text color', global: 'colors', selectors: { [H]: 'color: {{VALUE}};' } }),
        color('button_background_hover_color', { label: 'Background color', global: 'colors', selectors: { [H]: 'background-color: {{VALUE}};' } }),
        color('button_hover_border_color', { label: 'Border color', global: 'colors', condition: { 'border_border!': '' }, selectors: { [H]: 'border-color: {{VALUE}};' } }),
        ...border('border', { selector: B }),
        borderRadius('border_radius', { selector: B }),
        ...boxShadow('button_box_shadow', { selector: B }),
        padding('text_padding', B),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-w-button{--bw-btn-w:auto}.bw-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;width:var(--bw-btn-w);' +
    'padding:12px 24px;border:0;border-radius:3px;background-color:var(--bw-c-accent);color:#fff;fill:#fff;' +
    'font-family:var(--bw-t-accent-font-family,inherit);font-weight:var(--bw-t-accent-font-weight,500);font-size:15px;line-height:1;' +
    'text-decoration:none;cursor:pointer;transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s}' +
    '.bw-btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '.bw-btn-xs{padding:10px 20px;font-size:13px;border-radius:2px}.bw-btn-md{padding:15px 30px;font-size:16px;border-radius:4px}' +
    '.bw-btn-lg{padding:20px 40px;font-size:18px;border-radius:5px}.bw-btn-xl{padding:25px 50px;font-size:20px;border-radius:6px}',
})
