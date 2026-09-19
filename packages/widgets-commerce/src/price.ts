/** Reading prices from a products collection, whatever shape it has. */
export interface PriceOptions {
  /** Dotted path to the amount, e.g. `prices.0.amount`. */
  amountPath: string
  /** Dotted path to the currency code, or a fixed code. */
  currencyPath?: string
  currency?: string
  /** Amounts are stored in the smallest unit (cents, paisa). Default: true. */
  minorUnits?: boolean
  locale?: string
}

export function readPath(doc: unknown, path: string): unknown {
  if (!path) return undefined
  let cur: unknown = doc
  for (const part of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    if (Array.isArray(cur)) cur = /^\d+$/.test(part) ? cur[Number(part)] : (cur[0] as Record<string, unknown> | undefined)?.[part]
    else if (typeof cur === 'object') cur = (cur as Record<string, unknown>)[part]
    else return undefined
  }
  return cur
}

/**
 * Find the price on a document.
 *
 * Falls back to the per-currency fields `@payloadcms/plugin-ecommerce` creates
 * (`priceInUSD`, `priceInPKR` …) when the configured path holds nothing.
 */
export function resolveAmount(doc: unknown, o: PriceOptions): { amount: number; currency?: string } {
  const raw = readPath(doc, o.amountPath)
  const direct = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN
  if (Number.isFinite(direct)) return { amount: direct }
  if (doc && typeof doc === 'object') {
    for (const [key, value] of Object.entries(doc as Record<string, unknown>)) {
      const match = /^priceIn([A-Z]{3})$/.exec(key)
      if (match && (typeof value === 'number' || typeof value === 'string')) {
        const amount = Number(value)
        if (Number.isFinite(amount)) return { amount, currency: match[1] }
      }
    }
  }
  return { amount: NaN }
}

/** Format a stored amount for display. Returns an empty string when there is no price. */
export function formatPrice(doc: unknown, o: PriceOptions): string {
  const found = resolveAmount(doc, o)
  const amount = found.amount
  if (!Number.isFinite(amount)) return ''
  const code = String((o.currencyPath ? readPath(doc, o.currencyPath) : '') || found.currency || o.currency || 'USD').toUpperCase()
  const value = o.minorUnits === false ? amount : amount / 100
  try {
    // normalise the non-breaking spaces Intl inserts, so markup and tests stay predictable
    return new Intl.NumberFormat(o.locale || 'en', { style: 'currency', currency: code, maximumFractionDigits: Number.isInteger(value) ? 0 : 2 })
      .format(value)
      .replace(/[\u00a0\u202f]/g, ' ')
  } catch {
    return `${code} ${value.toFixed(2)}`
  }
}

export interface ProductCard {
  id: string
  title: string
  url: string
  price: string
  image?: { url: string; alt: string; width?: number; height?: number }
  inStock: boolean
}

export interface MapOptions extends PriceOptions {
  titlePath: string
  imagePath: string
  urlPattern: string
  inventoryPath?: string
}

const media = (v: unknown) => {
  if (!v) return undefined
  if (typeof v === 'string') return { url: v, alt: '' }
  const o = v as Record<string, unknown>
  const inner = (o.image ?? o.media ?? o) as Record<string, unknown>
  return typeof inner.url === 'string'
    ? { url: inner.url, alt: typeof inner.alt === 'string' ? inner.alt : '', width: typeof inner.width === 'number' ? inner.width : undefined, height: typeof inner.height === 'number' ? inner.height : undefined }
    : undefined
}

/** Turn a document into what a product card needs. */
export function toCard(doc: Record<string, unknown>, o: MapOptions): ProductCard {
  const title = String(readPath(doc, o.titlePath) ?? doc.title ?? '')
  const inventory = o.inventoryPath ? readPath(doc, o.inventoryPath) : undefined
  return {
    id: String(doc.id ?? title),
    title,
    url: o.urlPattern.replace(/\{(\w+)\}/g, (_m, key: string) => encodeURI(String(readPath(doc, key) ?? '')).replace(/[?#]/g, '')),
    price: formatPrice(doc, o),
    image: media(readPath(doc, o.imagePath)),
    inStock: inventory === undefined || inventory === null || Number(inventory) > 0,
  }
}
