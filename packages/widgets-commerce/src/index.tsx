import {
  type Registry,
  type RenderProps,
  ALIGN_OPTIONS,
  border,
  borderRadius,
  boxShadow,
  choose,
  color,
  defineTag,
  defineWidget,
  dimensions,
  heading,
  number,
  opts,
  padding,
  section,
  select,
  slider,
  switcher,
  text,
  typography,
} from '@blockwright/core'
import { BwImage, BwLink } from '@blockwright/renderer'
import { type MapOptions, type ProductCard, formatPrice, readPath, toCard } from './price'

export * from './price'

const W = '{{WRAPPER}}'

const SAMPLE: ProductCard[] = [
  { id: '1', title: 'Indigo bedsheet set', url: '/products/indigo-bedsheet-set', price: 'Rs 8,500', inStock: true },
  { id: '2', title: 'Block-printed cushion cover', url: '/products/cushion-cover', price: 'Rs 2,200', inStock: true },
  { id: '3', title: 'Madder table runner', url: '/products/table-runner', price: 'Rs 3,900', inStock: false },
]

const mapping = (s: Record<string, any>): MapOptions => ({
  titlePath: s.title_field || 'title',
  imagePath: s.image_field || 'gallery.image',
  amountPath: s.price_field || 'prices.0.amount',
  currencyPath: s.currency_field || 'prices.0.currency',
  currency: s.currency || 'USD',
  minorUnits: s.minor_units !== '',
  urlPattern: s.url_pattern || '/products/{slug}',
  inventoryPath: s.inventory_field || 'inventory',
})

const fieldMappingControls = [
  heading('heading_fields', 'Field mapping'),
  text('title_field', { label: 'Title field', default: 'title', description: 'Dotted path inside the document, e.g. title.' }),
  text('image_field', { label: 'Image field', default: 'gallery.image' }),
  text('price_field', { label: 'Price field', default: 'prices.0.amount' }),
  text('currency_field', { label: 'Currency field', default: 'prices.0.currency' }),
  text('currency', { label: 'Fallback currency', default: 'USD' }),
  switcher('minor_units', { label: 'Amounts stored in cents', default: 'yes', description: 'Most stores save 2500 to mean 25.00.' }),
  text('url_pattern', { label: 'Product URL', default: '/products/{slug}', description: 'Use {slug} or {id} from the document.' }),
  text('inventory_field', { label: 'Stock field', default: 'inventory' }),
]

/* --------------------------- Product grid -------------------------- */

function ProductGrid({ settings, data, ctx }: RenderProps) {
  const products = (Array.isArray(data) && data.length ? data : ctx.mode === 'live' ? [] : SAMPLE) as ProductCard[]
  if (!products.length) {
    return ctx.mode === 'live' ? null : <div className="bw-shop-empty">No products found. Check the collection and filters.</div>
  }
  const showPrice = settings.show_price !== ''
  const showButton = settings.show_button !== ''
  const buttonText = String(settings.button_text || 'View product')
  return (
    <ul className="bw-products">
      {products.map((p) => (
        <li className="bw-product" key={p.id}>
          <BwLink ctx={ctx} href={p.url} className="bw-product-link" aria-label={p.title}>
            <span className="bw-product-media">
              {p.image?.url ? (
                <BwImage ctx={ctx} src={p.image.url} alt={p.image.alt || ''} width={p.image.width} height={p.image.height} sizes="(max-width: 767px) 50vw, 25vw" />
              ) : (
                <span className="bw-product-placeholder" aria-hidden="true" />
              )}
              {!p.inStock && settings.show_stock !== '' ? <span className="bw-product-badge">{String(settings.out_of_stock_text || 'Out of stock')}</span> : null}
            </span>
            <span className="bw-product-title">{p.title}</span>
          </BwLink>
          {showPrice && p.price ? <span className="bw-product-price">{p.price}</span> : null}
          {showButton ? (
            <BwLink ctx={ctx} href={p.url} className="bw-btn bw-btn-sm bw-product-button">
              {buttonText}
            </BwLink>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export const productGrid = defineWidget({
  type: 'product-grid',
  title: 'Products',
  description: 'A grid of products from any collection, with image, title, price and a link.',
  icon: 'cart',
  category: 'commerce',
  keywords: ['products', 'shop', 'ecommerce', 'grid', 'catalogue', 'store'],
  render: ProductGrid as never,
  prepare: async (settings, ctx) => {
    const collection = String(settings.collection || 'products')
    if (!ctx.services?.find) return null
    const where: Record<string, unknown> = {}
    if (settings.only_published !== '') where._status = { equals: 'published' }
    if (settings.filter_field && settings.filter_value) {
      where[String(settings.filter_field)] = { equals: String(settings.filter_value) }
    }
    const res = await ctx.services.find({
      collection,
      where: Object.keys(where).length ? where : undefined,
      limit: Math.min(Number(settings.limit) || 8, 48),
      sort: String(settings.sort || '-createdAt'),
      depth: 2,
    })
    return res.docs.map((d) => toCard(d, mapping(settings)))
  },
  sections: [
    section('section_query', 'Products', [
      text('collection', { label: 'Collection', default: 'products', description: 'Slug of the collection to list, e.g. products.' }),
      number('limit', { label: 'How many', default: 8 }),
      select('sort', {
        label: 'Sort by',
        options: opts({ '-createdAt': 'Newest first', createdAt: 'Oldest first', title: 'Title A–Z', '-title': 'Title Z–A', '-updatedAt': 'Recently updated' }),
        default: '-createdAt',
      }),
      switcher('only_published', { label: 'Published only', default: 'yes' }),
      text('filter_field', { label: 'Filter field', placeholder: 'category' }),
      text('filter_value', { label: 'Filter value', placeholder: 'bedsheets', dynamic: ['text'] }),
      heading('heading_display', 'Card'),
      switcher('show_price', { label: 'Show price', default: 'yes' }),
      switcher('show_stock', { label: 'Show stock badge', default: 'yes' }),
      text('out_of_stock_text', { label: 'Out of stock text', default: 'Out of stock' }),
      switcher('show_button', { label: 'Show button', default: 'yes' }),
      text('button_text', { label: 'Button text', default: 'View product' }),
      ...fieldMappingControls,
    ]),
    section(
      'section_style_grid',
      'Grid',
      [
        slider('columns', {
          label: 'Columns',
          responsive: true,
          units: ['fr'],
          default: { unit: 'fr', size: 4 },
          range: { fr: { min: 1, max: 8 } },
          selectors: { [W]: '--bw-shop-cols: repeat({{SIZE}}, minmax(0, 1fr));' },
        }),
        slider('gap', { label: 'Gap', responsive: true, units: ['px', 'em'], selectors: { [W]: '--bw-shop-gap: {{SIZE}}{{UNIT}};' } }),
        select('image_ratio', {
          label: 'Image ratio',
          options: opts({ '1/1': 'Square', '4/3': '4:3', '3/4': 'Portrait', '16/9': 'Wide', '': 'Original' }),
          default: '1/1',
          selectors: { [`${W} .bw-product-media`]: 'aspect-ratio: {{VALUE}};' },
        }),
        choose('text_align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [`${W} .bw-product`]: 'text-align: {{VALUE}};' } }),
        padding('card_padding', `${W} .bw-product`),
        color('card_background', { label: 'Card background', global: 'colors', selectors: { [`${W} .bw-product`]: 'background-color: {{VALUE}};' } }),
        ...border('card_border', { selector: `${W} .bw-product` }),
        borderRadius('card_radius', { selector: `${W} .bw-product, ${W} .bw-product-media` }),
        ...boxShadow('card_shadow', { selector: `${W} .bw-product` }),
        heading('heading_title_style', 'Title'),
        color('title_color', { label: 'Colour', global: 'colors', selectors: { [`${W} .bw-product-title`]: 'color: {{VALUE}};' } }),
        ...typography('title_typography', { selector: `${W} .bw-product-title` }),
        heading('heading_price_style', 'Price'),
        color('price_color', { label: 'Colour', global: 'colors', selectors: { [`${W} .bw-product-price`]: 'color: {{VALUE}};' } }),
        ...typography('price_typography', { selector: `${W} .bw-product-price` }),
        heading('heading_button_style', 'Button'),
        color('button_background', { label: 'Background', global: 'colors', selectors: { [`${W} .bw-product-button`]: 'background-color: {{VALUE}};' } }),
        color('button_color', { label: 'Text colour', global: 'colors', selectors: { [`${W} .bw-product-button`]: 'color: {{VALUE}};' } }),
        dimensions('button_radius', { label: 'Button radius', selectors: { [`${W} .bw-product-button`]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-products{--bw-shop-cols:repeat(4,minmax(0,1fr));--bw-shop-gap:20px;list-style:none;margin:0;padding:0;display:grid;grid-template-columns:var(--bw-shop-cols);gap:var(--bw-shop-gap)}' +
    '.bw-product{display:flex;flex-direction:column;gap:8px;min-width:0}' +
    '.bw-product-link{display:flex;flex-direction:column;gap:8px;color:inherit;text-decoration:none}' +
    '.bw-product-media{position:relative;display:block;aspect-ratio:1;overflow:hidden;background:#f1f3f5;border-radius:inherit}' +
    '.bw-product-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}' +
    '.bw-product-link:hover .bw-product-media img{transform:scale(1.03)}' +
    '.bw-product-placeholder{display:block;width:100%;height:100%;background:repeating-linear-gradient(45deg,#eef0f3 0 10px,#e3e6ea 10px 20px)}' +
    '.bw-product-badge{position:absolute;left:8px;top:8px;padding:2px 8px;border-radius:3px;background:rgba(20,20,20,.85);color:#fff;font-size:12px}' +
    '.bw-product-title{font-weight:600;color:var(--bw-c-primary);line-height:1.35}' +
    '.bw-product-price{color:var(--bw-c-text);font-variant-numeric:tabular-nums}' +
    '.bw-product-button{align-self:start;display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:4px;background:var(--bw-c-accent);color:#fff;font-size:14px;font-weight:500;text-decoration:none}' +
    '.bw-product-button:hover{opacity:.9}' +
    '.bw-shop-empty{padding:16px;border:1px dashed #b7bcc4;border-radius:6px;text-align:center;color:#687080;font:13px system-ui}' +
    '@media (max-width:767px){.bw-products{grid-template-columns:repeat(2,minmax(0,1fr))}}',
})

/* ----------------------------- Price ------------------------------- */

function Price({ settings, ctx }: RenderProps) {
  const doc = ctx.document?.data
  const price = doc ? formatPrice(doc, mapping(settings)) : ctx.mode === 'live' ? '' : 'Rs 8,500'
  if (!price) return null
  return (
    <span className="bw-price">
      {settings.prefix ? <span className="bw-price-prefix">{String(settings.prefix)}</span> : null}
      {price}
      {settings.suffix ? <span className="bw-price-suffix">{String(settings.suffix)}</span> : null}
    </span>
  )
}

export const productPrice = defineWidget({
  type: 'product-price',
  title: 'Price',
  description: 'The price of the product being viewed, formatted for its currency.',
  icon: 'tag',
  category: 'commerce',
  keywords: ['price', 'product', 'ecommerce', 'currency'],
  render: Price as never,
  sections: [
    section('section_price', 'Price', [text('prefix', { label: 'Before' }), text('suffix', { label: 'After' }), ...fieldMappingControls.filter((c) => !['url_pattern', 'title_field', 'image_field', 'inventory_field'].includes(c.name))]),
    section(
      'section_price_style',
      'Price',
      [
        color('price_color', { label: 'Colour', global: 'colors', selectors: { [`${W} .bw-price`]: 'color: {{VALUE}};' } }),
        ...typography('price_typography', { selector: `${W} .bw-price` }),
        choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [W]: 'text-align: {{VALUE}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss: '.bw-price{font-size:1.4em;font-weight:600;color:var(--bw-c-primary);font-variant-numeric:tabular-nums}.bw-price-prefix,.bw-price-suffix{font-size:.7em;opacity:.75;margin:0 .25em}',
})

/* ------------------------- Dynamic values -------------------------- */

export const COMMERCE_TAGS = [
  defineTag({
    name: 'product-price',
    title: 'Product: price',
    group: 'commerce',
    returns: ['text'],
    settings: [
      { name: 'amountPath', label: 'Price field', type: 'text', default: 'prices.0.amount' },
      { name: 'currencyPath', label: 'Currency field', type: 'text', default: 'prices.0.currency' },
    ],
    resolve: (ctx, s) =>
      ctx.document?.data
        ? formatPrice(ctx.document.data, {
            amountPath: String(s.amountPath || 'prices.0.amount'),
            currencyPath: String(s.currencyPath || 'prices.0.currency'),
            locale: ctx.request?.locale,
          })
        : '',
  }),
  defineTag({
    name: 'product-stock',
    title: 'Product: stock',
    group: 'commerce',
    returns: ['text'],
    settings: [
      { name: 'field', label: 'Stock field', type: 'text', default: 'inventory' },
      { name: 'inStock', label: 'In stock text', type: 'text', default: 'In stock' },
      { name: 'outOfStock', label: 'Out of stock text', type: 'text', default: 'Out of stock' },
    ],
    resolve: (ctx, s) => {
      const value = ctx.document?.data ? readPath(ctx.document.data, String(s.field || 'inventory')) : undefined
      if (value === undefined || value === null) return ''
      return Number(value) > 0 ? String(s.inStock || 'In stock') : String(s.outOfStock || 'Out of stock')
    },
  }),
]

export const commerceElements = [productGrid, productPrice]

export function registerCommerceElements(registry: Registry) {
  commerceElements.forEach((d) => registry.register(d))
  COMMERCE_TAGS.forEach((t) => registry.registerTag(t))
}
