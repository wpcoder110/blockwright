/**
 * Cart and checkout on top of `@payloadcms/plugin-ecommerce`.
 *
 * Guests get a cart cookie holding the cart id and the cart's secret, which is
 * how that plugin lets a visitor without an account reach their own cart.
 */
import type { BasePayload, Endpoint, PayloadRequest } from 'payload'
import type { BlockwrightRuntime, CommerceOptions } from './types'

export const CART_COOKIE = 'bw-cart'
const MAX_LINES = 50
const MAX_QTY = 99

export interface CartLine {
  id: string
  productId: string
  variantId?: string
  title: string
  url: string
  quantity: number
  amount: number
  lineTotal: number
  image?: { url: string; alt: string }
}

export interface CartView {
  lines: CartLine[]
  count: number
  subtotal: number
  currency: string
  empty: boolean
}

/** Relationship ids keep their database type: numbers stay numbers. */
const asId = (v: string | number): string | number => (typeof v === 'number' ? v : /^\d+$/.test(v) ? Number(v) : v)

const path = (doc: unknown, p: string): unknown => {
  if (!p) return undefined
  let cur: unknown = doc
  for (const part of p.split('.')) {
    if (cur === null || cur === undefined) return undefined
    if (Array.isArray(cur)) cur = /^\d+$/.test(part) ? cur[Number(part)] : (cur[0] as Record<string, unknown>)?.[part]
    else if (typeof cur === 'object') cur = (cur as Record<string, unknown>)[part]
    else return undefined
  }
  return cur
}

export const commerceDefaults = (o: CommerceOptions = {}): Required<Omit<CommerceOptions, 'orderStatus' | 'onOrder'>> & Pick<CommerceOptions, 'orderStatus' | 'onOrder'> => ({
  productsSlug: o.productsSlug ?? 'products',
  variantsSlug: o.variantsSlug ?? 'variants',
  cartsSlug: o.cartsSlug ?? 'carts',
  ordersSlug: o.ordersSlug ?? 'orders',
  titlePath: o.titlePath ?? 'title',
  imagePath: o.imagePath ?? 'gallery.image',
  amountPath: o.amountPath ?? 'prices.0.amount',
  currencyPath: o.currencyPath ?? 'prices.0.currency',
  currency: o.currency ?? 'USD',
  urlPattern: o.urlPattern ?? '/products/{slug}',
  cartPath: o.cartPath ?? '/cart',
  checkoutSuccessPath: o.checkoutSuccessPath ?? '/thank-you',
  orderStatus: o.orderStatus,
  onOrder: o.onOrder,
})

/** The configured price path, or the per-currency fields the ecommerce plugin creates. */
function amountOf(doc: unknown, amountPath: string): { amount: number; currency?: string } | null {
  const raw = path(doc, amountPath)
  const direct = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (Number.isFinite(direct)) return { amount: direct }
  if (doc && typeof doc === 'object') {
    for (const [key, value] of Object.entries(doc as Record<string, unknown>)) {
      const m = /^priceIn([A-Z]{3})$/.exec(key)
      if (m && (typeof value === 'number' || typeof value === 'string') && Number.isFinite(Number(value))) {
        return { amount: Number(value), currency: m[1] }
      }
    }
  }
  return null
}

const media = (v: unknown) => {
  const o = (v && typeof v === 'object' ? ((v as Record<string, unknown>).image ?? v) : null) as Record<string, unknown> | null
  return o && typeof o.url === 'string' ? { url: o.url, alt: typeof o.alt === 'string' ? o.alt : '' } : undefined
}

/** Read the cart cookie: `<id>:<secret>`. */
export function readCartCookie(req: PayloadRequest): { id: string; secret: string } | null {
  const raw = req.headers.get('cookie') ?? ''
  const match = new RegExp(`(?:^|;\\s*)${CART_COOKIE}=([^;]+)`).exec(raw)
  if (!match) return null
  const [id, secret] = decodeURIComponent(match[1]!).split(':')
  return id && secret ? { id, secret } : null
}

const cookieHeader = (value: string | null) =>
  value === null
    ? `${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
    : `${CART_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; HttpOnly`

export function commerceAvailable(payload: BasePayload, o: CommerceOptions = {}): boolean {
  const c = commerceDefaults(o)
  const collections = payload.collections as Record<string, unknown>
  return !!collections[c.productsSlug] && !!collections[c.cartsSlug]
}

async function loadCart(payload: BasePayload, o: ReturnType<typeof commerceDefaults>, ref: { id: string; secret: string } | null) {
  if (!ref) return null
  const cart = (await payload
    .findByID({ collection: o.cartsSlug as never, id: ref.id, depth: 2, overrideAccess: true, disableErrors: true })
    .catch(() => null)) as Record<string, any> | null
  if (!cart || cart.secret !== ref.secret || cart.purchasedAt) return null
  return cart
}

/** Turn stored cart items into what the widgets display. */
export function toCartView(cart: Record<string, any> | null, o: ReturnType<typeof commerceDefaults>): CartView {
  const lines: CartLine[] = []
  let currency = o.currency
  for (const item of (Array.isArray(cart?.items) ? cart!.items : []) as Array<Record<string, any>>) {
    const product = item.product && typeof item.product === 'object' ? item.product : null
    if (!product) continue
    const variant = item.variant && typeof item.variant === 'object' ? item.variant : null
    const source = variant ?? product
    const found = amountOf(source, o.amountPath) ?? amountOf(product, o.amountPath) ?? { amount: 0 }
    const amount = found.amount
    const code = String(path(source, o.currencyPath) ?? path(product, o.currencyPath) ?? found.currency ?? o.currency)
    if (code) currency = code.toUpperCase()
    const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, MAX_QTY))
    lines.push({
      id: String(item.id ?? `${product.id}-${variant?.id ?? ''}`),
      productId: String(product.id),
      variantId: variant ? String(variant.id) : undefined,
      title: String(path(product, o.titlePath) ?? product.title ?? 'Product'),
      url: o.urlPattern.replace(/\{(\w+)\}/g, (_m, k: string) => String(path(product, k) ?? '')),
      quantity,
      amount,
      lineTotal: amount * quantity,
      image: media(path(product, o.imagePath)),
    })
  }
  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
    currency,
    empty: lines.length === 0,
  }
}

const json = (data: unknown, status = 200, cookie?: string) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) },
  })

async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  const type = (req.headers.get('content-type') ?? '').split(';')[0]!.trim()
  const text = (await req.text?.()) ?? ''
  if (type === 'application/json') return text ? (JSON.parse(text) as Record<string, unknown>) : {}
  const params = new URLSearchParams(text)
  return Object.fromEntries(params.entries())
}

const safeReturn = (v: unknown, fallback: string) => {
  const s = typeof v === 'string' ? v : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : fallback
}

/** GET /api/bw/cart */
export function cartEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/cart',
    method: 'get',
    handler: async (req) => {
      const o = commerceDefaults(rt.options.commerce)
      if (!commerceAvailable(req.payload, rt.options.commerce)) return json({ message: 'No products collection is installed.' }, 501)
      const cart = await loadCart(req.payload, o, readCartCookie(req))
      return json(toCartView(cart, o))
    },
  }
}

/** POST /api/bw/cart — add, update, remove or clear. */
export function cartUpdateEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/cart',
    method: 'post',
    handler: async (req) => {
      const payload = req.payload
      const o = commerceDefaults(rt.options.commerce)
      if (!commerceAvailable(payload, rt.options.commerce)) return json({ message: 'No products collection is installed.' }, 501)
      let body: Record<string, unknown>
      try {
        body = await readBody(req)
      } catch {
        return json({ message: 'Invalid request' }, 400)
      }
      const wantsJson = (req.headers.get('accept') ?? '').includes('application/json')
      const action = String(body.action ?? 'add')
      const ref = readCartCookie(req)
      let cart = await loadCart(payload, o, ref)
      let cookie: string | undefined

      const respond = (status: number, data: Record<string, unknown>) => {
        if (wantsJson) return json(data, status, cookie)
        const target = safeReturn(body._bw_return, o.cartPath)
        return new Response(null, { status: 303, headers: { Location: target, ...(cookie ? { 'Set-Cookie': cookie } : {}) } })
      }

      if (action === 'clear') {
        if (cart) await payload.update({ collection: o.cartsSlug as never, id: cart.id, data: { items: [] } as never, overrideAccess: true })
        return respond(200, { ...toCartView(null, o) })
      }

      const items: Array<Record<string, unknown>> = Array.isArray(cart?.items)
        ? cart!.items.map((i: Record<string, any>) => ({
            id: i.id,
            product: asId(typeof i.product === 'object' ? i.product?.id : i.product),
            variant: i.variant ? asId(typeof i.variant === 'object' ? i.variant?.id : i.variant) : undefined,
            quantity: i.quantity,
          }))
        : []

      if (action === 'add' || action === 'set') {
        const productId = String(body.product ?? '')
        if (!productId) return respond(400, { message: 'No product given' })
        const product = (await payload
          .findByID({ collection: o.productsSlug as never, id: productId, depth: 0, overrideAccess: false, disableErrors: true })
          .catch(() => null)) as Record<string, any> | null
        if (!product || (product._status && product._status !== 'published')) return respond(404, { message: 'Product not found' })
        const variantId = body.variant ? String(body.variant) : undefined
        const quantity = Math.max(1, Math.min(Math.round(Number(body.quantity) || 1), MAX_QTY))
        const existing = items.find((i) => String(i.product) === productId && String(i.variant ?? '') === (variantId ?? ''))
        if (existing) {
          existing.quantity = action === 'set' ? quantity : Math.min(MAX_QTY, Number(existing.quantity) + quantity)
        } else {
          if (items.length >= MAX_LINES) return respond(400, { message: 'This cart is full' })
          items.push({ product: asId(productId), variant: variantId ? asId(variantId) : undefined, quantity })
        }
      } else if (action === 'update' || action === 'remove') {
        const lineId = String(body.line ?? '')
        const index = items.findIndex((i) => String(i.id) === lineId)
        if (index === -1) return respond(404, { message: 'That item is no longer in the cart' })
        const quantity = Math.round(Number(body.quantity) || 0)
        if (action === 'remove' || quantity <= 0) items.splice(index, 1)
        else items[index]!.quantity = Math.min(MAX_QTY, quantity)
      } else {
        return respond(400, { message: 'Unknown action' })
      }

      if (!cart) {
        const secret = crypto.randomUUID().replace(/-/g, '')
        const created = (await payload.create({
          collection: o.cartsSlug as never,
          data: { secret, items, ...(req.user ? { customer: req.user.id } : {}) } as never,
          overrideAccess: true,
        })) as Record<string, any>
        cart = created
        cookie = cookieHeader(`${created.id}:${secret}`)
      } else {
        cart = (await payload.update({ collection: o.cartsSlug as never, id: cart.id, data: { items } as never, overrideAccess: true })) as Record<string, any>
      }
      const fresh = await loadCart(payload, o, { id: String(cart!.id), secret: String(cart!.secret) })
      return respond(200, { ...toCartView(fresh, o) })
    },
  }
}

/** POST /api/bw/checkout — turn the cart into an order. */
export function checkoutEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/checkout',
    method: 'post',
    handler: async (req) => {
      const payload = req.payload
      const o = commerceDefaults(rt.options.commerce)
      if (!commerceAvailable(payload, rt.options.commerce) || !(payload.collections as Record<string, unknown>)[o.ordersSlug]) {
        return json({ message: 'Orders are not available.' }, 501)
      }
      let body: Record<string, unknown>
      try {
        body = await readBody(req)
      } catch {
        return json({ message: 'Invalid request' }, 400)
      }
      const wantsJson = (req.headers.get('accept') ?? '').includes('application/json')
      const ref = readCartCookie(req)
      const cart = await loadCart(payload, o, ref)
      const view = toCartView(cart, o)
      const errors: Record<string, string> = {}
      const email = String(body.email ?? '').trim()
      const name = String(body.name ?? '').trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address'
      if (!name) errors.name = 'Enter your name'
      if (view.empty) errors.cart = 'Your cart is empty'
      if (Object.keys(errors).length) {
        if (wantsJson) return json({ success: false, errors }, 400)
        return new Response(null, { status: 303, headers: { Location: `${safeReturn(body._bw_return, o.cartPath)}?checkout=error` } })
      }

      const order = (await payload.create({
        collection: o.ordersSlug as never,
        overrideAccess: true,
        data: {
          customerEmail: email,
          ...(req.user ? { customer: req.user.id } : {}),
          status: rt.options.commerce?.orderStatus ?? 'processing',
          items: (Array.isArray(cart?.items) ? cart!.items : []).map((i: Record<string, any>) => ({
            product: asId(typeof i.product === 'object' ? i.product?.id : i.product),
            variant: i.variant ? asId(typeof i.variant === 'object' ? i.variant?.id : i.variant) : undefined,
            quantity: i.quantity,
          })),
          shippingAddress: {
            title: name,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' ') || undefined,
            addressLine1: String(body.address ?? '') || undefined,
            city: String(body.city ?? '') || undefined,
            phone: String(body.phone ?? '') || undefined,
            country: String(body.country ?? '') || undefined,
          },
        } as never,
      })) as Record<string, any>

      await payload.update({ collection: o.cartsSlug as never, id: cart!.id, data: { purchasedAt: new Date().toISOString() } as never, overrideAccess: true }).catch(() => null)
      await rt.options.commerce?.onOrder?.({ order, cart: view, req })

      const redirect = `${o.checkoutSuccessPath}?order=${encodeURIComponent(String(order.id))}`
      const cookie = cookieHeader(null)
      if (wantsJson) return json({ success: true, orderId: order.id, redirect }, 200, cookie)
      return new Response(null, { status: 303, headers: { Location: redirect, 'Set-Cookie': cookie } })
    },
  }
}
