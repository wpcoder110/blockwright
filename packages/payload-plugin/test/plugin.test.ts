import { describe, expect, it } from 'vitest'
import type { Config } from 'payload'
import { blockwrightPlugin, kitFromDoc, sanitizeLayout, getBlockwrightRuntime, commerceDefaults, toCartView } from '../src'

const baseConfig = {
  admin: { user: 'users' },
  collections: [
    { slug: 'users', auth: true, fields: [] },
    { slug: 'media', upload: true, fields: [] },
    { slug: 'pages', fields: [{ name: 'title', type: 'text' }, { name: 'slug', type: 'text' }] },
  ],
} as unknown as Config

describe('plugin config', () => {
  const config = blockwrightPlugin()(baseConfig) as Config

  it('adds collections, the site style global, endpoints and the dashboard panel', () => {
    const slugs = config.collections!.map((c) => c.slug)
    expect(slugs).toEqual(['users', 'media', 'pages', 'bw-templates', 'bw-form-entries', 'bw-menus', 'bw-widgets'])
    const pages = config.collections!.find((c) => c.slug === 'pages')!
    expect(pages.fields.map((f) => ('name' in f ? f.name : ''))).toEqual(['blockwrightEdit', 'title', 'slug', 'layout'])
    expect(pages.hooks?.beforeChange).toHaveLength(1)
    expect(config.globals!.map((g) => g.slug)).toEqual(['bw-site-style'])
    expect(config.endpoints!.map((e) => `${e.method} ${e.path}`)).toEqual([
      'post /bw/forms/submit',
      'get /bw/registry',
      'post /bw/templates/import',
      'post /bw/demo',
      'get /bw/entries/:id/print',
      'get /bw/menus/:id',
      'get /bw/cart',
      'post /bw/cart',
      'post /bw/checkout',
    ])
    expect(config.admin?.components?.views?.blockwrightEditor?.path).toBe('/blockwright/edit/:collection/:id')
    expect(config.admin?.components?.beforeDashboard).toContain('blockwright/rsc#BlockwrightWelcome')
    expect(config.admin?.components?.afterNavLinks).toContain('blockwright/rsc#BlockwrightNavLink')
    expect(config.admin?.components?.views?.blockwrightOverview?.path).toBe('/blockwright')
  })

  it('marks collections with a slug field as public and adds a preview URL', () => {
    const pages = config.collections!.find((c) => c.slug === 'pages')!
    const rt = getBlockwrightRuntime({ config } as never)
    expect(rt.options.collectionConfig.pages).toMatchObject({ public: true, field: 'layout' })
    expect(typeof pages.admin?.preview).toBe('function')
    expect(rt.options.previewUrl!({ collection: 'pages', doc: { slug: 'about' } })).toBe('/about')
    expect(rt.options.previewUrl!({ collection: 'pages', doc: { slug: 'home' } })).toBe('/')
  })

  it('accepts per-collection options and can be disabled', () => {
    const custom = blockwrightPlugin({
      collections: { pages: { public: false }, media: { url: () => null } },
      disabled: true,
      adminGroup: 'Site',
    })(baseConfig) as Config
    const rt = getBlockwrightRuntime({ config: custom } as never)
    expect(rt.options.collections).toEqual(['pages', 'media'])
    expect(rt.options.collectionConfig.pages!.public).toBe(false)
    expect(rt.options.adminGroup).toBe('Site')
    expect(custom.endpoints).toBeUndefined()
    expect(custom.collections!.map((c) => c.slug)).toContain('bw-templates')
  })

  it('applies collection overrides', () => {
    const custom = blockwrightPlugin({
      templatesOverrides: { slug: 'bw-templates', admin: { group: 'Design' }, fields: ({ defaultFields }) => [...defaultFields, { name: 'note', type: 'text' }] },
    })(baseConfig) as Config
    const templates = custom.collections!.find((c) => c.slug === 'bw-templates')!
    expect(templates.admin?.group).toBe('Design')
    expect(templates.fields.some((f) => 'name' in f && f.name === 'note')).toBe(true)
  })

  it('exposes the runtime and registers the widgets', () => {
    const rt = getBlockwrightRuntime({ config } as never)
    expect(rt.registry.all().map((d) => d.type)).toEqual(
      expect.arrayContaining(['container', 'heading', 'text-editor', 'button', 'image', 'form']),
    )
    expect(rt.options.mediaCollection).toBe('media')
  })

  it('rejects invalid layouts and conditions through field validation', () => {
    const pages = config.collections!.find((c) => c.slug === 'pages')!
    const layout = pages.fields.find((f) => 'name' in f && f.name === 'layout') as { validate: (v: unknown) => unknown }
    expect(layout.validate([{ elType: 'widget' }])).toMatch(/Invalid layout/)
    expect(layout.validate([])).toBe(true)
    const templates = config.collections!.find((c) => c.slug === 'bw-templates')!
    const cond = templates.fields.find((f) => 'name' in f && f.name === 'conditions') as { validate: (v: unknown) => unknown }
    expect(cond.validate(['include/general', 'exclude/singular/pages/4'])).toBe(true)
    expect(cond.validate(['everywhere'])).toMatch(/not a valid condition/)
  })
})

describe('sanitizeLayout', () => {
  const config = blockwrightPlugin()(baseConfig) as Config
  const { registry } = getBlockwrightRuntime({ config } as never)
  const layout = [
    {
      id: 't1',
      elType: 'widget' as const,
      widgetType: 'text-editor',
      settings: { editor: '<p onclick="x()">Hi<script>alert(1)</script> <a href="javascript:x" target="_blank">l</a></p>', custom_css: 'selector{color:red}' },
      elements: [] as [],
    },
    { id: 'h1', elType: 'widget' as const, widgetType: 'html', settings: { html: '<script>track()</script>' }, elements: [] as [] },
    {
      id: 'f1',
      elType: 'widget' as const,
      widgetType: 'form',
      settings: { form_fields: [{ custom_id: 'x', field_type: 'html', field_html: '<b>ok</b><img src=x onerror=alert(1)>' }] },
      elements: [] as [],
    },
  ]

  it('cleans rich text and HTML form fields', () => {
    const out = sanitizeLayout(layout, null, registry, true)
    expect(out[0]!.settings.editor).toBe('<p>Hi <a target="_blank" rel="noopener">l</a></p>')
    expect((out[2]!.settings.form_fields as Array<{ field_html: string }>)[0]!.field_html).toBe('<b>ok</b><img src="x" />')
    // admins keep raw HTML and custom CSS
    expect(out[1]!.settings.html).toBe('<script>track()</script>')
    expect(out[0]!.settings.custom_css).toBe('selector{color:red}')
  })

  it('keeps previous restricted values for other users', () => {
    const previous = [{ ...layout[1]!, settings: { html: '<p>approved</p>' } }]
    const out = sanitizeLayout(layout, previous, registry, false)
    expect(out[1]!.settings.html).toBe('<p>approved</p>')
    expect(out[0]!.settings.custom_css).toBeUndefined()
  })
})

describe('kitFromDoc', () => {
  it('maps the stored global', () => {
    const kit = kitFromDoc({
      colors: [{ colorId: 'Brand', title: 'Brand', color: '#ff6600' }],
      typography: [{ typoId: 'primary', title: 'Primary', fontFamily: 'Poppins', fontWeight: '700', fontSize: 40 }],
      containerWidth: 1200,
      breakpoints: { mobile: 600, laptop: 1440 },
      fontProvider: 'none',
    })
    expect(kit.colors).toEqual([{ id: 'brand', title: 'Brand', color: '#ff6600' }])
    expect(kit.typography[0]).toMatchObject({ id: 'primary', fontFamily: 'Poppins', fontWeight: '700', fontSize: 40 })
    expect(kit.containerWidth).toBe(1200)
    expect(kit.breakpoints.mobile).toMatchObject({ value: 600, enabled: true })
    expect(kit.breakpoints.laptop).toMatchObject({ value: 1440, enabled: true })
    expect(kit.breakpoints.widescreen.enabled).toBe(false)
    expect(kit.fontProvider).toBe('none')
  })
})

describe('cart', () => {
  const options = commerceDefaults({ urlPattern: '/shop/{slug}' })

  it('reads per-currency price fields the ecommerce plugin creates', () => {
    const cart = {
      items: [
        { id: 'a', quantity: 2, product: { id: 1, title: 'Bedsheet', slug: 'bedsheet', priceInUSD: 8500, gallery: [{ image: { url: '/a.jpg', alt: 'A' } }] } },
        { id: 'b', quantity: 1, product: { id: 2, title: 'Cushion', slug: 'cushion', priceInUSD: 2200 } },
      ],
    }
    const view = toCartView(cart, options)
    expect(view.count).toBe(3)
    expect(view.subtotal).toBe(19200)
    expect(view.currency).toBe('USD')
    expect(view.lines[0]).toMatchObject({ title: 'Bedsheet', url: '/shop/bedsheet', quantity: 2, lineTotal: 17000 })
    expect(view.lines[0]!.image).toMatchObject({ url: '/a.jpg' })
  })

  it('treats a missing or emptied cart as empty', () => {
    expect(toCartView(null, options)).toMatchObject({ empty: true, count: 0, subtotal: 0 })
    expect(toCartView({ items: [] }, options).empty).toBe(true)
    // items whose product was deleted are skipped rather than breaking the cart
    expect(toCartView({ items: [{ id: 'x', quantity: 1, product: null }] }, options).empty).toBe(true)
  })

  it('uses the configured paths when a store has its own shape', () => {
    const custom = commerceDefaults({ amountPath: 'price', titlePath: 'name', urlPattern: '/p/{id}' })
    const view = toCartView({ items: [{ id: 'a', quantity: 2, product: { id: 7, name: 'Throw', price: 1000 } }] }, custom)
    expect(view.lines[0]).toMatchObject({ title: 'Throw', url: '/p/7', lineTotal: 2000 })
  })
})
