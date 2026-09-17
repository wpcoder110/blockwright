import {
  type RenderProps,
  ALIGN_OPTIONS,
  choose,
  color,
  defineWidget,
  opts,
  section,
  select,
  text,
  textShadow,
  typography,
  url,
} from '@blockwright/core'
import { BwLink, linkAttrs } from '@blockwright/renderer'

const W = '{{WRAPPER}}'
const S = '{{WRAPPER}} .bw-heading'
const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p']

function Heading({ settings, ctx }: RenderProps) {
  const Tag = (TAGS.includes(settings.header_size) ? settings.header_size : 'h2') as 'h2'
  const title = String(settings.title ?? '')
  if (!title && ctx.mode === 'live') return null
  const link = linkAttrs(settings.link)
  return (
    <Tag className="bw-heading">
      {link ? (
        <BwLink ctx={ctx} href={link.href} target={link.target} rel={link.rel} {...link.extra}>
          {title}
        </BwLink>
      ) : (
        title
      )}
    </Tag>
  )
}

export const heading = defineWidget({
  type: 'heading',
  title: 'Heading',
  description: 'Title text with a semantic heading tag.',
  icon: 'heading',
  category: 'essentials',
  keywords: ['title', 'heading', 'headline', 'h1', 'h2'],
  render: Heading as never,
  sections: [
    section('section_title', 'Title', [
      text('title', { label: 'Title', default: 'Add your heading here', dynamic: ['text'], labelBlock: true }),
      url('link', { label: 'Link', dynamic: ['url'] }),
      select('header_size', {
        label: 'HTML tag',
        options: opts(TAGS),
        default: 'h2',
        description: 'Use one H1 per page for the best SEO results.',
      }),
    ]),
    section(
      'section_title_style',
      'Title',
      [
        choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS, selectors: { [W]: 'text-align: {{VALUE}};' } }),
        color('title_color', { label: 'Text color', global: 'colors', selectors: { [S]: 'color: {{VALUE}};' } }),
        ...typography('typography', { selector: S }),
        ...textShadow('text_shadow', { selector: S }),
        color('title_hover_color', {
          label: 'Link hover color',
          global: 'colors',
          selectors: { [`${S} a:hover, ${S} a:focus-visible`]: 'color: {{VALUE}};' },
        }),
        select('blend_mode', {
          label: 'Blend mode',
          options: opts(['', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'difference', 'exclusion', 'hue', 'luminosity']),
          selectors: { [S]: 'mix-blend-mode: {{VALUE}};' },
        }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-heading{margin:0;padding:0;line-height:1.2;color:var(--bw-c-primary);font-family:var(--bw-t-primary-font-family,inherit);' +
    'font-weight:var(--bw-t-primary-font-weight,600);font-size:var(--bw-t-primary-font-size,revert)}' +
    '.bw-heading a{color:inherit;font:inherit;text-decoration:inherit}',
})
