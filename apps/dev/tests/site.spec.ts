import { expect, test } from '@playwright/test'

// Requires `pnpm seed` to have run against the database.

test('home page renders semantic content with header and footer', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Hand block-printed textiles, made in Lahore')
  await expect(page.locator('header.bw-content')).toContainText('Rangrez Textiles')
  await expect(page.locator('footer.bw-content')).toContainText('Built with Blockwright')
  await expect(page).toHaveTitle(/Home \| Rangrez Textiles/)
  // CSS is hoisted into <head>
  expect(await page.locator('head style[data-precedence="bw-doc"]').count()).toBeGreaterThan(0)
})

test('unknown pages use the 404 template', async ({ page }) => {
  const res = await page.goto('/no-such-page')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'This page wandered off' })).toBeVisible()
})

test('contact form validates inline and submits', async ({ page }) => {
  await page.goto('/')
  const form = page.locator('form.bw-form')
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(form.getByText('This field is required.').first()).toBeVisible()
  await expect(form.getByLabel('Name', { exact: true })).toHaveAttribute('aria-invalid', 'true')

  await form.getByLabel('Name', { exact: true }).fill('Playwright')
  await form.getByLabel('Email', { exact: true }).fill('e2e@example.pk')
  await form.getByLabel('Message', { exact: true }).fill('Testing the form end to end.')
  // the time trap rejects instant submissions
  await page.waitForTimeout(1600)
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(form.locator('.bw-form-message')).toHaveText('Thanks! Your message has been sent.')
  await expect(form.getByLabel('Name', { exact: true })).toHaveValue('')
})

test('multi-step form with conditional logic', async ({ page }) => {
  await page.goto('/contact')
  const form = page.locator('form.bw-form')
  const next = form.getByRole('button', { name: 'Next' })

  await expect(form.getByLabel('Which city?')).toBeHidden()
  await next.click()
  await expect(form.getByText('This field is required.').first()).toBeVisible()

  await form.getByLabel('Full name').fill('Sara Khan')
  await form.getByLabel('Email', { exact: true }).fill('sara@example.pk')
  await form.getByLabel('Mobile number').fill('12345')
  await next.click()
  await expect(form.getByText('Enter an 11-digit number starting with 03.')).toBeVisible()
  await form.getByLabel('Mobile number').fill('03001234567')

  await form.getByLabel('City', { exact: true }).selectOption('Other')
  await expect(form.getByLabel('Which city?')).toBeVisible()
  await form.getByLabel('Which city?').fill('Multan')
  await next.click()

  await expect(form.getByRole('group', { name: 'Your order' })).toBeVisible()
  await expect(form.getByLabel('Describe the custom piece')).toBeHidden()
  await form.getByLabel('Something custom').check()
  await expect(form.getByLabel('Describe the custom piece')).toBeVisible()
  await form.getByLabel('Describe the custom piece').fill('Two indigo tablecloths, 2 by 3 metres.')
  await form.getByLabel('Indigo').check()
  await form.getByLabel('I agree to be contacted about this quote.').check()
  await page.waitForTimeout(1600)
  await form.getByRole('button', { name: 'Send request' }).click()
  await expect(form.locator('.bw-form-message')).toHaveText('Thanks! We will send your quote within two working days.')
})

test('forms still work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  const form = page.locator('form.bw-form')
  await form.getByLabel('Name', { exact: true }).fill('No script')
  await form.getByLabel('Email', { exact: true }).fill('noscript@example.pk')
  await form.getByLabel('Message', { exact: true }).fill('Sent as a plain HTML form.')
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(page).toHaveURL(/bw_status=success/)
  await expect(page.locator('.bw-form-message')).toHaveText('Thanks! Your message has been sent.')
  await context.close()
})

test('header navigation menu', async ({ page, isMobile }) => {
  await page.goto('/contact')
  const nav = page.getByRole('navigation', { name: 'Main menu' })
  if (isMobile) {
    await expect(nav.getByRole('link', { name: 'Home' })).toBeHidden()
    await nav.locator('.bw-nav-toggle').click()
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Request a quote' })).toBeVisible()
  } else {
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Request a quote' })).toBeHidden()
    await nav.getByRole('link', { name: 'Services' }).hover()
    await expect(nav.getByRole('link', { name: 'Request a quote' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Red Lions Tech' })).toHaveAttribute('target', '_blank')
  }
})

test('mobile menu works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } })
  const page = await context.newPage()
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Main menu' })
  await expect(nav.getByRole('link', { name: 'Home' })).toBeHidden()
  await nav.locator('.bw-nav-toggle').click()
  await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible()
  await context.close()
})
