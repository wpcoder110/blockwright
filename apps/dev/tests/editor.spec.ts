import { expect, test } from '@playwright/test'

// Needs `pnpm seed` with SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD set.
const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

test.describe('visual editor', () => {
  test.skip(!email || !password, 'set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to run editor tests')
  test.skip(({ isMobile }) => isMobile, 'the editor is a desktop tool')

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/users/login', { data: { email, password } })
    expect(res.ok()).toBeTruthy()
  })

  test('edits, adds widgets and saves a draft', async ({ page }) => {
    const found = await (await page.request.get('/api/pages?where[slug][equals]=home&depth=0')).json()
    const id = found.docs[0].id
    await page.goto(`/admin/collections/pages/${id}`)
    await page.getByRole('link', { name: 'Edit with Blockwright' }).click()
    const canvas = page.frameLocator('iframe[title="Page canvas"]')
    const h1 = canvas.locator('h1.bw-heading')
    await expect(h1).toBeVisible({ timeout: 60_000 })

    await h1.click()
    await expect(page.getByRole('heading', { name: 'Edit Heading' })).toBeVisible()
    await page.locator('.bwe-panel .bwe-field').filter({ hasText: /^Title/ }).locator('input').first().fill('Edited in the browser')
    await expect(h1).toHaveText('Edited in the browser')

    const spacers = await canvas.locator('.bw-spacer').count()
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Widgets' })).toBeVisible()
    await page.locator('.bwe-tile', { hasText: 'Spacer' }).click()
    await expect(canvas.locator('.bw-spacer')).toHaveCount(spacers + 1)
    await page.locator('button[title^="Undo"]').click()
    await expect(canvas.locator('.bw-spacer')).toHaveCount(spacers)

    await page.locator('.bwe-top button[title="Widgets"]').click()
    const buttons = await canvas.locator('.bw-w-button').count()
    await page.getByRole('button', { name: 'Button', exact: true }).dragTo(canvas.locator('h2.bw-heading').first())
    await expect(canvas.locator('.bw-w-button')).toHaveCount(buttons + 1)

    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.locator('.bwe-toast', { hasText: 'Draft saved' })).toBeVisible()
    // the public page keeps the published version until you publish
    expect(await (await page.request.get('/')).text()).not.toContain('Edited in the browser')
  })

  test('opens form fields from the canvas', async ({ page }) => {
    const found = await (await page.request.get('/api/pages?where[slug][equals]=contact&depth=0')).json()
    await page.goto(`/admin/blockwright/edit/pages/${found.docs[0].id}`)
    const canvas = page.frameLocator('iframe[title="Page canvas"]')
    await canvas.locator('[data-field="phone"]').click()
    await expect(page.getByRole('heading', { name: 'Edit Form' })).toBeVisible()
    await expect(page.locator('.bwe-rep-body')).toHaveCount(1)
    await expect(page.locator('.bwe-rep-body input').first()).toBeVisible()
  })
})

test.describe('builder features', () => {
  test.skip(!email || !password, 'set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to run editor tests')
  test.skip(({ isMobile }) => isMobile, 'the editor is a desktop tool')

  let token = ''
  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/users/login', { data: { email, password } })
    expect(res.ok()).toBeTruthy()
    token = (await res.json()).token
  })

  test('library, structure panel and new widgets', async ({ page }) => {
    const found = await (await page.request.get('/api/pages?where[slug][equals]=home&depth=0')).json()
    await page.goto(`/admin/blockwright/edit/pages/${found.docs[0].id}`)
    const canvas = page.frameLocator('iframe[title="Page canvas"]')
    await expect(canvas.locator('h1.bw-heading')).toBeVisible({ timeout: 60_000 })

    await page.locator('.bwe-tile', { hasText: 'Accordion' }).click()
    await expect(canvas.locator('details.bw-acc-item').first()).toBeVisible()
    await page.locator('.bwe-top button[title="Widgets"]').click()
    await page.locator('.bwe-tile', { hasText: 'Icon box' }).click()
    await expect(page.getByRole('button', { name: 'Change' })).toBeVisible()

    await page.keyboard.press('Control+i')
    await expect(page.locator('.bwe-structure')).toBeVisible()
    await expect(page.locator('.bwe-tree-row').first()).toBeVisible()

    await page.locator('button[title^="Library"]').click()
    await expect(page.locator('.bwe-card', { hasText: 'Site header' })).toBeVisible({ timeout: 20_000 })
    await page.locator('.bwe-lib-nav button', { hasText: 'Export' }).click()
    await expect(page.getByRole('button', { name: 'Download' }).first()).toBeVisible()
  })

  test('notifications preview and PDF print view', async ({ page }) => {
    const contact = (await (await page.request.get('/api/pages?where[slug][equals]=contact&depth=0')).json()).docs[0]
    await page.goto(`/admin/blockwright/edit/pages/${contact.id}`)
    const canvas = page.frameLocator('iframe[title="Page canvas"]')
    await canvas.locator('[data-field="name"]').click()
    await page.getByRole('button', { name: 'Email notifications' }).click()
    await page.locator('.bwe-rep-item', { hasText: 'Team notification' }).locator('.bwe-rep-head > button').first().click()
    await page.getByRole('button', { name: 'Preview email' }).first().click()
    await expect(page.locator('iframe[title="Email preview"]')).toBeVisible()

    const html = await (await page.request.get('/contact')).text()
    const ref = /name="_bw_ref" value="([^"]+)"/.exec(html)![1]
    const sent = await page.request.post('/api/bw/forms/submit', {
      data: { _bw_ref: ref, _bw_elapsed: 5000, fields: { name: 'PDF Tester', email: 'pdf@example.pk', product: 'bedsheets', qty: '3', terms: 'on' } },
    })
    expect((await sent.json()).success).toBe(true)
    const entry = (await (await page.request.get('/api/bw-form-entries?limit=1&sort=-createdAt&depth=0', { headers: { Authorization: `JWT ${token}` } })).json()).docs[0]
    await page.goto(`/admin/blockwright/print/${entry.id}`)
    await expect(page.locator('.bw-print-page')).toContainText('PDF Tester')
    await expect(page.locator('.bw-print-page')).toContainText(`Entry #${entry.id}`)
  })
})
