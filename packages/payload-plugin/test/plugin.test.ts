import { describe, expect, it } from 'vitest'
import type { Config } from 'payload'
import { blockwrightPlugin, kitFromDoc, sanitizeLayout, getBlockwrightRuntime } from '../src'

const baseConfig = {
  admin: { user: 'users' },
  collections: [
    { slug: 'users', auth: true, fields: [] },
    { slug: 'media', upload: true, fields: [] },
    { slug: 'pages', fields: [{ name: 'title', type: 'text' }] },
  ],
} as unknown as Config

describe('plugin config', () => {
  const config = blockwrightPlugin()(baseConfig) as Config

  it('adds collections, the site style global, endpoints and the dashboard panel', () => {
    const slugs = config.collections!.map((c) => c.slug)
    expect(slugs).toEqual(['users', 'media', 'pages', 'bw-templates', 'bw-form-entries', 'bw-menus', 'bw-widgets'])
    const pages = config.collections!.find((c) => c.slug === 'pages')!
    expect(pages.fields.map((f) => ('name' in f ? f.name : ''))).toEqual(['blockwrightEdit', 'title', 'layout'])
    expect(pages.hooks?.beforeChange).toHaveLength(1)
    expect(config.globals!.map((g) => g.slug)).toEqual(['bw-site-style'])
    expect(config.endpoints!.map((e) => `${e.method} ${e.path}`)).toEqual([
      'post /bw/forms/submit',
      'get /bw/registry',
      'post /bw/templates/import',
      'post /bw/demo',
      'get /bw/entries/:id/print',
      'get /bw/menus/:id',
    ])
    expect(config.admin?.components?.views?.blockwrightEditor?.path).toBe('/blockwright/edit/:collection/:id')
    expect(config.admin?.components?.beforeDashboard).toContain('@blockwright/payload-plugin/rsc#BlockwrightWelcome')
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
