import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_KIT, type RenderContext, createRegistry } from '@blockwright/core'
import { validateLayout } from '@blockwright/schema'
import { RenderElements, buildLayout } from '@blockwright/renderer'
import { COMMERCE_TAGS, commerceElements, formatPrice, toCard } from '../src'

const products = [
  { id: 1, title: 'Indigo bedsheet', slug: 'indigo-bedsheet', inventory: 4, prices: [{ amount: 850000, currency: 'PKR' }], gallery: [{ image: { url: '/a.jpg', alt: 'Sheet', width: 800, height: 800 } }] },
  { id: 2, title: 'Cushion cover', slug: 'cushion-cover', inventory: 0, prices: [{ amount: 220000, currency: 'PKR' }], gallery: [] },
]

const registry = createRegistry(commerceElements, COMMERCE_TAGS)
const ctx = (extra: Partial<RenderContext> = {}): RenderContext => ({
  registry,
  kit: DEFAULT_KIT,
  mode: 'live',
  request: { path: '/shop' },
  services: { find: async () => ({ docs: products as unknown as Record<string, unknown>[] }) },
  ...extra,
})

const render = async (widgetType: string, settings: Record<string, unknown> = {}, c = ctx()) => {
  const layout = validateLayout([{ id: 'c1', elType: 'widget', widgetType, settings }]).data!
  const built = await buildLayout(layout, c)
  return { html: renderToStaticMarkup(<RenderElements items={built.prepared} ctx={c} />), css: built.compiled }
}

describe('price formatting', () => {
  it('reads dotted paths and formats the stored currency', () => {
    expect(formatPrice(products[0], { amountPath: 'prices.0.amount', currencyPath: 'prices.0.currency' })).toBe('PKR 8,500')
    expect(formatPrice(products[0], { amountPath: 'prices.0.amount', currency: 'USD', minorUnits: false })).toBe('$850,000')
    expect(formatPrice({}, { amountPath: 'prices.0.amount' })).toBe('')
    expect(formatPrice({ price: '1999' }, { amountPath: 'price', currency: 'EUR' })).toBe('€19.99')
  })

  it('maps a document to a product card', () => {
    const card = toCard(products[0] as never, {
      titlePath: 'title',
      imagePath: 'gallery.image',
      amountPath: 'prices.0.amount',
      currencyPath: 'prices.0.currency',
      urlPattern: '/products/{slug}',
      inventoryPath: 'inventory',
    })
    expect(card).toMatchObject({ title: 'Indigo bedsheet', url: '/products/indigo-bedsheet', price: 'PKR 8,500', inStock: true })
    expect(card.image).toMatchObject({ url: '/a.jpg', alt: 'Sheet' })
  })
})

describe('product widgets', () => {
  it('lists products with image, price, stock and link', async () => {
    const { html, css } = await render('product-grid', { columns: { unit: 'fr', size: 3 } })
    expect(html).toContain('<ul class="bw-products">')
    expect(html.match(/<li class="bw-product"/g)).toHaveLength(2)
    expect(html).toContain('href="/products/indigo-bedsheet"')
    expect(html).toContain('PKR 8,500')
    expect(html).toContain('Out of stock')
    expect(html).toContain('alt="Sheet"')
    expect(css.css).toContain('.bw-el-c1{--bw-shop-cols:repeat(3, minmax(0, 1fr))}')
  })

  it('shows nothing live when the collection has no products, and a sample in the editor', async () => {
    const empty = ctx({ services: { find: async () => ({ docs: [] }) } })
    expect((await render('product-grid', {}, empty)).html).toBe('<div class="bw-el bw-el-c1 bw-w-product-grid"></div>')
    const edit = ctx({ mode: 'edit', services: { find: async () => ({ docs: [] }) } })
    expect((await render('product-grid', {}, edit)).html).toContain('Indigo bedsheet set')
  })

  it('renders the price of the product being viewed', async () => {
    const c = ctx({ document: { collection: 'products', id: 1, data: products[0] as never } })
    const { html } = await render('product-price', { prefix: 'From' }, c)
    expect(html).toContain('PKR 8,500')
    expect(html).toContain('From')
  })

  it('exposes price and stock as dynamic values', async () => {
    const c = ctx({ document: { collection: 'products', id: 2, data: products[1] as never } })
    const price = registry.tag('product-price')!
    const stock = registry.tag('product-stock')!
    expect(await price.resolve(c, {})).toBe('PKR 2,200')
    expect(await stock.resolve(c, {})).toBe('Out of stock')
  })
})
