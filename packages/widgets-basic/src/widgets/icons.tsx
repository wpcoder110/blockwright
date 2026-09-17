import type { ReactNode } from 'react'
import {
  type RenderProps,
  ALIGN_OPTIONS,
  border,
  borderRadius,
  choose,
  color,
  defineWidget,
  dimensions,
  icon,
  number,
  opts,
  repeater,
  section,
  select,
  slider,
  switcher,
  text,
  textarea,
  url,
  media,
} from '@blockwright/core'
import type { MediaValue } from '@blockwright/schema'
import { BwIcon, BwImage, BwLink, ICON_BASE_CSS, linkAttrs, resolveIcon } from '@blockwright/renderer'
import { TAG_OPTIONS, safeTag, spacing, textStyle } from './shared'

const W = '{{WRAPPER}}'

function Linked({ ctx, link, className, children }: { ctx: RenderProps['ctx']; link: unknown; className?: string; children: ReactNode }) {
  const a = linkAttrs(link as never)
  if (!a) return <>{children}</>
  return (
    <BwLink ctx={ctx} href={a.href} target={a.target} rel={a.rel} className={className} {...a.extra}>
      {children}
    </BwLink>
  )
}

/* ------------------------------ Icon ------------------------------ */

const iconStyleControls = (sel: string): ReturnType<typeof color>[] => [
  select('view', { label: 'View', options: opts({ default: 'Default', stacked: 'Stacked', framed: 'Framed' }), default: 'default' }),
  select('shape', { label: 'Shape', options: opts({ circle: 'Circle', square: 'Square', rounded: 'Rounded' }), default: 'circle', condition: { 'view!': 'default' } }),
  color('primary_color', { label: 'Primary color', global: 'colors', selectors: { [W]: '--bw-icon-primary: {{VALUE}};' } }),
  color('secondary_color', { label: 'Secondary color', global: 'colors', condition: { 'view!': 'default' }, selectors: { [W]: '--bw-icon-secondary: {{VALUE}};' } }),
  slider('size', { label: 'Size', responsive: true, units: ['px', 'em', 'rem', 'vw', 'custom'], range: { px: { min: 6, max: 300 } }, selectors: { [W]: '--bw-icon-size: {{SIZE}}{{UNIT}};' } }),
  slider('icon_padding', { label: 'Padding', responsive: true, units: ['px', 'em', 'custom'], condition: { 'view!': 'default' }, selectors: { [sel]: 'padding: {{SIZE}}{{UNIT}};' } }),
  slider('rotate', { label: 'Rotate', units: ['deg'], selectors: { [`${sel} .bw-icon`]: 'transform: rotate({{SIZE}}deg);' } }),
  color('hover_primary_color', { label: 'Hover color', global: 'colors', selectors: { [`${sel}:hover`]: '--bw-icon-primary: {{VALUE}};' } }),
]

const ICON_VIEW_CSS =
  ICON_BASE_CSS +
  '.bw-icon-wrap{display:inline-flex;align-items:center;justify-content:center;font-size:var(--bw-icon-size,50px);color:var(--bw-icon-primary,var(--bw-c-primary));line-height:1;transition:color .2s,background-color .2s}' +
  '.bw-view-stacked .bw-icon-wrap{background-color:var(--bw-icon-primary,var(--bw-c-primary));color:var(--bw-icon-secondary,#fff);padding:.5em}' +
  '.bw-view-framed .bw-icon-wrap{border:3px solid currentColor;background-color:var(--bw-icon-secondary,transparent);padding:.5em}' +
  '.bw-shape-circle .bw-icon-wrap{border-radius:50%}.bw-shape-rounded .bw-icon-wrap{border-radius:15%}'

const viewClass = (s: Record<string, any>) => (s.view && s.view !== 'default' ? `bw-view-${s.view} bw-shape-${s.shape || 'circle'}` : '')

function IconWidget({ settings, ctx }: RenderProps) {
  if (!resolveIcon(settings.selected_icon)) return ctx.mode === 'edit' ? <div className="bw-icon-empty">Choose an icon</div> : null
  return (
    <div className={`bw-icon-box-wrap ${viewClass(settings)}`}>
      <Linked ctx={ctx} link={settings.link} className="bw-icon-wrap">
        <span className="bw-icon-wrap">
          <BwIcon icon={settings.selected_icon} label={settings.bw_label || undefined} />
        </span>
      </Linked>
    </div>
  )
}

export const iconWidget = defineWidget({
  type: 'icon',
  title: 'Icon',
  icon: 'icon',
  category: 'essentials',
  keywords: ['icon', 'symbol'],
  render: IconWidget as never,
  sections: [
    section('section_icon', 'Icon', [
      icon('selected_icon', { label: 'Icon', default: { value: 'bw-star', library: 'bw' } }),
      url('link', { label: 'Link', dynamic: ['url'] }),
      text('bw_label', { label: 'Accessible label', description: 'Describe the icon when it carries meaning, e.g. "Call us".' }),
      choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [W]: 'text-align: {{VALUE}};' } }),
    ]),
    section('section_style_icon', 'Icon', iconStyleControls(`${W} .bw-icon-wrap`), { tab: 'style' }),
  ],
  baseCss: ICON_VIEW_CSS + '.bw-w-icon{text-align:center}.bw-icon-empty{padding:12px;border:1px dashed #b7bcc4;text-align:center;font:12px system-ui}',
})

/* ---------------------------- Icon box ---------------------------- */

const boxControls = (kind: 'icon' | 'image') => [
  kind === 'icon'
    ? icon('selected_icon', { label: 'Icon', default: { value: 'bw-star', library: 'bw' } })
    : media('image', { label: 'Image', dynamic: ['image'], default: { url: '' } }),
  text('title_text', { label: 'Title', default: 'This is the heading', dynamic: ['text'] }),
  textarea('description_text', { label: 'Description', default: 'Add a short description of what this does and why it matters.', dynamic: ['text'] }),
  url('link', { label: 'Link', dynamic: ['url'] }),
  choose('position', { label: kind === 'icon' ? 'Icon position' : 'Image position', responsive: true, options: opts({ left: 'Left', top: 'Top', right: 'Right' }), default: 'top' }),
  select('title_size', { label: 'Title HTML tag', options: opts(TAG_OPTIONS), default: 'h3' }),
]

const boxStyle = (kind: 'icon' | 'image') => [
  section(
    kind === 'icon' ? 'section_style_icon' : 'section_style_image',
    kind === 'icon' ? 'Icon' : 'Image',
    kind === 'icon'
      ? [
          ...iconStyleControls(`${W} .bw-icon-wrap`),
          spacing('icon_space', 'Spacing', W, '--bw-box-gap'),
        ]
      : [
          slider('image_size', { label: 'Width', responsive: true, units: ['%', 'px', 'custom'], selectors: { [W]: '--bw-box-media-w: {{SIZE}}{{UNIT}};' } }),
          slider('bw_image_height', { label: 'Height', responsive: true, units: ['px', 'vh', 'custom'], selectors: { [`${W} .bw-box-media img`]: 'height: {{SIZE}}{{UNIT}}; object-fit: cover;' } }),
          spacing('image_space', 'Spacing', W, '--bw-box-gap'),
          dimensions('image_border_radius', { label: 'Border radius', selectors: { [`${W} .bw-box-media img`]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
        ],
    { tab: 'style' },
  ),
  section(
    'section_style_content',
    'Content',
    [
      choose('text_align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS, selectors: { [W]: 'text-align: {{VALUE}};' } }),
      choose('content_vertical_alignment', { label: 'Vertical alignment', options: opts({ top: 'Top', middle: 'Middle', bottom: 'Bottom' }), selectorsDictionary: { top: 'flex-start', middle: 'center', bottom: 'flex-end' }, selectors: { [`${W} .bw-box`]: 'align-items: {{VALUE}};' } }),
      spacing('title_bottom_space', 'Title spacing', `${W} .bw-box-title`, 'margin-block-end'),
      ...textStyle('title', `${W} .bw-box-title`, 'Title'),
      ...textStyle('description', `${W} .bw-box-desc`, 'Description'),
    ],
    { tab: 'style' },
  ),
]

function Box({ settings, ctx, kind }: RenderProps & { kind: 'icon' | 'image' }) {
  const Tag = safeTag(settings.title_size)
  const pos = ['left', 'right', 'top'].includes(settings.position) ? settings.position : 'top'
  const m = (settings.image ?? {}) as MediaValue
  const mediaNode =
    kind === 'icon' ? (
      resolveIcon(settings.selected_icon) ? (
        <span className="bw-icon-wrap">
          <BwIcon icon={settings.selected_icon} />
        </span>
      ) : null
    ) : m.url ? (
      <BwImage ctx={ctx} src={m.url} alt={m.alt ?? ''} width={m.width} height={m.height} />
    ) : ctx.mode === 'edit' ? (
      <span className="bw-image-placeholder" />
    ) : null
  return (
    <div className={`bw-box bw-box-${pos} ${kind === 'icon' ? viewClass(settings) : ''}`}>
      {mediaNode ? (
        <div className="bw-box-media">
          <Linked ctx={ctx} link={settings.link}>
            {mediaNode}
          </Linked>
        </div>
      ) : null}
      <div className="bw-box-content">
        {settings.title_text ? (
          <Tag className="bw-box-title">
            <Linked ctx={ctx} link={settings.link}>
              {settings.title_text}
            </Linked>
          </Tag>
        ) : null}
        {settings.description_text ? <p className="bw-box-desc">{settings.description_text}</p> : null}
      </div>
    </div>
  )
}

const BOX_CSS =
  '.bw-w-icon-box,.bw-w-image-box{--bw-box-gap:15px}' +
  '.bw-box{display:flex;flex-direction:column;gap:var(--bw-box-gap,15px);align-items:center}' +
  '.bw-box-left{flex-direction:row;align-items:flex-start}.bw-box-right{flex-direction:row-reverse;align-items:flex-start}' +
  '.bw-box-media{flex:none;line-height:0}.bw-box-media img{display:block;max-width:100%;height:auto}' +
  '.bw-box-content{flex:1;min-width:0}' +
  '.bw-box-title{margin:0 0 8px;color:var(--bw-c-primary);font-family:var(--bw-t-primary-font-family,inherit);font-weight:var(--bw-t-primary-font-weight,600);font-size:1.25em;line-height:1.3}' +
  '.bw-box-title a{color:inherit;text-decoration:none}.bw-box-desc{margin:0;color:var(--bw-c-text)}' +
  '.bw-w-icon-box,.bw-w-image-box{text-align:center}'

export const iconBox = defineWidget({
  type: 'icon-box',
  title: 'Icon box',
  icon: 'icon-box',
  category: 'essentials',
  keywords: ['icon', 'feature', 'service', 'box'],
  render: ((p: RenderProps) => <Box {...p} kind="icon" />) as never,
  sections: [section('section_icon', 'Icon box', boxControls('icon')), ...boxStyle('icon')],
  baseCss: ICON_VIEW_CSS + BOX_CSS,
})

export const imageBox = defineWidget({
  type: 'image-box',
  title: 'Image box',
  icon: 'image-box',
  category: 'media',
  keywords: ['image', 'feature', 'card', 'box'],
  render: ((p: RenderProps) => <Box {...p} kind="image" />) as never,
  sections: [section('section_image', 'Image box', boxControls('image')), ...boxStyle('image')],
  baseCss:
    BOX_CSS +
    '.bw-w-image-box .bw-box-media{width:var(--bw-box-media-w,30%)}' +
    '.bw-w-image-box .bw-box-top .bw-box-media{width:var(--bw-box-media-w,100%)}' +
    '.bw-w-image-box .bw-box-media img{width:100%}',
})

/* ---------------------------- Icon list --------------------------- */

function IconList({ settings, ctx }: RenderProps) {
  const items = Array.isArray(settings.icon_list) ? (settings.icon_list as Array<Record<string, any>>) : []
  const inline = settings.view === 'inline'
  return (
    <ul className={`bw-icon-list${inline ? ' is-inline' : ''}${settings.divider === 'yes' ? ' has-divider' : ''}`}>
      {items.map((it, i) => (
        <li key={it._id ?? i} className="bw-icon-list-item">
          <Linked ctx={ctx} link={it.link} className="bw-icon-list-link">
            {resolveIcon(it.selected_icon) ? (
              <span className="bw-icon-list-icon">
                <BwIcon icon={it.selected_icon} />
              </span>
            ) : null}
            <span className="bw-icon-list-text">{it.text}</span>
          </Linked>
        </li>
      ))}
    </ul>
  )
}

export const iconList = defineWidget({
  type: 'icon-list',
  title: 'Icon list',
  icon: 'icon-list',
  category: 'essentials',
  keywords: ['list', 'bullets', 'features', 'checklist'],
  render: IconList as never,
  sections: [
    section('section_icon', 'Icon list', [
      select('view', { label: 'Layout', options: opts({ traditional: 'Stacked', inline: 'Inline' }), default: 'traditional' }),
      repeater(
        'icon_list',
        [
          text('text', { label: 'Text', default: 'List item', dynamic: ['text'] }),
          icon('selected_icon', { label: 'Icon', default: { value: 'bw-check', library: 'bw' } }),
          url('link', { label: 'Link' }),
        ],
        {
          label: 'Items',
          titleField: 'text',
          addLabel: 'item',
          default: [
            { _id: 'a1', text: 'First benefit', selected_icon: { value: 'bw-check', library: 'bw' } },
            { _id: 'a2', text: 'Second benefit', selected_icon: { value: 'bw-check', library: 'bw' } },
            { _id: 'a3', text: 'Third benefit', selected_icon: { value: 'bw-check', library: 'bw' } },
          ],
        },
      ),
    ]),
    section(
      'section_icon_list_style',
      'List',
      [
        spacing('space_between', 'Space between', W, '--bw-list-gap'),
        choose('icon_align', { label: 'Alignment', responsive: true, options: opts({ left: 'Left', center: 'Center', right: 'Right' }), selectorsDictionary: { left: 'flex-start', center: 'center', right: 'flex-end' }, selectors: { [`${W} .bw-icon-list`]: '--bw-list-justify: {{VALUE}};' } }),
        switcher('divider', { label: 'Divider' }),
        color('divider_color', { label: 'Divider color', condition: { divider: 'yes' }, selectors: { [W]: '--bw-list-divider: {{VALUE}};' } }),
        color('icon_color', { label: 'Icon color', global: 'colors', selectors: { [`${W} .bw-icon-list-icon`]: 'color: {{VALUE}};' } }),
        slider('icon_size', { label: 'Icon size', responsive: true, units: ['px', 'em', 'custom'], selectors: { [`${W} .bw-icon-list-icon`]: 'font-size: {{SIZE}}{{UNIT}};' } }),
        spacing('text_indent', 'Text indent', `${W} .bw-icon-list-link`, 'gap'),
        ...textStyle('text', `${W} .bw-icon-list-text`, 'Text', 'text_color'),
        color('text_color_hover', { label: 'Text hover color', global: 'colors', selectors: { [`${W} a.bw-icon-list-link:hover .bw-icon-list-text`]: 'color: {{VALUE}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    ICON_BASE_CSS +
    '.bw-icon-list{--bw-list-gap:8px;list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--bw-list-gap);align-items:var(--bw-list-justify,flex-start)}' +
    '.bw-icon-list.is-inline{flex-direction:row;flex-wrap:wrap;column-gap:calc(var(--bw-list-gap) * 2);justify-content:var(--bw-list-justify,flex-start)}' +
    '.bw-icon-list.has-divider:not(.is-inline) .bw-icon-list-item+.bw-icon-list-item{padding-top:var(--bw-list-gap);border-top:1px solid var(--bw-list-divider,#ddd)}' +
    '.bw-icon-list-link{display:inline-flex;align-items:center;gap:8px;color:inherit;text-decoration:none}' +
    '.bw-icon-list-icon{display:inline-flex;color:var(--bw-c-primary);font-size:14px}',
})

/* -------------------------- Social icons -------------------------- */

const BRAND: Record<string, string> = {
  facebook: '#1877f2', instagram: '#e1306c', x: '#000000', linkedin: '#0a66c2', youtube: '#ff0000',
  whatsapp: '#25d366', tiktok: '#000000', github: '#24292f', pinterest: '#e60023', mail: '#555555', phone: '#555555',
}

function Social({ settings, ctx }: RenderProps) {
  const items = Array.isArray(settings.social_icon_list) ? (settings.social_icon_list as Array<Record<string, any>>) : []
  return (
    <ul className={`bw-social bw-social-${settings.shape || 'rounded'}${settings.icon_color === 'custom' ? '' : ' is-brand'}`}>
      {items.map((it, i) => {
        const r = resolveIcon(it.social_icon)
        const a = linkAttrs(it.link)
        const name = r?.name ?? 'link'
        const label = it.bw_label || name.charAt(0).toUpperCase() + name.slice(1)
        const body = <BwIcon icon={it.social_icon} />
        return (
          <li key={it._id ?? i} style={{ ['--bw-brand' as string]: BRAND[name] ?? '#555' }}>
            {a ? (
              <BwLink ctx={ctx} href={a.href} target={a.target ?? '_blank'} rel={a.rel ?? 'noopener'} className="bw-social-link" aria-label={label} {...a.extra}>
                {body}
              </BwLink>
            ) : (
              <span className="bw-social-link" role="img" aria-label={label}>
                {body}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export const socialIcons = defineWidget({
  type: 'social-icons',
  title: 'Social icons',
  icon: 'social',
  category: 'essentials',
  keywords: ['social', 'facebook', 'instagram', 'whatsapp', 'links'],
  render: Social as never,
  sections: [
    section('section_social_icon', 'Social icons', [
      repeater(
        'social_icon_list',
        [
          icon('social_icon', { label: 'Icon', default: { value: 'bw-facebook', library: 'bw' } }),
          url('link', { label: 'Link', default: { url: '#' } }),
          text('bw_label', { label: 'Accessible label', placeholder: 'Facebook' }),
        ],
        {
          label: 'Icons',
          addLabel: 'icon',
          default: [
            { _id: 's1', social_icon: { value: 'bw-facebook', library: 'bw' }, link: { url: '#' } },
            { _id: 's2', social_icon: { value: 'bw-instagram', library: 'bw' }, link: { url: '#' } },
            { _id: 's3', social_icon: { value: 'bw-whatsapp', library: 'bw' }, link: { url: '#' } },
          ],
        },
      ),
      select('shape', { label: 'Shape', options: opts({ rounded: 'Rounded', square: 'Square', circle: 'Circle' }), default: 'rounded' }),
      choose('align', { label: 'Alignment', responsive: true, options: opts({ left: 'Left', center: 'Center', right: 'Right' }), selectorsDictionary: { left: 'flex-start', center: 'center', right: 'flex-end' }, selectors: { [`${W} .bw-social`]: 'justify-content: {{VALUE}};' } }),
    ]),
    section(
      'section_social_style',
      'Icon',
      [
        select('icon_color', { label: 'Color', options: opts({ default: 'Official colors', custom: 'Custom' }), default: 'default' }),
        color('icon_primary_color', { label: 'Background', global: 'colors', condition: { icon_color: 'custom' }, selectors: { [`${W} .bw-social-link`]: 'background-color: {{VALUE}};' } }),
        color('icon_secondary_color', { label: 'Icon color', global: 'colors', condition: { icon_color: 'custom' }, selectors: { [`${W} .bw-social-link`]: 'color: {{VALUE}};' } }),
        slider('icon_size', { label: 'Size', responsive: true, units: ['px', 'em', 'custom'], selectors: { [`${W} .bw-social`]: '--bw-social-size: {{SIZE}}{{UNIT}};' } }),
        slider('icon_padding', { label: 'Padding', responsive: true, units: ['px', 'em', 'custom'], selectors: { [`${W} .bw-social-link`]: 'padding: {{SIZE}}{{UNIT}};' } }),
        spacing('icon_spacing', 'Spacing', `${W} .bw-social`, 'gap'),
        number('bw_hover_opacity', { label: 'Hover opacity', selectors: { [`${W} .bw-social-link:hover`]: 'opacity: {{VALUE}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    ICON_BASE_CSS +
    '.bw-social{--bw-social-size:20px;list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}' +
    '.bw-social-link{display:inline-flex;align-items:center;justify-content:center;padding:.5em;font-size:var(--bw-social-size);color:#fff;background-color:#69727d;transition:opacity .2s,transform .2s}' +
    '.bw-social.is-brand .bw-social-link{background-color:var(--bw-brand)}' +
    '.bw-social-link:hover{opacity:.85}.bw-social-rounded .bw-social-link{border-radius:10%}.bw-social-circle .bw-social-link{border-radius:50%}',
})

export { Linked }
