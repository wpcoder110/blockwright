/** Demo shop pages and a product template, built from Blockwright widgets. */
import { buildTagString, generateId } from 'blockwright/core'
import type { BasePayload } from 'payload'

const id = () => Math.random().toString(36).slice(2, 9)

const frame = (settings: Record<string, unknown>, elements: unknown[]) => ({
  id: id(),
  elType: 'container',
  settings: { content_width: 'boxed', padding: { unit: 'px', top: 50, right: 20, bottom: 50, left: 20 }, flex_gap: { unit: 'px', size: 24 }, ...settings },
  elements,
})
const widget = (widgetType: string, settings: Record<string, unknown> = {}) => ({ id: id(), elType: 'widget', widgetType, settings, elements: [] })
const heading = (title: string, tag = 'h1') => widget('heading', { title, header_size: tag })

export async function installShopDemo(payload: BasePayload, collection = 'pages') {
  const pages: Array<[string, string, unknown[]]> = [
    [
      'Shop',
      'shop',
      [
        frame({}, [
          heading('Our textiles'),
          widget('text-editor', { editor: '<p>Everything is printed by hand in Lahore. Prices include delivery inside Pakistan.</p>' }),
          widget('product-grid', { limit: 8, columns: { unit: 'fr', size: 4 }, button_text: 'View product', url_pattern: '/products/{slug}' }),
        ]),
      ],
    ],
    ['Cart', 'cart', [frame({}, [heading('Your cart'), widget('cart', { checkout_url: '/checkout', continue_url: '/shop' })])]],
    ['Checkout', 'checkout', [frame({}, [heading('Checkout'), widget('checkout', { fields: 'name,email,phone,address,city' })])]],
    [
      'Thank you',
      'thank-you',
      [frame({}, [heading('Thank you for your order'), widget('text-editor', { editor: '<p>We have your order and will confirm delivery by phone.</p>' })])],
    ],
  ]

  const made: string[] = []
  for (const [title, slug, layout] of pages) {
    const found = await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
    const data = { title, slug, layout, _status: 'published' } as never
    if (found.docs[0]) await payload.update({ collection: collection as never, id: (found.docs[0] as { id: string | number }).id, data, overrideAccess: true })
    else await payload.create({ collection: collection as never, data, overrideAccess: true })
    made.push(slug)
  }

  // product template: used for every product page
  const layout = [
    frame({ flex_direction: 'row', flex_gap: { unit: 'px', size: 40 } }, [
      frame({ content_width: 'full', padding: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0 }, _flex_size: 'grow' }, [
        widget('heading', {
          title: 'Product',
          header_size: 'h1',
          __dynamic__: { title: buildTagString({ id: generateId(), name: 'doc-title', settings: {} }) },
        }),
        widget('product-price', {}),
        widget('add-to-cart', { show_quantity: 'yes', cart_url: '/cart' }),
        widget('text-editor', { editor: '<p>Hand block-printed with natural dyes. Wash cold, dry in shade.</p>' }),
      ]),
    ]),
  ]
  const existing = await payload.find({ collection: 'bw-templates' as never, where: { title: { equals: 'Product page' } }, limit: 1, overrideAccess: true })
  const template = { title: 'Product page', type: 'product', conditions: ['include/singular/products'], layout, _status: 'published' } as never
  if (existing.docs[0]) await payload.update({ collection: 'bw-templates' as never, id: (existing.docs[0] as { id: string | number }).id, data: template, overrideAccess: true })
  else await payload.create({ collection: 'bw-templates' as never, data: template, overrideAccess: true })

  payload.logger.info(`[seed] shop pages: ${made.join(', ')}; template: Product page`)
}
