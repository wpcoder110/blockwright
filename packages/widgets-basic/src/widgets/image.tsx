import {
  type RenderProps,
  ALIGN_OPTIONS,
  border,
  borderRadius,
  boxShadow,
  choose,
  color,
  defineWidget,
  media,
  number,
  opts,
  section,
  select,
  slider,
  switcher,
  text,
  typography,
  url,
} from '@blockwright/core'
import type { MediaValue } from '@blockwright/schema'
import { BwImage, BwLink, linkAttrs } from '@blockwright/renderer'

const W = '{{WRAPPER}}'
const I = '{{WRAPPER}} img'

function Image({ settings, ctx }: RenderProps) {
  const m = (settings.image ?? {}) as MediaValue
  if (!m.url) {
    return ctx.mode === 'live' ? null : <div className="bw-image-placeholder" aria-hidden="true" />
  }
  const alt = typeof settings.bw_alt === 'string' && settings.bw_alt ? settings.bw_alt : (m.alt ?? '')
  const img = (
    <BwImage
      ctx={ctx}
      src={m.url}
      alt={alt}
      width={m.width}
      height={m.height}
      className="bw-image"
      priority={settings.bw_priority === 'yes'}
      sizes={typeof settings.bw_sizes === 'string' && settings.bw_sizes ? settings.bw_sizes : undefined}
    />
  )
  const linkValue = settings.link_to === 'file' ? { url: m.url } : settings.link_to === 'custom' ? settings.link : null
  const link = linkAttrs(linkValue)
  const linked = link ? (
    <BwLink ctx={ctx} href={link.href} target={link.target} rel={link.rel} {...link.extra}>
      {img}
    </BwLink>
  ) : (
    img
  )
  const caption = settings.caption_source === 'custom' ? String(settings.caption ?? '') : settings.caption_source === 'attachment' ? String((m as { caption?: string }).caption ?? '') : ''
  if (!caption) return linked
  return (
    <figure className="bw-figure">
      {linked}
      <figcaption className="bw-caption">{caption}</figcaption>
    </figure>
  )
}

export const image = defineWidget({
  type: 'image',
  title: 'Image',
  description: 'Responsive, lazy-loaded image with optional caption and link.',
  icon: 'image',
  category: 'media',
  keywords: ['image', 'photo', 'picture', 'img'],
  render: Image as never,
  sections: [
    section('section_image', 'Image', [
      media('image', { label: 'Choose image', dynamic: ['image'], default: { url: '' } }),
      text('bw_alt', { label: 'Alt text', description: 'Describe the image for screen readers and search engines. Leave empty to use the media library alt text.', dynamic: ['text'] }),
      choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [W]: 'text-align: {{VALUE}};' } }),
      select('caption_source', { label: 'Caption', options: opts({ none: 'None', attachment: 'Media caption', custom: 'Custom caption' }), default: 'none' }),
      text('caption', { label: 'Custom caption', dynamic: ['text'], condition: { caption_source: 'custom' } }),
      select('link_to', { label: 'Link', options: opts({ none: 'None', file: 'Media file', custom: 'Custom URL' }), default: 'none' }),
      url('link', { label: 'URL', dynamic: ['url'], condition: { link_to: 'custom' } }),
      switcher('bw_priority', { label: 'Load first', description: 'Turn on for the main image at the top of the page to improve Largest Contentful Paint.' }),
      text('bw_sizes', { label: 'Sizes attribute', placeholder: '(max-width: 767px) 100vw, 50vw', description: 'Optional. Tells the browser how wide the image will be, so it can download a smaller file.' }),
    ]),
    section(
      'section_style_image',
      'Image',
      [
        slider('width', { label: 'Width', responsive: true, units: ['%', 'px', 'vw', 'custom'], selectors: { [I]: 'width: {{SIZE}}{{UNIT}};' } }),
        slider('space', { label: 'Max width', responsive: true, units: ['%', 'px', 'vw', 'custom'], selectors: { [I]: 'max-width: {{SIZE}}{{UNIT}};' } }),
        slider('height', { label: 'Height', responsive: true, units: ['px', 'vh', 'custom'], selectors: { [I]: 'height: {{SIZE}}{{UNIT}};' } }),
        select('object-fit', {
          label: 'Object fit',
          responsive: true,
          options: opts({ '': 'Default', fill: 'Fill', cover: 'Cover', contain: 'Contain', 'scale-down': 'Scale down' }),
          selectors: { [I]: 'object-fit: {{VALUE}};' },
        }),
        number('opacity', { label: 'Opacity', selectors: { [I]: 'opacity: {{VALUE}};' } }),
        ...border('image_border', { selector: I }),
        borderRadius('image_border_radius', { selector: I }),
        ...boxShadow('image_box_shadow', { selector: I }),
      ],
      { tab: 'style' },
    ),
    section(
      'section_style_caption',
      'Caption',
      [
        choose('caption_align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS, selectors: { [`${W} .bw-caption`]: 'text-align: {{VALUE}};' } }),
        color('text_color', { label: 'Text color', global: 'colors', selectors: { [`${W} .bw-caption`]: 'color: {{VALUE}};' } }),
        ...typography('caption_typography', { selector: `${W} .bw-caption` }),
        slider('caption_space', { label: 'Spacing', responsive: true, units: ['px', 'em', 'rem', 'custom'], selectors: { [`${W} .bw-caption`]: 'margin-block-start: {{SIZE}}{{UNIT}};' } }),
      ],
      { tab: 'style', condition: { 'caption_source!': 'none' } },
    ),
  ],
  baseCss:
    '.bw-w-image{text-align:center}.bw-w-image a{display:inline-block}.bw-image{display:inline-block;vertical-align:middle;max-width:100%;height:auto}' +
    '.bw-figure{margin:0;display:inline-block}.bw-caption{margin-block-start:8px;font-size:.875em}' +
    '.bw-image-placeholder{aspect-ratio:16/9;background:repeating-linear-gradient(45deg,#eef0f3 0 10px,#e3e6ea 10px 20px);border-radius:4px}',
})
