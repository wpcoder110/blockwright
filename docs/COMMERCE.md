# Commerce

Blockwright's commerce widgets work with [`@payloadcms/plugin-ecommerce`](https://www.npmjs.com/package/@payloadcms/plugin-ecommerce), or with any collection of products you build yourself.

## Setup

Install the ecommerce plugin at the same version as Payload (`npm ls payload`), and give products the fields you need:

```ts
import { ecommercePlugin, USD } from '@payloadcms/plugin-ecommerce'

plugins: [
  ecommercePlugin({
    // without a currencies config the plugin adds no price fields at all
    currencies: { supportedCurrencies: [USD], defaultCurrency: 'USD' },
    products: {
      productsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        admin: { ...defaultCollection.admin, useAsTitle: 'title' },
        fields: [
          ...defaultCollection.fields,
          { name: 'title', type: 'text', required: true },
          { name: 'slug', type: 'text', required: true, index: true },
          { name: 'gallery', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media' }] },
        ],
      }),
    },
    customers: { slug: 'users' },
    access: { /* your rules */ },
  }),

  blockwrightPlugin({
    collections: { pages: { public: true } },
    commerce: {
      urlPattern: '/products/{slug}',   // where product pages live
      cartPath: '/cart',
      checkoutSuccessPath: '/thank-you',
    },
  }),
]
```

Every `commerce` setting is optional; the defaults suit the setup above.

| Setting | Default | Purpose |
| --- | --- | --- |
| `productsSlug`, `variantsSlug`, `cartsSlug`, `ordersSlug` | `products`, `variants`, `carts`, `orders` | Your collection slugs |
| `titlePath`, `imagePath`, `amountPath`, `currencyPath` | `title`, `gallery.image`, `prices.0.amount`, `prices.0.currency` | Where to read product details |
| `urlPattern` | `/products/{slug}` | Public URL of a product |
| `cartPath`, `checkoutSuccessPath` | `/cart`, `/thank-you` | Pages the widgets send people to |
| `orderStatus` | `processing` | Status for new orders |
| `onOrder` | — | Runs after an order is created: emails, payment links, stock |

Prices are found automatically: if `amountPath` holds nothing, Blockwright reads the per-currency fields the ecommerce plugin creates, such as `priceInUSD`.

## Widgets

| Widget | What it does |
| --- | --- |
| **Products** | A grid from any collection with sorting, a filter, stock badges and a button |
| **Price** | The price of the product being viewed, formatted for its currency |
| **Add to cart** | Quantity picker and button; shows "Sold out" when stock runs out |
| **Cart** | Items, quantities, remove, subtotal and a checkout button |
| **Cart button** | A cart link with the number of items, for headers |
| **Checkout** | Collects name, email, phone and address, then places the order |

**Dynamic values:** *Product: price* and *Product: stock* can be used in any text field.

## Product pages

1. Create a template in **Blockwright → Templates**, set **Type** to *Single product*, and add the condition `include/singular/products`.
2. Click **Edit with Blockwright**. The canvas fills the template from a real product, so Price and Add to cart show real content while you design.
3. Add a Next.js route so products have URLs:

```tsx
// app/(frontend)/products/[slug]/page.tsx
import configPromise from '@payload-config'
import { BlockwrightLocation, findDocumentBySlug, singularTheme } from 'blockwright/next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const doc = await findDocumentBySlug({ payload, collection: 'products', slug })
  if (!doc) notFound()

  const request = { path: `/products/${slug}` }
  const theme = singularTheme('products', doc)
  const common = { payload, request, theme, user: null }
  const document = { collection: 'products', id: doc.id, data: doc }

  return (
    <>
      <BlockwrightLocation {...common} location="header" document={document} />
      <BlockwrightLocation {...common} location="single" document={document} />
      <BlockwrightLocation {...common} location="footer" document={document} />
    </>
  )
}
```

Then build normal pages for the shop, cart, checkout and thank-you screens with the widgets above.

## How the cart works

- Guests get a cookie holding the cart id and the cart's secret, which is how the ecommerce plugin lets someone without an account reach their own cart. Signed-in customers also get the cart linked to their account.
- The widgets talk to `POST /api/bw/cart` (add, update, remove, clear), `GET /api/bw/cart` and `POST /api/bw/checkout`.
- The server checks that each product exists and is published, caps quantities at 99 and carts at 50 lines, and recalculates every total itself, so prices cannot be changed from the browser.
- Checkout validates the name and email, creates the order, marks the cart purchased and clears the cookie.

## Payments

Orders are created with the status you configure, which suits cash on delivery and bank transfer. Card payments through the ecommerce plugin's Stripe adapter, and local methods such as JazzCash and Easypaisa, are not wired up yet; use `onOrder` to start a payment or send a payment link in the meantime.
