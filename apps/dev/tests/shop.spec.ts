import { expect, test } from '@playwright/test'

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

test.describe('shop', () => {
  test('the shop page lists products with prices and stock', async ({ page }) => {
    await page.goto('/shop')
    const cards = page.locator('.bw-product')
    await expect(cards).toHaveCount(4)
    await expect(page.locator('.bw-product-price').first()).toContainText('$')
    await expect(page.locator('.bw-product-badge')).toHaveCount(1) // the sold-out one
    await expect(page.getByRole('link', { name: 'Indigo block-printed bedsheet' })).toHaveAttribute('href', '/products/indigo-bedsheet')
  })

  test('a product page uses the product template', async ({ page }) => {
    await page.goto('/products/indigo-bedsheet')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Indigo block-printed bedsheet')
    await expect(page.locator('.bw-price')).toHaveText('$85')
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible()
    // the header and footer templates still wrap it
    await expect(page.getByRole('navigation', { name: 'Main menu' })).toBeVisible()
  })

  test('add to cart, change the quantity, then check out', async ({ page }) => {
    await page.goto('/products/indigo-bedsheet')
    await page.getByRole('button', { name: 'Increase quantity' }).click()
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await expect(page.locator('.bw-atc-btn[data-state="done"]')).toBeVisible()

    await page.goto('/cart')
    await expect(page.locator('.bw-cart-table tbody tr')).toHaveCount(1)
    await expect(page.locator('.bw-cart-subtotal')).toContainText('$170')
    await page.locator('.bw-cart-table .bw-qty-input').fill('3')
    await page.locator('.bw-cart-table .bw-qty-input').blur()
    await expect(page.locator('.bw-cart-subtotal')).toContainText('$255')

    await page.goto('/checkout')
    await page.fill('#bw-co-name', 'Ahmer Hassan')
    await page.fill('#bw-co-email', 'ahmer@example.pk')
    await page.fill('#bw-co-phone', '03001234567')
    await page.getByRole('button', { name: 'Place order' }).click()
    await page.waitForURL(/thank-you\?order=/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Thank you')

    // the cart is emptied once the order exists
    const cart = await (await page.request.get('/api/bw/cart', { headers: { Accept: 'application/json' } })).json()
    expect(cart.count).toBe(0)
  })

  test('removing the last item empties the cart', async ({ page }) => {
    await page.goto('/products/madder-cushion-cover')
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await expect(page.locator('.bw-atc-btn[data-state="done"]')).toBeVisible()
    await page.goto('/cart')
    await page.getByRole('button', { name: /^Remove/ }).click()
    await expect(page.locator('.bw-cart-empty')).toContainText('Your cart is empty')
  })

  test('checkout reports missing details', async ({ page }) => {
    const res = await page.request.post('/api/bw/checkout', { headers: { Accept: 'application/json' }, data: { name: '', email: 'nope' } })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.errors).toMatchObject({ email: expect.any(String), name: expect.any(String) })
  })

  test('the product template can be edited visually', async ({ page, isMobile }) => {
    test.skip(!email || !password, 'set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD')
    test.skip(!!isMobile, 'the editor is a desktop tool')
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    const { token } = await login.json()
    const templates = await (await page.request.get('/api/bw-templates?where[type][equals]=product&depth=0', { headers: { Authorization: `JWT ${token}` } })).json()
    await page.goto(`/admin/blockwright/edit/bw-templates/${templates.docs[0].id}`)
    const canvas = page.frameLocator('iframe[title="Page canvas"]')
    // the canvas fills the template from a real product
    await expect(canvas.locator('.bw-price')).toContainText('$', { timeout: 60_000 })
    await expect(canvas.locator('.bw-atc-btn')).toBeVisible()
    await expect(page.locator('.bwe-tile', { hasText: 'Add to cart' })).toBeVisible()
  })
})
