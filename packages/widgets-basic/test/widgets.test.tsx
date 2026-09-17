import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_KIT, type RenderContext, createRegistry } from '@blockwright/core'
import { validateLayout } from '@blockwright/schema'
import { RenderElements, buildLayout, resolveIcon } from '@blockwright/renderer'
import { basicElements, vimeoId, youtubeId } from '../src'

const registry = createRegistry(basicElements)
const ctx: RenderContext = { registry, kit: DEFAULT_KIT, mode: 'live', request: { path: '/' } }

async function render(widgetType: string, settings: Record<string, unknown> = {}) {
  const layout = validateLayout([{ id: 'w1', elType: 'widget', widgetType, settings }]).data!
  const built = await buildLayout(layout, ctx)
  return { html: renderToStaticMarkup(<RenderElements items={built.prepared} ctx={ctx} />), css: built.compiled }
}

describe('widget pack', () => {
  it('renders every registered widget with its defaults', async () => {
    for (const def of registry.all()) {
      const { html } = await render(def.type)
      expect(typeof html, def.type).toBe('string')
    }
  })

  it('icons resolve built-in names and imported Font Awesome classes', async () => {
    expect(resolveIcon({ value: 'fas fa-phone-alt', library: 'fa-solid' })).toEqual({ name: 'phone' })
    expect(resolveIcon({ value: 'bw-check', library: 'bw' })).toEqual({ name: 'check' })
    expect(resolveIcon({ value: { url: '/a.svg' }, library: 'svg' })).toEqual({ url: '/a.svg' })
    const { html } = await render('icon', { selected_icon: { value: 'fab fa-whatsapp', library: 'fa-brands' }, view: 'stacked', link: { url: '/contact' } })
    expect(html).toContain('bw-view-stacked')
    expect(html).toContain('<a href="/contact"')
    expect(html).toContain('viewBox="0 0 24 24"')
  })

  it('icon box and icon list keep semantic markup', async () => {
    const box = await render('icon-box', { title_size: 'h4', title_text: 'Fast delivery', position: 'left' })
    expect(box.html).toContain('<h4 class="bw-box-title">Fast delivery</h4>')
    expect(box.html).toContain('bw-box-left')
    const list = await render('icon-list')
    expect(list.html).toContain('<ul class="bw-icon-list">')
    expect(list.html.match(/<li/g)).toHaveLength(3)
  })

  it('video uses a lightweight facade and parses links', async () => {
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1')).toBe('dQw4w9WgXcQ')
    expect(vimeoId('https://vimeo.com/76979871')).toBe('76979871')
    const { html } = await render('video', { youtube_url: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('srcDoc=')
    expect(html).toContain('i.ytimg.com/vi/dQw4w9WgXcQ')
    expect(html).not.toContain('<script')
  })

  it('tabs work without JavaScript and accordion can emit FAQ schema', async () => {
    const t = await render('tabs')
    expect(t.html.match(/type="radio"/g)).toHaveLength(2)
    const a = await render('toggle', { faq_schema: 'yes' })
    expect(a.html).toContain('<details')
    expect(a.html).toContain('"@type":"FAQPage"')
  })

  it('counter, progress and rating expose accessible values', async () => {
    const c = await render('counter', { ending_number: 250, suffix: '+' })
    expect(c.html).toContain('250')
    expect(c.html).toContain('is-anim')
    expect(c.css.base.counter).toContain('@property --bw-n')
    const p = await render('progress', { percent: { unit: '%', size: 80 } })
    expect(p.html).toContain('aria-valuenow="80"')
    const r = await render('star-rating', { rating: 4.5 })
    expect(r.html).toContain('aria-label="Rated 4.5 out of 5"')
  })

  it('maps, gallery and social icons render safely', async () => {
    const m = await render('google_maps', { address: 'Mall Road, Lahore' })
    expect(m.html).toContain('maps.google.com/maps?q=Mall%20Road%2C%20Lahore')
    const g = await render('basic-gallery', { gallery: [{ id: 1, url: '/a.jpg', alt: 'A', width: 400, height: 300 }], gallery_link: 'file' })
    expect(g.html).toContain('<ul class="bw-gallery"')
    expect(g.html).toContain('href="/a.jpg"')
    const s = await render('social-icons')
    expect(s.html).toContain('aria-label="Facebook"')
    expect(s.html).toContain('--bw-brand:#1877f2')
  })
})

describe('nav menu', () => {
  const menu = [
    { id: 'a', label: 'Home', url: '/', children: [] },
    {
      id: 'b',
      label: 'Services',
      url: '/services',
      children: [
        { id: 'b1', label: 'Design', url: '/services/design', children: [] },
        { id: 'b2', label: 'Partner', url: 'https://example.com', newTab: true, rel: 'nofollow', children: [] },
      ],
    },
  ]

  async function renderNav(path: string, settings: Record<string, unknown> = {}, mode: RenderContext['mode'] = 'live') {
    const c: RenderContext = { ...ctx, mode, request: { path }, services: { menu: async (id) => (id === '7' ? menu : null) } }
    const layout = validateLayout([{ id: 'nav1', elType: 'widget', widgetType: 'nav-menu', settings: { menu: '7', ...settings } }]).data!
    const built = await buildLayout(layout, c)
    return { html: renderToStaticMarkup(<RenderElements items={built.prepared} ctx={c} />), css: built.compiled }
  }

  it('renders an accessible menu with dropdowns and the current page', async () => {
    const { html } = await renderNav('/services/design/')
    expect(html).toContain('<nav class="bw-nav bw-nav-horizontal bw-nav-bp-tablet bw-pointer-underline" aria-label="Main menu">')
    expect(html).toContain('<li class="bw-menu-item has-children is-current-parent">')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('<ul class="bw-submenu">')
    expect(html).toContain('href="https://example.com" class="bw-menu-link" target="_blank" rel="noopener nofollow"')
    expect(html).toContain('aria-haspopup="true"')
  })

  it('adds a CSS-only mobile toggle unless disabled', async () => {
    const withToggle = await renderNav('/', { toggle_label: 'Menu' })
    expect(withToggle.html).toContain('type="checkbox"')
    expect(withToggle.html).toContain('<span class="bw-nav-toggle-text">Menu</span>')
    expect(withToggle.css.base['nav-menu']).toContain('.bw-nav-bp-tablet .bw-nav-check:checked~.bw-menu{display:flex}')
    expect(withToggle.html).not.toContain('<script')
    const without = await renderNav('/', { dropdown: 'none' })
    expect(without.html).not.toContain('type="checkbox"')
  })

  it('shows nothing live without a menu and a sample in the editor', async () => {
    expect((await renderNav('/', { menu: '999' })).html).toBe('<div class="bw-el bw-el-nav1 bw-w-nav-menu"></div>')
    expect((await renderNav('/', { menu: '' }, 'edit')).html).toContain('Services')
  })

  it('compiles style settings', async () => {
    const { css } = await renderNav('/', { color_menu_item: '#123456', align_items: 'center', padding_horizontal_menu_item: { unit: 'px', size: 20 } })
    expect(css.css).toContain('.bw-el-nav1{--bw-nav-justify:center;--bw-nav-color:#123456;--bw-nav-px:20px}')
  })
})
