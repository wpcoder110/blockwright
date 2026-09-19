'use client'
import { useCallback, useEffect, useState } from 'react'

export interface CartLine {
  id: string
  productId: string
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

const API = '/api/bw/cart'
const money = (amount: number, currency: string, minorUnits: boolean) => {
  const value = minorUnits ? amount / 100 : amount
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value).replace(/[\u00a0\u202f]/g, ' ')
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

const post = async (body: Record<string, unknown>) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Something went wrong')
  return (await res.json()) as CartView
}

/** Tells other cart widgets on the page that the cart changed. */
const announce = (cart: CartView) => window.dispatchEvent(new CustomEvent('bw:cart', { detail: cart }))

export function AddToCart({
  product,
  variant,
  label = 'Add to cart',
  addedLabel = 'Added',
  showQuantity,
  soldOut,
  cartPath = '/cart',
  goToCart,
}: {
  product: string
  variant?: string
  label?: string
  addedLabel?: string
  showQuantity?: boolean
  soldOut?: boolean
  cartPath?: string
  goToCart?: boolean
}) {
  const [quantity, setQuantity] = useState(1)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const add = async () => {
    setState('busy')
    setMessage('')
    try {
      const cart = await post({ action: 'add', product, variant, quantity })
      announce(cart)
      if (goToCart) {
        window.location.href = cartPath
        return
      }
      setState('done')
      setTimeout(() => setState('idle'), 2500)
    } catch (err) {
      setState('error')
      setMessage((err as Error).message)
    }
  }

  return (
    <div className="bw-atc">
      {showQuantity ? (
        <span className="bw-qty">
          <button type="button" className="bw-qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            −
          </button>
          <input
            className="bw-qty-input"
            type="number"
            min={1}
            max={99}
            value={quantity}
            aria-label="Quantity"
            onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          />
          <button type="button" className="bw-qty-btn" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Increase quantity">
            +
          </button>
        </span>
      ) : null}
      <button type="button" className="bw-btn bw-atc-btn" onClick={add} disabled={soldOut || state === 'busy'} data-state={state}>
        {soldOut ? 'Sold out' : state === 'busy' ? 'Adding…' : state === 'done' ? addedLabel : label}
      </button>
      <span role="status" aria-live="polite" className="bw-atc-msg">
        {state === 'done' ? addedLabel : message}
      </span>
    </div>
  )
}

function useCart() {
  const [cart, setCart] = useState<CartView | null>(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    try {
      const res = await fetch(API, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      if (res.ok) setCart(await res.json())
      else setCart({ lines: [], count: 0, subtotal: 0, currency: 'USD', empty: true })
    } catch {
      setCart({ lines: [], count: 0, subtotal: 0, currency: 'USD', empty: true })
    }
  }, [])
  useEffect(() => {
    void load()
    const onChange = (e: Event) => setCart((e as CustomEvent<CartView>).detail)
    window.addEventListener('bw:cart', onChange)
    return () => window.removeEventListener('bw:cart', onChange)
  }, [load])
  const change = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true)
    try {
      const next = await post(body)
      setCart(next)
      announce(next)
    } finally {
      setBusy(false)
    }
  }, [])
  return { cart, busy, change }
}

export function CartCount({ cartPath = '/cart', label = 'Cart', hideWhenEmpty }: { cartPath?: string; label?: string; hideWhenEmpty?: boolean }) {
  const { cart } = useCart()
  const count = cart?.count ?? 0
  if (hideWhenEmpty && count === 0) return null
  return (
    <a className="bw-cart-count" href={cartPath} aria-label={`${label}: ${count} ${count === 1 ? 'item' : 'items'}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h2l2.2 10h10L20 7H6" />
        <circle cx="9" cy="19" r="1.6" />
        <circle cx="17" cy="19" r="1.6" />
      </svg>
      <span className="bw-cart-count-label">{label}</span>
      <span className="bw-cart-count-badge" aria-hidden="true">
        {count}
      </span>
    </a>
  )
}

export function CartTable({
  minorUnits = true,
  emptyText = 'Your cart is empty.',
  continueUrl = '/',
  continueText = 'Continue shopping',
  checkoutUrl = '/checkout',
  checkoutText = 'Checkout',
}: {
  minorUnits?: boolean
  emptyText?: string
  continueUrl?: string
  continueText?: string
  checkoutUrl?: string
  checkoutText?: string
}) {
  const { cart, busy, change } = useCart()
  if (!cart) return <p className="bw-cart-loading">Loading your cart…</p>
  if (cart.empty) {
    return (
      <div className="bw-cart-empty">
        <p>{emptyText}</p>
        <a className="bw-btn" href={continueUrl}>
          {continueText}
        </a>
      </div>
    )
  }
  return (
    <div className="bw-cart" aria-busy={busy}>
      <table className="bw-cart-table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Quantity</th>
            <th scope="col">Total</th>
            <th scope="col"><span className="bw-sr">Remove</span></th>
          </tr>
        </thead>
        <tbody>
          {cart.lines.map((line) => (
            <tr key={line.id}>
              <td className="bw-cart-product">
                {line.image?.url ? <img src={line.image.url} alt={line.image.alt} width={64} height={64} loading="lazy" /> : null}
                <span>
                  <a href={line.url}>{line.title}</a>
                  <small>{money(line.amount, cart.currency, minorUnits)}</small>
                </span>
              </td>
              <td>
                <input
                  className="bw-qty-input"
                  type="number"
                  min={1}
                  max={99}
                  value={line.quantity}
                  aria-label={`Quantity for ${line.title}`}
                  onChange={(e) => void change({ action: 'update', line: line.id, quantity: Number(e.target.value) })}
                />
              </td>
              <td className="bw-cart-total">{money(line.lineTotal, cart.currency, minorUnits)}</td>
              <td>
                <button type="button" className="bw-cart-remove" onClick={() => void change({ action: 'remove', line: line.id })} aria-label={`Remove ${line.title}`}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bw-cart-foot">
        <span className="bw-cart-subtotal">
          Subtotal <strong>{money(cart.subtotal, cart.currency, minorUnits)}</strong>
        </span>
        <a className="bw-btn bw-cart-checkout" href={checkoutUrl}>
          {checkoutText}
        </a>
      </div>
    </div>
  )
}

export function Checkout({
  minorUnits = true,
  submitText = 'Place order',
  emptyText = 'Your cart is empty.',
  fields = ['name', 'email', 'phone', 'address', 'city'],
}: {
  minorUnits?: boolean
  submitText?: string
  emptyText?: string
  fields?: string[]
}) {
  const { cart } = useCart()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/bw/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin',
      })
      const out = await res.json()
      if (out.success && out.redirect) window.location.href = out.redirect
      else setErrors(out.errors ?? { form: out.message ?? 'Something went wrong' })
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  if (cart && cart.empty) return <p className="bw-cart-empty">{emptyText}</p>

  const label: Record<string, string> = { name: 'Full name', email: 'Email', phone: 'Phone', address: 'Address', city: 'City', country: 'Country' }
  const required = ['name', 'email']
  return (
    <form className="bw-checkout" method="post" action="/api/bw/checkout" onSubmit={submit} noValidate>
      {errors.form || errors.cart ? (
        <p className="bw-checkout-error" role="alert">
          {errors.form ?? errors.cart}
        </p>
      ) : null}
      {fields.map((f) => (
        <p className="bw-field" key={f}>
          <label htmlFor={`bw-co-${f}`}>
            {label[f] ?? f}
            {required.includes(f) ? <span aria-hidden="true"> *</span> : null}
          </label>
          <input
            id={`bw-co-${f}`}
            name={f}
            type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
            autoComplete={f === 'email' ? 'email' : f === 'phone' ? 'tel' : f === 'name' ? 'name' : f === 'address' ? 'street-address' : f === 'city' ? 'address-level2' : 'on'}
            required={required.includes(f)}
            aria-invalid={errors[f] ? 'true' : undefined}
            aria-describedby={errors[f] ? `bw-co-${f}-err` : undefined}
          />
          {errors[f] ? (
            <span className="bw-field-error" id={`bw-co-${f}-err`}>
              {errors[f]}
            </span>
          ) : null}
        </p>
      ))}
      {cart && !cart.empty ? (
        <p className="bw-checkout-total">
          Total <strong>{money(cart.subtotal, cart.currency, minorUnits)}</strong>
        </p>
      ) : null}
      <button type="submit" className="bw-btn bw-checkout-submit" disabled={busy}>
        {busy ? 'Placing order…' : submitText}
      </button>
    </form>
  )
}
