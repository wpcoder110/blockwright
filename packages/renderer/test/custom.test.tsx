import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_KIT, createRegistry } from '@blockwright/core'
import { validateLayout } from '@blockwright/schema'
import { RenderElements, buildLayout, createCustomWidget, renderTemplate } from '../src'

describe('template engine', () => {
  it('escapes values and supports raw, if/else, each and paths', () => {
    const out = renderTemplate(
      '<h3>{{ title }}</h3>{{{ body }}}{{#if badge}}<b>{{badge}}</b>{{else}}<i>none</i>{{/if}}<ul>{{#each items}}<li data-i="{{@index}}">{{ this.label }} / {{ title }}</li>{{/each}}</ul><img src="{{ image.url }}">',
      { title: 'A <b>', body: '<p>ok</p>', badge: '', items: [{ label: 'x' }, { label: 'y' }], image: { url: '/a.png' } },
    )
    expect(out).toBe('<h3>A &lt;b&gt;</h3><p>ok</p><i>none</i><ul><li data-i="0">x / A &lt;b&gt;</li><li data-i="1">y / A &lt;b&gt;</li></ul><img src="/a.png">')
  })

  it('renders link attributes and icons safely', () => {
    expect(renderTemplate('<a {{link cta}}>Go</a>', { cta: { url: '/buy', is_external: 'on' } })).toBe('<a href="/buy" target="_blank" rel="noopener">Go</a>')
    expect(renderTemplate('<a {{link cta}}>Go</a>', { cta: { url: 'javascript:alert(1)' } })).toBe('<a href="#">Go</a>')
    expect(renderTemplate('{{icon i}}', { i: { value: 'bw-check', library: 'bw' } })).toContain('<svg class="bw-icon"')
  })

  it('formats sliders and handles missing values', () => {
    expect(renderTemplate('{{size}}|{{nope.deep}}|{{#if nope}}x{{/if}}', { size: { size: 12, unit: 'px' } })).toBe('12px||')
  })
})

describe('custom widgets', () => {
  const pricing = createCustomWidget({
    type: 'pricing-card',
    title: 'Pricing card',
    icon: 'tag',
    template:
      '<article class="card"><h3>{{ plan }}</h3><p class="price">{{ price }}</p><ul>{{#each features}}<li>{{icon this.icon}} {{ this.text }}</li>{{/each}}</ul>{{#if featured}}<span class="badge">Popular</span>{{/if}}<a class="cta" {{link cta}}>{{ cta_text }}</a></article>',
    css: 'selector .card{padding:24px}',
    fields: [
      { name: 'plan', label: 'Plan', default: 'Starter' },
      { name: 'price', label: 'Price', default: 'Rs 2,500' },
      { name: 'featured', label: 'Featured', type: 'switcher' },
      { name: 'cta_text', label: 'Button text', default: 'Choose plan' },
      { name: 'cta', label: 'Button link', type: 'url', default: '/checkout' },
      { name: 'price_color', label: 'Price color', type: 'color', tab: 'style', selector: '{{WRAPPER}} .price', css: 'color: {{VALUE}};' },
      { name: 'plan_typography', label: 'Plan typography', type: 'typography', tab: 'style', selector: '{{WRAPPER}} h3' },
    ],
    definition: null,
  })

  it('builds sections from simple field rows', () => {
    expect(pricing.sections.map((s) => [s.tab, s.label, s.controls.length])).toEqual([
      ['content', 'Content', 5],
      ['style', 'Style', 11],
    ])
    expect(pricing.category).toBe('custom')
    expect(pricing.baseCss).toBe('.bw-w-pricing-card .card{padding:24px}')
  })

  it('renders with defaults and compiles style settings', async () => {
    const registry = createRegistry([pricing])
    const layout = validateLayout([
      { id: 'p1', elType: 'widget', widgetType: 'pricing-card', settings: { featured: 'yes', price_color: '#e03131', plan: '<Pro>', plan_typography_typography: 'custom', plan_typography_font_size: { unit: 'px', size: 30 } } },
    ]).data!
    const ctx = { registry, kit: DEFAULT_KIT, mode: 'live' as const }
    const built = await buildLayout(layout, ctx)
    const html = renderToStaticMarkup(<RenderElements items={built.prepared} ctx={ctx} />)
    expect(html).toContain('<h3>&lt;Pro&gt;</h3>')
    expect(html).toContain('<span class="badge">Popular</span>')
    expect(html).toContain('<a class="cta" href="/checkout">Choose plan</a>')
    expect(built.compiled.css).toContain('.bw-el-p1 .price{color:#e03131}')
    expect(built.compiled.css).toContain('.bw-el-p1 h3{font-size:30px}')
    expect(built.compiled.base['pricing-card']).toContain('.bw-w-pricing-card .card')
  })

  it('accepts a full JSON definition with repeaters and ignores unknown control types', () => {
    const w = createCustomWidget({
      type: 'team',
      title: 'Team',
      template: '{{#each people}}{{ this.name }}{{/each}}',
      definition: {
        sections: [
          {
            id: 'people',
            label: 'People',
            controls: [
              { name: 'people', type: 'repeater', fields: [{ name: 'name', type: 'text' }, { name: 'bad', type: 'script' }], default: [{ name: 'Ahmer' }] },
              { name: 'bad name!', type: 'text' },
              { name: 'box', type: 'background', selector: '{{WRAPPER}}' },
            ],
          },
        ],
      },
    })
    const controls = w.sections[0]!.controls
    expect(controls[0]!.fields!.map((f) => f.name)).toEqual(['name'])
    expect(controls.some((c) => c.name === 'bad name!')).toBe(false)
    expect(controls.some((c) => c.name === 'box_background')).toBe(true)
  })
})
