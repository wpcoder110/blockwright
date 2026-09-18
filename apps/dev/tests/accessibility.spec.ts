import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// WCAG 2.1 A and AA, the level US ADA guidance points at.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const describeViolations = (violations: Array<{ id: string; impact?: string | null; nodes: Array<{ target: unknown[] }>; help: string }>) =>
  violations.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`).join('\n')

for (const [name, path] of [
  ['home page', '/'],
  ['form page', '/contact'],
  ['404 page', '/no-such-page'],
]) {
  test(`${name} has no accessibility violations`, async ({ page }) => {
    await page.goto(path)
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(describeViolations(violations)).toBe('')
  })
}

test('form errors are announced and linked to their fields', async ({ page }) => {
  await page.goto('/')
  const form = page.locator('form.bw-form')
  await form.getByRole('button', { name: 'Send message' }).click()
  const name = form.getByLabel('Name', { exact: true })
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await name.getAttribute('aria-describedby')
  await expect(form.locator(`#${describedBy}`)).toHaveText('This field is required.')
  const { violations } = await new AxeBuilder({ page }).include('form.bw-form').withTags(TAGS).analyze()
  expect(describeViolations(violations)).toBe('')
})

test('the site is usable with the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard navigation is a desktop concern')
  await page.goto('/')
  // the first stops are real links, not the hidden mobile-menu checkbox
  const stops: string[] = []
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab')
    stops.push(await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.textContent?.trim().slice(0, 20)}`))
  }
  expect(stops.every((s) => s.startsWith('A') || s.startsWith('BUTTON'))).toBe(true)
  expect(stops[0]).toContain('Rangrez')
  await page.goto('/contact')
  await page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: 'Services' }).focus()
  await expect(page.getByRole('link', { name: 'Custom orders' })).toBeVisible()
})
