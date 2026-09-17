import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_KIT, type RenderContext, createRegistry } from '@blockwright/core'
import { validateLayout, buildTagString } from '@blockwright/schema'
import { Blockwright, RenderElements, buildLayout } from '@blockwright/renderer'
import { basicElements } from '../src'

const registry = createRegistry(basicElements)
const ctx = (extra: Partial<RenderContext> = {}): RenderContext => ({
  registry,
  kit: DEFAULT_KIT,
  mode: 'live',
  document: { collection: 'pages', id: 1, data: { title: 'About us', hero: { tagline: 'Built in Pakistan' } } },
  ...extra,
})

const layout = validateLayout([
  {
    id: 'hero001',
    elType: 'container',
    settings: {
      flex_direction: 'row',
      flex_direction_mobile: 'column',
      flex_gap: { unit: 'px', column: 30, row: 30, isLinked: true },
      background_background: 'classic',
      background_color: '#101820',
      padding: { unit: 'px', top: 80, right: 20, bottom: 80, left: 20, isLinked: false },
      html_tag: 'section',
    },
    elements: [
      {
        id: 'head001',
        elType: 'widget',
        widgetType: 'heading',
        settings: {
          title: 'Static',
          header_size: 'h1',
          __dynamic__: { title: buildTagString({ id: 't', name: 'post-title', settings: { after: '!' } }) },
          __globals__: { title_color: 'globals/colors?id=accent' },
          typography_typography: 'custom',
          typography_font_family: 'Poppins',
          typography_font_size: { unit: 'px', size: 56, sizes: [] },
          typography_font_size_mobile: { unit: 'px', size: 32, sizes: [] },
          align: 'center',
        },
      },
      { id: 'text001', elType: 'widget', widgetType: 'text-editor', settings: { editor: '<p>Hello <strong>world</strong></p>' } },
      {
        id: 'btn0001',
        elType: 'widget',
        widgetType: 'button',
        settings: { text: 'Get started', link: { url: '/contact', is_external: '', nofollow: 'on' }, align_mobile: 'justify' },
      },
      { id: 'img0001', elType: 'widget', widgetType: 'image', settings: { image: { url: '/a.jpg', alt: 'A', width: 800, height: 600 }, bw_priority: 'yes' } },
      { id: 'unknown', elType: 'widget', widgetType: 'does-not-exist', settings: {} },
    ],
  },
]).data!

describe('render pipeline', () => {
  it('renders semantic HTML with resolved dynamic values', async () => {
    const c = ctx()
    const built = await buildLayout(layout, c)
    const html = renderToStaticMarkup(<RenderElements items={built.prepared} ctx={c} />)
    expect(html).toContain('<section class="bw-el bw-el-hero001 bw-frame bw-boxed">')
    expect(html).toContain('<div class="bw-inner">')
    expect(html).toContain('<h1 class="bw-heading">About us!</h1>')
    expect(html).toContain('<p>Hello <strong>world</strong></p>')
    expect(html).toContain('<a href="/contact" class="bw-btn bw-btn-sm" rel="nofollow">')
    expect(html).toContain('fetchPriority="high"')
    expect(html).toContain('loading="eager"')
    expect(html).not.toContain('does-not-exist')
  })

  it('compiles minimal responsive CSS with globals', async () => {
    const c = ctx()
    const { compiled } = await buildLayout(layout, c)
    const css = compiled.css
    expect(css).toContain('.bw-el-hero001{--bw-dir:row;--bw-gap-row:30px;--bw-gap-col:30px;background-color:#101820;padding:80px 20px 80px 20px}')
    expect(css).toContain('.bw-el-head001 .bw-heading{color:var(--bw-c-accent);font-family:"Poppins", system-ui, sans-serif;font-size:56px}')
    expect(css).toContain('@media (max-width:767px){')
    expect(css).toContain('.bw-el-hero001{--bw-dir:column}')
    expect(css).toContain('.bw-el-head001 .bw-heading{font-size:32px}')
    expect(css).toContain('.bw-el-btn0001{--bw-btn-w:100%}')
    // defaults are covered by base CSS, so they are not repeated per element
    expect(css).not.toContain('bw-el-text001')
    expect(compiled.fonts).toEqual(['Poppins'])
    expect(Object.keys(compiled.base)).toEqual(expect.arrayContaining(['core', 'container', 'heading', 'button', 'image', 'text-editor']))
    expect(Object.keys(compiled.base)).not.toContain('spacer')
  })

  it('shows placeholders only in the editor', async () => {
    const l = validateLayout([{ id: 'x', elType: 'widget', widgetType: 'nope' }]).data!
    const edit = ctx({ mode: 'edit' })
    const built = await buildLayout(l, edit)
    expect(renderToStaticMarkup(<RenderElements items={built.prepared} ctx={edit} />)).toContain('Unknown element: nope')
  })

  it('rejects unsafe links and sanitises CSS values', async () => {
    const l = validateLayout([
      {
        id: 'b',
        elType: 'widget',
        widgetType: 'button',
        settings: { link: { url: 'javascript:alert(1)' }, button_text_color: 'red;}body{display:none' },
      },
    ]).data!
    const c = ctx()
    const built = await buildLayout(l, c)
    const html = renderToStaticMarkup(<RenderElements items={built.prepared} ctx={c} />)
    expect(html).not.toContain('javascript:')
    expect(html).toContain('<button type="button"')
    expect(built.compiled.css).not.toContain('}body{')
  })

  it('emits hoistable stylesheets and entrance animations without JS', async () => {
    const l = validateLayout([
      { id: 'h', elType: 'widget', widgetType: 'heading', settings: { _animation: 'fadeInUp', hide_mobile: 'hidden-mobile' } },
    ]).data!
    const c = ctx()
    const built = await buildLayout(l, c)
    const html = renderToStaticMarkup(<Blockwright built={built} ctx={c} as="main" />)
    expect(html).toContain('bw-anim-fadeInUp')
    expect(html).toContain('bw-hide-mobile')
    expect(html).toContain('animation-timeline:view()')
    expect(html).toContain('--bw-c-primary:#1d3557')
    expect(html).toContain('fonts.googleapis.com/css2?family=Inter')
    expect(html).toContain('<main class="bw-content">')
  })
})
