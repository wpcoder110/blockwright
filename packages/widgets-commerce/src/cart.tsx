import { type RenderProps, ALIGN_OPTIONS, border, borderRadius, choose, color, defineWidget, dimensions, heading, opts, padding, section, select, slider, switcher, text, typography } from '@blockwright/core'
import { AddToCart, CartCount, CartTable, Checkout } from '@blockwright/widgets-commerce/client'
import { readPath } from './price'

const W = '{{WRAPPER}}'

const minorUnits = (s: Record<string, any>) => s.minor_units !== ''

/* --------------------------- Add to cart --------------------------- */

function AddToCartWidget({ settings, ctx }: RenderProps) {
  const doc = ctx.document?.data as Record<string, unknown> | undefined
  const productId = String(settings.product_id || doc?.id || '')
  const stock = doc && settings.inventory_field !== '' ? readPath(doc, String(settings.inventory_field || 'inventory')) : undefined
  const soldOut = stock !== undefined && stock !== null && Number(stock) <= 0
  if (!productId) {
    return ctx.mode === 'live' ? null : <div className="bw-shop-empty">Add to cart works on a product template, or set a product ID.</div>
  }
  return (
    <AddToCart
      product={productId}
      variant={settings.variant_id ? String(settings.variant_id) : undefined}
      label={String(settings.label || 'Add to cart')}
      addedLabel={String(settings.added_label || 'Added to cart')}
      showQuantity={settings.show_quantity !== ''}
      soldOut={soldOut}
      cartPath={String(settings.cart_url || '/cart')}
      goToCart={settings.go_to_cart === 'yes'}
    />
  )
}

const buttonStyle = (selector: string) => [
  color('button_color', { label: 'Text colour', global: 'colors', selectors: { [selector]: 'color: {{VALUE}};' } }),
  color('button_background', { label: 'Background', global: 'colors', selectors: { [selector]: 'background-color: {{VALUE}};' } }),
  ...typography('button_typography', { selector }),
  padding('button_padding', selector),
  dimensions('button_radius', { label: 'Border radius', selectors: { [selector]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
  slider('button_width', { label: 'Width', responsive: true, units: ['%', 'px'], selectors: { [selector]: 'width: {{SIZE}}{{UNIT}};' } }),
]

export const addToCart = defineWidget({
  type: 'add-to-cart',
  title: 'Add to cart',
  description: 'Adds the product being viewed to the cart, with an optional quantity picker.',
  icon: 'cart-plus',
  category: 'commerce',
  keywords: ['cart', 'buy', 'add', 'ecommerce', 'product'],
  render: AddToCartWidget as never,
  sections: [
    section('section_atc', 'Add to cart', [
      text('label', { label: 'Button text', default: 'Add to cart' }),
      text('added_label', { label: 'After adding', default: 'Added to cart' }),
      switcher('show_quantity', { label: 'Quantity picker', default: 'yes' }),
      switcher('go_to_cart', { label: 'Go to the cart after adding' }),
      text('cart_url', { label: 'Cart page', default: '/cart' }),
      heading('heading_source', 'Product'),
      text('product_id', { label: 'Product ID', description: 'Leave empty on a product template to use the product being viewed.', dynamic: ['text'] }),
      text('variant_id', { label: 'Variant ID', dynamic: ['text'] }),
      text('inventory_field', { label: 'Stock field', default: 'inventory', description: 'Used to show "Sold out". Clear it to always allow adding.' }),
    ]),
    section(
      'section_atc_style',
      'Button',
      [
        choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS.slice(0, 3), selectors: { [`${W} .bw-atc`]: 'justify-content: {{VALUE}};' }, selectorsDictionary: { left: 'flex-start', center: 'center', right: 'flex-end' } }),
        ...buttonStyle(`${W} .bw-atc-btn`),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-atc{display:flex;flex-wrap:wrap;align-items:center;gap:10px}' +
    '.bw-qty{display:inline-flex;align-items:center;border:1px solid #d5d9e0;border-radius:4px;overflow:hidden}' +
    '.bw-qty-btn{width:34px;height:40px;border:0;background:#f6f7f9;font-size:16px;line-height:1;cursor:pointer;color:inherit}' +
    '.bw-qty-btn:hover{background:#eceef2}' +
    '.bw-qty-input{width:52px;height:40px;border:0;border-left:1px solid #e3e6ea;border-right:1px solid #e3e6ea;text-align:center;font:inherit;background:transparent;color:inherit}' +
    '.bw-atc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:10px 22px;border:0;border-radius:4px;background:var(--bw-c-accent);color:#fff;font:inherit;font-weight:500;cursor:pointer}' +
    '.bw-atc-btn:disabled{opacity:.55;cursor:not-allowed}' +
    '.bw-atc-btn[data-state="done"]{background:#2b8a3e}' +
    '.bw-atc-msg{font-size:13px;color:#5b6b8c}' +
    '.bw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
})

/* ----------------------------- Cart -------------------------------- */

function CartWidget({ settings }: RenderProps) {
  return (
    <CartTable
      minorUnits={minorUnits(settings)}
      emptyText={String(settings.empty_text || 'Your cart is empty.')}
      continueUrl={String(settings.continue_url || '/')}
      continueText={String(settings.continue_text || 'Continue shopping')}
      checkoutUrl={String(settings.checkout_url || '/checkout')}
      checkoutText={String(settings.checkout_text || 'Checkout')}
    />
  )
}

export const cart = defineWidget({
  type: 'cart',
  title: 'Cart',
  description: 'The visitor’s cart: items, quantities, subtotal and a checkout button.',
  icon: 'cart',
  category: 'commerce',
  keywords: ['cart', 'basket', 'ecommerce', 'checkout'],
  render: CartWidget as never,
  sections: [
    section('section_cart', 'Cart', [
      text('empty_text', { label: 'Empty cart text', default: 'Your cart is empty.' }),
      text('continue_text', { label: 'Keep shopping button', default: 'Continue shopping' }),
      text('continue_url', { label: 'Keep shopping link', default: '/' }),
      text('checkout_text', { label: 'Checkout button', default: 'Checkout' }),
      text('checkout_url', { label: 'Checkout page', default: '/checkout' }),
      switcher('minor_units', { label: 'Amounts stored in cents', default: 'yes' }),
    ]),
    section(
      'section_cart_style',
      'Cart',
      [
        color('text_color', { label: 'Text colour', global: 'colors', selectors: { [`${W} .bw-cart`]: 'color: {{VALUE}};' } }),
        ...typography('cart_typography', { selector: `${W} .bw-cart` }),
        color('line_color', { label: 'Row divider', selectors: { [W]: '--bw-cart-line: {{VALUE}};' } }),
        ...border('cart_border', { selector: `${W} .bw-cart-table` }),
        heading('heading_cart_button', 'Checkout button'),
        ...buttonStyle(`${W} .bw-cart-checkout`),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-cart{--bw-cart-line:#e6e8ee}' +
    '.bw-cart-table{width:100%;border-collapse:collapse}' +
    '.bw-cart-table th,.bw-cart-table td{padding:12px 10px;border-bottom:1px solid var(--bw-cart-line);text-align:left;vertical-align:middle}' +
    '.bw-cart-table th{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280}' +
    '.bw-cart-product{display:flex;align-items:center;gap:12px}' +
    '.bw-cart-product img{width:64px;height:64px;object-fit:cover;border-radius:4px;flex:none}' +
    '.bw-cart-product span{display:flex;flex-direction:column;gap:2px}' +
    '.bw-cart-product a{color:inherit;font-weight:600;text-decoration:none}' +
    '.bw-cart-product small{color:#6b7280}' +
    '.bw-cart-total{font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '.bw-cart-remove{border:0;background:none;font-size:20px;line-height:1;color:#6b7280;cursor:pointer;padding:4px 8px}' +
    '.bw-cart-remove:hover{color:#c92a2a}' +
    '.bw-cart-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding-top:16px}' +
    '.bw-cart-subtotal{font-size:1.1em}.bw-cart-subtotal strong{font-size:1.2em;margin-left:6px}' +
    '.bw-cart-checkout,.bw-cart-empty .bw-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 26px;border-radius:4px;background:var(--bw-c-accent);color:#fff;text-decoration:none;font-weight:500}' +
    '.bw-cart-empty{display:flex;flex-direction:column;align-items:flex-start;gap:12px}' +
    '.bw-cart-loading{color:#6b7280}' +
    '.bw-cart[aria-busy="true"]{opacity:.6}' +
    '@media (max-width:600px){.bw-cart-table thead{display:none}.bw-cart-table tr{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--bw-cart-line)}.bw-cart-table td{border:0;padding:0}.bw-cart-product{grid-column:1/-1}}',
})

/* -------------------------- Cart count ----------------------------- */

function CartCountWidget({ settings }: RenderProps) {
  return <CartCount cartPath={String(settings.cart_url || '/cart')} label={String(settings.label || 'Cart')} hideWhenEmpty={settings.hide_empty === 'yes'} />
}

export const cartCount = defineWidget({
  type: 'cart-count',
  title: 'Cart button',
  description: 'A cart link with the number of items, for headers.',
  icon: 'cart',
  category: 'commerce',
  keywords: ['cart', 'header', 'badge', 'count', 'basket'],
  render: CartCountWidget as never,
  sections: [
    section('section_count', 'Cart button', [
      text('label', { label: 'Label', default: 'Cart' }),
      text('cart_url', { label: 'Cart page', default: '/cart' }),
      switcher('hide_empty', { label: 'Hide when empty' }),
      switcher('hide_label', { label: 'Icon only', selectors: { [`${W} .bw-cart-count-label`]: 'display: none;' } }),
    ]),
    section(
      'section_count_style',
      'Cart button',
      [
        color('count_color', { label: 'Colour', global: 'colors', selectors: { [`${W} .bw-cart-count`]: 'color: {{VALUE}};' } }),
        color('badge_background', { label: 'Badge background', global: 'colors', selectors: { [`${W} .bw-cart-count-badge`]: 'background-color: {{VALUE}};' } }),
        color('badge_color', { label: 'Badge text', selectors: { [`${W} .bw-cart-count-badge`]: 'color: {{VALUE}};' } }),
        slider('icon_size', { label: 'Icon size', units: ['px'], selectors: { [`${W} .bw-cart-count svg`]: 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};' } }),
        ...typography('count_typography', { selector: `${W} .bw-cart-count` }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-cart-count{position:relative;display:inline-flex;align-items:center;gap:8px;color:inherit;text-decoration:none;font-weight:500}' +
    '.bw-cart-count-badge{min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:var(--bw-c-accent);color:#fff;font-size:12px;line-height:20px;text-align:center}',
})

/* --------------------------- Checkout ------------------------------ */

function CheckoutWidget({ settings }: RenderProps) {
  const fields = String(settings.fields || 'name,email,phone,address,city')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)
  return <Checkout minorUnits={minorUnits(settings)} submitText={String(settings.submit_text || 'Place order')} emptyText={String(settings.empty_text || 'Your cart is empty.')} fields={fields} />
}

export const checkout = defineWidget({
  type: 'checkout',
  title: 'Checkout',
  description: 'Collects the customer’s details and places the order.',
  icon: 'cart-check',
  category: 'commerce',
  keywords: ['checkout', 'order', 'buy', 'ecommerce', 'payment'],
  render: CheckoutWidget as never,
  sections: [
    section('section_checkout', 'Checkout', [
      text('fields', { label: 'Fields', default: 'name,email,phone,address,city', description: 'Comma separated. Name and email are always required.' }),
      text('submit_text', { label: 'Button text', default: 'Place order' }),
      text('empty_text', { label: 'Empty cart text', default: 'Your cart is empty.' }),
      switcher('minor_units', { label: 'Amounts stored in cents', default: 'yes' }),
    ]),
    section(
      'section_checkout_style',
      'Form',
      [
        color('label_color', { label: 'Label colour', global: 'colors', selectors: { [`${W} .bw-checkout label`]: 'color: {{VALUE}};' } }),
        ...typography('label_typography', { selector: `${W} .bw-checkout label` }),
        color('input_background', { label: 'Field background', selectors: { [`${W} .bw-checkout input`]: 'background-color: {{VALUE}};' } }),
        ...border('input_border', { selector: `${W} .bw-checkout input` }),
        borderRadius('input_radius', { selector: `${W} .bw-checkout input` }),
        slider('field_gap', { label: 'Space between fields', units: ['px'], selectors: { [`${W} .bw-checkout`]: 'gap: {{SIZE}}{{UNIT}};' } }),
        heading('heading_submit', 'Button'),
        ...buttonStyle(`${W} .bw-checkout-submit`),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-checkout{display:flex;flex-direction:column;gap:14px;max-width:520px}' +
    '.bw-checkout .bw-field{display:flex;flex-direction:column;gap:5px;margin:0}' +
    '.bw-checkout label{font-weight:500}' +
    '.bw-checkout input{padding:11px 12px;border:1px solid #d5d9e0;border-radius:4px;font:inherit;background:#fff;color:inherit}' +
    '.bw-checkout input:focus-visible{outline:2px solid var(--bw-c-accent);outline-offset:1px}' +
    '.bw-checkout .bw-field-error{color:#c92a2a;font-size:13px}' +
    '.bw-checkout-error{padding:10px 14px;border-radius:4px;background:#fff5f5;border:1px solid #ffc9c9;color:#c92a2a;margin:0}' +
    '.bw-checkout-total{margin:0;font-size:1.1em}.bw-checkout-total strong{margin-left:6px;font-size:1.2em}' +
    '.bw-checkout-submit{align-self:flex-start;padding:12px 28px;border:0;border-radius:4px;background:var(--bw-c-accent);color:#fff;font:inherit;font-weight:500;cursor:pointer}' +
    '.bw-checkout-submit:disabled{opacity:.6;cursor:progress}',
})

export const cartElements = [addToCart, cart, cartCount, checkout]
