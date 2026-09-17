import {
  type RenderProps,
  ALIGN_OPTIONS,
  choose,
  color,
  defineWidget,
  dimensions,
  gallery,
  media,
  number,
  opts,
  repeater,
  section,
  select,
  slider,
  switcher,
  text,
  textarea,
  wysiwyg,
  url,
  border,
  padding,
  background,
} from '@blockwright/core'
import type { MediaValue } from '@blockwright/schema'
import { BwImage, BwLink, ICON_BASE_CSS, BwIcon, linkAttrs } from '@blockwright/renderer'
import { spacing, textStyle, truthy } from './shared'

const W = '{{WRAPPER}}'

/* ------------------------------ Video ----------------------------- */

export function youtubeId(u: string): string | null {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(u)
  return m ? m[1]! : null
}
export function vimeoId(u: string): string | null {
  const m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(u)
  return m ? m[1]! : null
}

const escAttr = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function Video({ settings, ctx }: RenderProps) {
  const type = settings.video_type || 'youtube'
  const ratio = String(settings.aspect_ratio || '169')
  const title = String(settings.bw_title || 'Video')
  const overlay = (settings.image_overlay ?? {}) as MediaValue
  const params = new URLSearchParams()
  if (truthy(settings.mute)) params.set('mute', '1')
  if (truthy(settings.loop)) params.set('loop', '1')
  if (settings.controls === '') params.set('controls', '0')

  if (type === 'hosted') {
    const m = (settings.hosted_url ?? {}) as MediaValue
    if (!m.url) return ctx.mode === 'edit' ? <div className={`bw-video bw-ratio-${ratio} bw-video-empty`}>Choose a video file</div> : null
    return (
      <div className={`bw-video bw-ratio-${ratio}`}>
        <video
          src={m.url}
          poster={overlay.url || undefined}
          controls={settings.controls !== ''}
          autoPlay={truthy(settings.autoplay)}
          muted={truthy(settings.mute) || truthy(settings.autoplay)}
          loop={truthy(settings.loop)}
          playsInline
          preload="metadata"
        />
      </div>
    )
  }

  const raw = type === 'vimeo' ? settings.vimeo_url : settings.youtube_url
  const source = String((raw && typeof raw === 'object' ? (raw as { url?: string }).url : raw) ?? '')
  const id = type === 'vimeo' ? vimeoId(source) : youtubeId(source)
  if (!id) return ctx.mode === 'edit' ? <div className={`bw-video bw-ratio-${ratio} bw-video-empty`}>Paste a {type === 'vimeo' ? 'Vimeo' : 'YouTube'} link</div> : null
  const embed =
    type === 'vimeo'
      ? `https://player.vimeo.com/video/${id}?${params.toString()}${params.size ? '&' : ''}autoplay=1`
      : `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}${params.size ? '&' : ''}autoplay=1${truthy(settings.loop) ? `&playlist=${id}` : ''}`
  const poster = overlay.url || (type === 'youtube' ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '')
  if (truthy(settings.autoplay) && ctx.mode !== 'edit') {
    return (
      <div className={`bw-video bw-ratio-${ratio}`}>
        <iframe src={embed.replace('autoplay=1', 'autoplay=1&mute=1')} title={title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      </div>
    )
  }
  // Lightweight facade: only a thumbnail loads until the visitor presses play (no JavaScript).
  const facade = `<style>*{margin:0;padding:0}html,body{height:100%;overflow:hidden;background:#000}a{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}b{position:relative;width:68px;height:48px;border-radius:12px;background:rgba(20,20,20,.8);display:flex;align-items:center;justify-content:center;transition:background .2s}a:hover b{background:#e0271e}b:after{content:"";border-style:solid;border-width:10px 0 10px 17px;border-color:transparent transparent transparent #fff;margin-left:4px}</style><a href="${escAttr(embed)}" aria-label="Play ${escAttr(title)}">${poster ? `<img src="${escAttr(poster)}" alt="" loading="lazy">` : ''}<b></b></a>`
  return (
    <div className={`bw-video bw-ratio-${ratio}`}>
      <iframe srcDoc={facade} title={title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
    </div>
  )
}

export const video = defineWidget({
  type: 'video',
  title: 'Video',
  icon: 'video',
  category: 'media',
  keywords: ['video', 'youtube', 'vimeo', 'embed', 'mp4'],
  render: Video as never,
  sections: [
    section('section_video', 'Video', [
      select('video_type', { label: 'Source', options: opts({ youtube: 'YouTube', vimeo: 'Vimeo', hosted: 'Self-hosted' }), default: 'youtube' }),
      url('youtube_url', { label: 'YouTube link', condition: { video_type: 'youtube' }, dynamic: ['url'] }),
      url('vimeo_url', { label: 'Vimeo link', condition: { video_type: 'vimeo' }, dynamic: ['url'] }),
      media('hosted_url', { label: 'Video file', condition: { video_type: 'hosted' } }),
      text('bw_title', { label: 'Title', default: 'Video', description: 'Describes the video for screen readers.' }),
      switcher('autoplay', { label: 'Autoplay (muted)' }),
      switcher('mute', { label: 'Mute' }),
      switcher('loop', { label: 'Loop' }),
      switcher('controls', { label: 'Player controls', default: 'yes' }),
      media('image_overlay', { label: 'Cover image', description: 'Shown until the visitor presses play.' }),
    ]),
    section(
      'section_video_style',
      'Video',
      [
        select('aspect_ratio', { label: 'Aspect ratio', options: opts({ '169': '16:9', '219': '21:9', '43': '4:3', '32': '3:2', '11': '1:1', '916': '9:16' }), default: '169' }),
        dimensions('bw_video_radius', { label: 'Border radius', selectors: { [`${W} .bw-video`]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-video{position:relative;width:100%;overflow:hidden;background:#000;aspect-ratio:16/9}' +
    '.bw-ratio-219{aspect-ratio:21/9}.bw-ratio-43{aspect-ratio:4/3}.bw-ratio-32{aspect-ratio:3/2}.bw-ratio-11{aspect-ratio:1}.bw-ratio-916{aspect-ratio:9/16}' +
    '.bw-video iframe,.bw-video video{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:cover}' +
    '.bw-video-empty{display:flex;align-items:center;justify-content:center;color:#aaa;font:13px system-ui}',
})

/* --------------------------- Tabs / FAQ --------------------------- */

const tabItems = (label: string) =>
  repeater(
    'tabs',
    [
      text('tab_title', { label: 'Title', default: `${label} title`, dynamic: ['text'] }),
      wysiwyg('tab_content', { label: 'Content', default: '<p>Add the content for this item.</p>' }),
    ],
    {
      label: 'Items',
      titleField: 'tab_title',
      addLabel: label.toLowerCase(),
      default: [
        { _id: 't1', tab_title: `${label} #1`, tab_content: '<p>Add the content for this item.</p>' },
        { _id: 't2', tab_title: `${label} #2`, tab_content: '<p>Add the content for this item.</p>' },
      ],
    },
  )

const itemsOf = (s: Record<string, any>) => (Array.isArray(s.tabs) ? (s.tabs as Array<Record<string, any>>) : [])

function Tabs({ settings, element }: RenderProps) {
  const items = itemsOf(settings)
  const name = `bw-tabs-${element.id}`
  const vertical = settings.type === 'vertical'
  // CSS-only tabs: radio inputs keep the active tab without JavaScript
  return (
    <div className={`bw-tabs${vertical ? ' is-vertical' : ''}`} style={{ ['--bw-tab-count' as string]: items.length }}>
      {items.map((it, i) => (
        <div className="bw-tab" key={it._id ?? i}>
          <input type="radio" className="bw-tab-input" name={name} id={`${name}-${i}`} defaultChecked={i === 0} />
          <label className="bw-tab-title" htmlFor={`${name}-${i}`} style={{ order: i }}>
            {it.tab_title}
          </label>
          <div className="bw-tab-content" dangerouslySetInnerHTML={{ __html: String(it.tab_content ?? '') }} />
        </div>
      ))}
    </div>
  )
}

const tabStyle = [
  section(
    'section_tabs_style',
    'Tabs',
    [
      color('border_color', { label: 'Border color', selectors: { [W]: '--bw-tab-border: {{VALUE}};' } }),
      color('background_color', { label: 'Content background', selectors: { [`${W} .bw-tab-content, ${W} .bw-acc-content`]: 'background-color: {{VALUE}};' } }),
      color('tab_color', { label: 'Title color', global: 'colors', selectors: { [`${W} .bw-tab-title, ${W} .bw-acc-title`]: 'color: {{VALUE}};' } }),
      color('tab_active_color', { label: 'Active title color', global: 'colors', selectors: { [W]: '--bw-tab-active: {{VALUE}};' } }),
      color('bw_title_background', { label: 'Title background', selectors: { [`${W} .bw-acc-title`]: 'background-color: {{VALUE}};' } }),
      ...textStyle('tab', `${W} .bw-tab-title, ${W} .bw-acc-title`, 'Title', 'bw_tab_title_color_unused'),
      padding('bw_title_padding', `${W} .bw-tab-title, ${W} .bw-acc-title`, 'Title padding'),
      ...textStyle('content', `${W} .bw-tab-content, ${W} .bw-acc-content`, 'Content', 'content_color'),
      padding('bw_content_padding', `${W} .bw-tab-content, ${W} .bw-acc-content`, 'Content padding'),
      spacing('bw_items_gap', 'Space between items', `${W} .bw-accordion`, 'gap'),
    ].filter((c) => c.name !== 'bw_tab_title_color_unused'),
    { tab: 'style' },
  ),
]

export const tabs = defineWidget({
  type: 'tabs',
  title: 'Tabs',
  icon: 'tabs',
  category: 'interactive',
  keywords: ['tabs', 'panels'],
  render: Tabs as never,
  sections: [section('section_tabs', 'Tabs', [tabItems('Tab'), select('type', { label: 'Layout', options: opts({ horizontal: 'Horizontal', vertical: 'Vertical' }), default: 'horizontal' })]), ...tabStyle],
  baseCss:
    '.bw-tabs{--bw-tab-border:#d5d8dc;--bw-tab-active:var(--bw-c-accent);display:flex;flex-wrap:wrap}' +
    '.bw-tab{display:contents}.bw-tab-input{position:absolute;opacity:0;pointer-events:none}' +
    '.bw-tab-title{padding:12px 20px;cursor:pointer;color:var(--bw-c-primary);font-weight:600;border-bottom:2px solid transparent;margin-bottom:-1px}' +
    '.bw-tab-content{order:999;display:none;width:100%;padding:20px;border-top:1px solid var(--bw-tab-border);color:var(--bw-c-text)}' +
    '.bw-tab-content>:first-child{margin-top:0}.bw-tab-content>:last-child{margin-bottom:0}' +
    '.bw-tab-input:checked+.bw-tab-title{color:var(--bw-tab-active);border-bottom-color:var(--bw-tab-active)}' +
    '.bw-tab-input:checked+.bw-tab-title+.bw-tab-content{display:block}' +
    '.bw-tab-input:focus-visible+.bw-tab-title{outline:2px solid var(--bw-tab-active);outline-offset:-2px}' +
    '.bw-tabs.is-vertical{display:grid;grid-template-columns:minmax(120px,25%) 1fr;grid-auto-flow:dense}' +
    '.bw-tabs.is-vertical .bw-tab-title{grid-column:1;border-bottom:0;border-right:2px solid transparent;margin:0}' +
    '.bw-tabs.is-vertical .bw-tab-input:checked+.bw-tab-title{border-right-color:var(--bw-tab-active)}' +
    '.bw-tabs.is-vertical .bw-tab-content{grid-column:2;grid-row:1/span var(--bw-tab-count);border-top:0;border-left:1px solid var(--bw-tab-border)}' +
    '@media (max-width:767px){.bw-tabs.is-vertical{display:flex}.bw-tabs.is-vertical .bw-tab-content{border-left:0;border-top:1px solid var(--bw-tab-border)}}',
})

function Accordion({ settings }: RenderProps) {
  const items = itemsOf(settings)
  const exclusive = settings.bw_exclusive === 'yes'
  const firstOpen = settings.bw_first_open !== ''
  const faq =
    settings.faq_schema === 'yes'
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((it) => ({
            '@type': 'Question',
            name: String(it.tab_title ?? ''),
            acceptedAnswer: { '@type': 'Answer', text: String(it.tab_content ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() },
          })),
        }).replace(/</g, '\\u003c')
      : null
  return (
    <div className="bw-accordion">
      {items.map((it, i) => (
        <details key={it._id ?? i} className="bw-acc-item" open={firstOpen && i === 0 ? true : undefined} name={exclusive ? `bw-acc-${settings.__id ?? ''}` : undefined}>
          <summary className="bw-acc-title">
            <span>{it.tab_title}</span>
            <span className="bw-acc-icon" aria-hidden="true" />
          </summary>
          <div className="bw-acc-content" dangerouslySetInnerHTML={{ __html: String(it.tab_content ?? '') }} />
        </details>
      ))}
      {faq ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} /> : null}
    </div>
  )
}

export const accordion = defineWidget({
  type: 'accordion',
  title: 'Accordion',
  icon: 'accordion',
  category: 'interactive',
  keywords: ['accordion', 'faq', 'toggle', 'collapse', 'questions'],
  aliases: ['toggle'],
  render: ((p: RenderProps) => <Accordion {...p} settings={{ ...p.settings, __id: p.element.id }} />) as never,
  sections: [
    section('section_title', 'Accordion', [
      tabItems('Question'),
      switcher('bw_first_open', { label: 'Open the first item', default: 'yes' }),
      switcher('bw_exclusive', { label: 'Only one open at a time' }),
      switcher('faq_schema', { label: 'FAQ schema', description: 'Adds FAQ structured data for search engines.' }),
    ]),
    ...tabStyle,
  ],
  baseCss:
    '.bw-accordion{--bw-tab-border:#d5d8dc;--bw-tab-active:var(--bw-c-accent);display:flex;flex-direction:column;border:1px solid var(--bw-tab-border);border-radius:4px}' +
    '.bw-acc-item+.bw-acc-item{border-top:1px solid var(--bw-tab-border)}' +
    '.bw-acc-title{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 20px;cursor:pointer;list-style:none;font-weight:600;color:var(--bw-c-primary)}' +
    '.bw-acc-title::-webkit-details-marker{display:none}' +
    '.bw-acc-icon{width:10px;height:10px;flex:none;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform .2s}' +
    '.bw-acc-item[open]>.bw-acc-title{color:var(--bw-tab-active)}.bw-acc-item[open]>.bw-acc-title .bw-acc-icon{transform:rotate(-135deg)}' +
    '.bw-acc-title:focus-visible{outline:2px solid var(--bw-tab-active);outline-offset:-2px}' +
    '.bw-acc-content{padding:0 20px 18px;color:var(--bw-c-text)}.bw-acc-content>:first-child{margin-top:0}.bw-acc-content>:last-child{margin-bottom:0}',
})

/* -------------------------- Testimonial --------------------------- */

function Testimonial({ settings, ctx }: RenderProps) {
  const img = (settings.testimonial_image ?? {}) as MediaValue
  const top = settings.testimonial_image_position === 'top'
  return (
    <figure className={`bw-testimonial${top ? ' is-top' : ''}`}>
      <blockquote className="bw-testimonial-content">{settings.testimonial_content}</blockquote>
      <figcaption className="bw-testimonial-meta">
        {img.url ? <BwImage ctx={ctx} src={img.url} alt={img.alt ?? ''} width={img.width} height={img.height} className="bw-testimonial-image" /> : null}
        <span className="bw-testimonial-details">
          {settings.testimonial_name ? <cite className="bw-testimonial-name">{settings.testimonial_name}</cite> : null}
          {settings.testimonial_job ? <span className="bw-testimonial-job">{settings.testimonial_job}</span> : null}
        </span>
      </figcaption>
    </figure>
  )
}

export const testimonial = defineWidget({
  type: 'testimonial',
  title: 'Testimonial',
  icon: 'testimonial',
  category: 'marketing',
  keywords: ['testimonial', 'review', 'quote', 'customer'],
  render: Testimonial as never,
  sections: [
    section('section_testimonial', 'Testimonial', [
      textarea('testimonial_content', { label: 'Content', default: 'Working with this team was easy from the first call. The result looks great and loads fast.', dynamic: ['text'] }),
      media('testimonial_image', { label: 'Photo' }),
      text('testimonial_name', { label: 'Name', default: 'Sara Khan', dynamic: ['text'] }),
      text('testimonial_job', { label: 'Title', default: 'Founder, Studio', dynamic: ['text'] }),
      select('testimonial_image_position', { label: 'Photo position', options: opts({ aside: 'Beside the name', top: 'Above the name' }), default: 'aside' }),
      choose('testimonial_alignment', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [W]: 'text-align: {{VALUE}}; --bw-t-justify: {{VALUE}};' } }),
    ]),
    section(
      'section_style_testimonial',
      'Testimonial',
      [
        ...textStyle('content_content', `${W} .bw-testimonial-content`, 'Content', 'content_content_color'),
        slider('image_size', { label: 'Photo size', units: ['px'], selectors: { [`${W} .bw-testimonial-image`]: 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};' } }),
        ...textStyle('name', `${W} .bw-testimonial-name`, 'Name', 'name_text_color'),
        ...textStyle('job', `${W} .bw-testimonial-job`, 'Title', 'job_text_color'),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-testimonial{margin:0}.bw-testimonial-content{margin:0 0 20px;font-size:1.15em;line-height:1.6;color:var(--bw-c-text)}' +
    '.bw-testimonial-meta{display:inline-flex;align-items:center;gap:14px;text-align:start}' +
    '.bw-testimonial.is-top .bw-testimonial-meta{flex-direction:column;text-align:inherit}' +
    '.bw-testimonial-image{width:60px;height:60px;border-radius:50%;object-fit:cover}' +
    '.bw-testimonial-details{display:flex;flex-direction:column}' +
    '.bw-testimonial-name{font-style:normal;font-weight:700;color:var(--bw-c-primary)}.bw-testimonial-job{font-size:.9em;color:var(--bw-c-secondary)}',
})

/* ---------------------------- Counter ----------------------------- */

function Counter({ settings }: RenderProps) {
  const to = Number(settings.ending_number ?? 100)
  const from = Number(settings.starting_number ?? 0)
  const sep = settings.thousand_separator === 'yes'
  const formatted = Number.isFinite(to) ? (sep ? to.toLocaleString('en-US') : String(to)) : String(settings.ending_number ?? '')
  const animated = Number.isInteger(to) && Number.isInteger(from) && !sep && Math.abs(to) < 1e9
  return (
    <div className="bw-counter">
      <div className="bw-counter-number-wrap">
        {settings.prefix ? <span className="bw-counter-prefix">{settings.prefix}</span> : null}
        <span
          className={`bw-counter-number${animated ? ' is-anim' : ''}`}
          style={animated ? ({ '--bw-from': from, '--bw-to': to, '--bw-dur': `${Number(settings.duration ?? 2000)}ms` } as React.CSSProperties) : undefined}
        >
          <span className="bw-counter-value">{formatted}</span>
        </span>
        {settings.suffix ? <span className="bw-counter-suffix">{settings.suffix}</span> : null}
      </div>
      {settings.title ? <div className="bw-counter-title">{settings.title}</div> : null}
    </div>
  )
}

export const counter = defineWidget({
  type: 'counter',
  title: 'Counter',
  icon: 'counter',
  category: 'marketing',
  keywords: ['counter', 'number', 'stats', 'statistics'],
  render: Counter as never,
  sections: [
    section('section_counter', 'Counter', [
      number('starting_number', { label: 'Start number', default: 0 }),
      number('ending_number', { label: 'End number', default: 100, dynamic: ['number', 'text'] }),
      text('prefix', { label: 'Prefix' }),
      text('suffix', { label: 'Suffix', placeholder: '+' }),
      number('duration', { label: 'Animation duration (ms)', default: 2000 }),
      switcher('thousand_separator', { label: 'Thousand separator', description: 'Numbers with separators are shown without animation.' }),
      text('title', { label: 'Title', default: 'Happy clients', dynamic: ['text'] }),
    ]),
    section(
      'section_number',
      'Counter',
      [
        choose('bw_align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [W]: 'text-align: {{VALUE}};' } }),
        ...textStyle('typography_number', `${W} .bw-counter-number-wrap`, 'Number', 'number_color'),
        ...textStyle('typography_title', `${W} .bw-counter-title`, 'Title', 'title_color'),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-w-counter{text-align:center}.bw-counter-number-wrap{display:flex;justify-content:inherit;align-items:baseline;font-size:69px;font-weight:600;line-height:1;color:var(--bw-c-primary);font-variant-numeric:tabular-nums}' +
    '.bw-w-counter .bw-counter-number-wrap{justify-content:center}.bw-counter-title{margin-top:6px;font-size:19px;color:var(--bw-c-secondary)}' +
    '@property --bw-n{syntax:"<integer>";inherits:false;initial-value:0}' +
    '@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){' +
    '.bw-counter-number.is-anim .bw-counter-value{display:none}' +
    '.bw-counter-number.is-anim::after{content:counter(bw-n);counter-reset:bw-n var(--bw-n);animation:bw-count var(--bw-dur,2s) ease-out both;animation-timeline:view();animation-range:entry 0 entry 60%}' +
    '@keyframes bw-count{from{--bw-n:var(--bw-from)}to{--bw-n:var(--bw-to)}}}}',
})

/* ------------------------- Progress / alert ----------------------- */

const TONES = opts({ info: 'Info', success: 'Success', warning: 'Warning', danger: 'Danger' })

function Progress({ settings }: RenderProps) {
  const pct = Math.max(0, Math.min(100, Number(settings.percent?.size ?? settings.percent ?? 50)))
  return (
    <div className="bw-progress-widget">
      {settings.title ? <span className="bw-progress-title">{settings.title}</span> : null}
      <div className={`bw-progress-track bw-tone-${settings.progress_type || 'info'}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={settings.title || 'Progress'}>
        <div className="bw-progress-fill" style={{ width: `${pct}%` }}>
          {settings.inner_text ? <span className="bw-progress-inner">{settings.inner_text}</span> : null}
          {settings.display_percentage !== 'hide' ? <span className="bw-progress-pct">{pct}%</span> : null}
        </div>
      </div>
    </div>
  )
}

export const progress = defineWidget({
  type: 'progress',
  title: 'Progress bar',
  icon: 'progress',
  category: 'marketing',
  keywords: ['progress', 'skill', 'bar', 'percentage'],
  render: Progress as never,
  sections: [
    section('section_progress', 'Progress bar', [
      text('title', { label: 'Title', default: 'Design', dynamic: ['text'] }),
      select('progress_type', { label: 'Tone', options: TONES, default: 'info' }),
      slider('percent', { label: 'Percentage', units: ['%'], default: { unit: '%', size: 60 }, range: { '%': { min: 0, max: 100 } } }),
      select('display_percentage', { label: 'Show percentage', options: opts({ show: 'Show', hide: 'Hide' }), default: 'show' }),
      text('inner_text', { label: 'Inner text', placeholder: 'Web designer' }),
    ]),
    section(
      'section_progress_style',
      'Progress bar',
      [
        color('bar_color', { label: 'Bar color', global: 'colors', selectors: { [`${W} .bw-progress-fill`]: 'background-color: {{VALUE}};' } }),
        color('bar_bg_color', { label: 'Track color', selectors: { [`${W} .bw-progress-track`]: 'background-color: {{VALUE}};' } }),
        color('bar_inline_color', { label: 'Text color', selectors: { [`${W} .bw-progress-fill`]: 'color: {{VALUE}};' } }),
        slider('bar_height', { label: 'Height', units: ['px'], selectors: { [`${W} .bw-progress-track`]: 'height: {{SIZE}}{{UNIT}};' } }),
        dimensions('bar_border_radius', { label: 'Border radius', selectors: { [`${W} .bw-progress-track, ${W} .bw-progress-fill`]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
        ...textStyle('typography', `${W} .bw-progress-title`, 'Title', 'title_color'),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-progress-title{display:block;margin-bottom:6px;font-weight:600;color:var(--bw-c-primary)}' +
    '.bw-progress-track{height:30px;border-radius:3px;background:#eef0f3;overflow:hidden}' +
    '.bw-progress-fill{height:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px;color:#fff;font-size:12px;font-weight:600;background:var(--bw-c-accent);white-space:nowrap}' +
    '.bw-tone-success .bw-progress-fill{background:#2f9e44}.bw-tone-warning .bw-progress-fill{background:#f08c00}.bw-tone-danger .bw-progress-fill{background:#e03131}' +
    '@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){.bw-progress-fill{animation:bw-grow linear both;animation-timeline:view();animation-range:entry 0 entry 60%}@keyframes bw-grow{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0)}}}}',
})

function Alert({ settings }: RenderProps) {
  return (
    <div className={`bw-alert bw-tone-${settings.alert_type || 'info'}`} role="note">
      {settings.alert_title ? <strong className="bw-alert-title">{settings.alert_title}</strong> : null}
      {settings.alert_description ? <div className="bw-alert-desc">{settings.alert_description}</div> : null}
    </div>
  )
}

export const alert = defineWidget({
  type: 'alert',
  title: 'Alert',
  icon: 'alert',
  category: 'essentials',
  keywords: ['alert', 'notice', 'message', 'callout'],
  render: Alert as never,
  sections: [
    section('section_alert', 'Alert', [
      select('alert_type', { label: 'Tone', options: TONES, default: 'info' }),
      text('alert_title', { label: 'Title', default: 'Good to know', dynamic: ['text'] }),
      textarea('alert_description', { label: 'Content', default: 'Add a short, helpful message here.', dynamic: ['text'] }),
    ]),
    section(
      'section_alert_style',
      'Alert',
      [
        color('background', { label: 'Background', selectors: { [`${W} .bw-alert`]: 'background-color: {{VALUE}};' } }),
        color('border_color', { label: 'Border color', selectors: { [`${W} .bw-alert`]: 'border-color: {{VALUE}};' } }),
        ...textStyle('alert_title', `${W} .bw-alert-title`, 'Title', 'title_color'),
        ...textStyle('alert_description', `${W} .bw-alert-desc`, 'Content', 'description_color'),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-alert{padding:14px 18px;border-left:4px solid;border-radius:4px}.bw-alert-title{display:block;margin-bottom:2px}' +
    '.bw-alert.bw-tone-info{background:#e7f5ff;border-color:#339af0;color:#1c4f7a}.bw-alert.bw-tone-success{background:#ebfbee;border-color:#40c057;color:#1e5a2b}' +
    '.bw-alert.bw-tone-warning{background:#fff9db;border-color:#fab005;color:#6b4d00}.bw-alert.bw-tone-danger{background:#fff5f5;border-color:#fa5252;color:#7a1f1f}',
})

/* --------------------------- Star rating -------------------------- */

function StarRating({ settings }: RenderProps) {
  const scale = Number(settings.rating_scale) === 10 ? 10 : 5
  const rating = Math.max(0, Math.min(scale, Number(settings.rating ?? 5)))
  const pct = (rating / scale) * 100
  const stars = '★'.repeat(scale)
  return (
    <div className="bw-rating-widget">
      {settings.title ? <span className="bw-rating-title">{settings.title}</span> : null}
      <span className="bw-stars" role="img" aria-label={`Rated ${rating} out of ${scale}`}>
        <span className="bw-stars-base" aria-hidden="true">
          {stars}
        </span>
        <span className="bw-stars-fill" aria-hidden="true" style={{ width: `${pct}%` }}>
          {stars}
        </span>
      </span>
    </div>
  )
}

export const starRating = defineWidget({
  type: 'star-rating',
  title: 'Star rating',
  icon: 'star',
  category: 'marketing',
  keywords: ['rating', 'stars', 'review', 'score'],
  render: StarRating as never,
  sections: [
    section('section_rating', 'Rating', [
      select('rating_scale', { label: 'Scale', options: opts({ '5': '0–5', '10': '0–10' }), default: '5' }),
      number('rating', { label: 'Rating', default: 5, dynamic: ['number', 'text'] }),
      text('title', { label: 'Title', dynamic: ['text'] }),
      choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [W]: 'text-align: {{VALUE}};' } }),
    ]),
    section(
      'section_stars_style',
      'Stars',
      [
        slider('icon_size', { label: 'Size', responsive: true, units: ['px', 'em'], selectors: { [`${W} .bw-stars`]: 'font-size: {{SIZE}}{{UNIT}};' } }),
        slider('icon_space', { label: 'Spacing', units: ['px', 'em'], selectors: { [`${W} .bw-stars`]: 'letter-spacing: {{SIZE}}{{UNIT}};' } }),
        color('stars_color', { label: 'Color', global: 'colors', selectors: { [`${W} .bw-stars-fill`]: 'color: {{VALUE}};' } }),
        color('stars_unmarked_color', { label: 'Empty color', selectors: { [`${W} .bw-stars-base`]: 'color: {{VALUE}};' } }),
        ...textStyle('title', `${W} .bw-rating-title`, 'Title', 'title_color'),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-rating-title{margin-right:10px;font-weight:600}.bw-stars{position:relative;display:inline-block;font-size:22px;line-height:1;letter-spacing:2px;vertical-align:middle}' +
    '.bw-stars-base{color:#ccd1d9}.bw-stars-fill{position:absolute;left:0;top:0;overflow:hidden;white-space:nowrap;color:#f0ad4e}',
})

/* --------------------------- Google Maps -------------------------- */

function GoogleMap({ settings }: RenderProps) {
  const address = String(settings.address ?? '').trim()
  if (!address) return null
  const zoom = Math.max(1, Math.min(20, Number(settings.zoom?.size ?? settings.zoom ?? 14)))
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=m&z=${zoom}&output=embed&iwloc=near`
  return (
    <div className="bw-map">
      <iframe src={src} title={String(settings.bw_title || address)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
    </div>
  )
}

export const googleMaps = defineWidget({
  type: 'google_maps',
  title: 'Google Maps',
  icon: 'map',
  category: 'media',
  keywords: ['map', 'location', 'address', 'google'],
  render: GoogleMap as never,
  sections: [
    section('section_map', 'Map', [
      text('address', { label: 'Location', default: 'Lahore, Pakistan', dynamic: ['text'] }),
      slider('zoom', { label: 'Zoom', units: ['px'], default: { unit: 'px', size: 12 }, range: { px: { min: 1, max: 20 } } }),
      slider('height', { label: 'Height', responsive: true, units: ['px', 'vh'], range: { px: { min: 40, max: 1200 } }, selectors: { [`${W} .bw-map`]: 'height: {{SIZE}}{{UNIT}};' } }),
      text('bw_title', { label: 'Title', description: 'Describes the map for screen readers.' }),
    ]),
    section('section_map_style', 'Map', [...border('map_border', { selector: `${W} .bw-map` }), dimensions('map_radius', { label: 'Border radius', selectors: { [`${W} .bw-map`]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } })], { tab: 'style' }),
  ],
  baseCss: '.bw-map{position:relative;height:300px;overflow:hidden}.bw-map iframe{width:100%;height:100%;border:0;display:block}',
})

/* ----------------------------- Gallery ---------------------------- */

function Gallery({ settings, ctx, element }: RenderProps) {
  const items = (Array.isArray(settings.gallery) ? settings.gallery : []) as MediaValue[]
  if (!items.length) return ctx.mode === 'edit' ? <div className="bw-image-placeholder" /> : null
  const linkFile = settings.gallery_link === 'file'
  return (
    <ul className="bw-gallery" aria-label={String(settings.bw_label || 'Gallery')}>
      {items.map((m, i) => {
        if (!m?.url) return null
        const img = <BwImage ctx={ctx} src={m.url} alt={m.alt ?? ''} width={m.width} height={m.height} sizes="(max-width: 767px) 50vw, 25vw" />
        const a = linkFile ? linkAttrs({ url: m.url }) : null
        return (
          <li key={`${element.id}-${m.id ?? i}`} className="bw-gallery-item">
            {a ? (
              <BwLink ctx={ctx} href={a.href} target="_blank" rel="noopener">
                {img}
              </BwLink>
            ) : (
              img
            )}
          </li>
        )
      })}
    </ul>
  )
}

export const imageGallery = defineWidget({
  type: 'image-gallery',
  title: 'Gallery',
  icon: 'gallery',
  category: 'media',
  keywords: ['gallery', 'images', 'photos', 'grid'],
  aliases: ['basic-gallery'],
  render: Gallery as never,
  sections: [
    section('section_gallery', 'Gallery', [
      gallery('gallery', { label: 'Images', default: [] }),
      select('gallery_link', { label: 'Link', options: opts({ none: 'None', file: 'Open image' }), default: 'none' }),
      text('bw_label', { label: 'Gallery name', description: 'Read by screen readers.' }),
    ]),
    section(
      'section_gallery_style',
      'Gallery',
      [
        slider('gallery_columns', { label: 'Columns', responsive: true, units: ['fr'], default: { unit: 'fr', size: 4 }, range: { fr: { min: 1, max: 10 } }, selectors: { [`${W} .bw-gallery`]: 'grid-template-columns: repeat({{SIZE}}, minmax(0, 1fr));' } }),
        slider('image_spacing', { label: 'Gap', responsive: true, units: ['px', 'em'], selectors: { [`${W} .bw-gallery`]: 'gap: {{SIZE}}{{UNIT}};' } }),
        select('bw_ratio', { label: 'Aspect ratio', options: opts({ '': 'Original', '1/1': '1:1', '4/3': '4:3', '3/2': '3:2', '16/9': '16:9', '3/4': '3:4' }), selectors: { [`${W} .bw-gallery img`]: 'aspect-ratio: {{VALUE}}; object-fit: cover;' } }),
        dimensions('image_border_radius', { label: 'Border radius', selectors: { [`${W} .bw-gallery img`]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-gallery{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}' +
    '.bw-gallery-item img{display:block;width:100%;height:auto}.bw-gallery-item a{display:block;transition:opacity .2s}.bw-gallery-item a:hover{opacity:.85}' +
    '@media (max-width:767px){.bw-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}',
})

void background
void ICON_BASE_CSS
void BwIcon
