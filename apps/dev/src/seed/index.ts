/**
 * Demo content for local testing: `pnpm seed`
 * Safe to run repeatedly: demo documents are replaced.
 * The same content can be installed from the admin dashboard.
 */
import { installDemoContent } from 'blockwright'
import { installShopDemo } from './shop'
import { getPayload } from 'payload'
import config from '../payload.config'

const payload = await getPayload({ config })

// optional admin user for automated tests: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (email && password) {
  const existing = await payload.count({ collection: 'users', where: { email: { equals: email } } })
  if (!existing.totalDocs) {
    await payload.create({ collection: 'users', data: { email, password } })
    payload.logger.info(`[seed] created admin user ${email}`)
  }
}
const result = await installDemoContent(payload, { collection: 'pages', siteUrl: process.env.NEXT_PUBLIC_SERVER_URL })
payload.logger.info(`[seed] pages: ${result.pages.join(', ')}; templates: ${result.templates.join(', ')}`)
for (const s of result.skipped) payload.logger.warn(`[seed] ${s}`)
// demo products, so the commerce widgets have something to show
if ((payload.collections as Record<string, unknown>).products) {
  const items = [
    { title: 'Indigo block-printed bedsheet', slug: 'indigo-bedsheet', amount: 8500, inventory: 12 },
    { title: 'Madder cushion cover', slug: 'madder-cushion-cover', amount: 2200, inventory: 30 },
    { title: 'Hand-stamped table runner', slug: 'table-runner', amount: 3900, inventory: 0 },
    { title: 'Ajrak cotton throw', slug: 'ajrak-throw', amount: 12500, inventory: 6 },
  ]
  for (const item of items) {
    const data = {
      title: item.title,
      slug: item.slug,
      inventory: item.inventory,
      priceInUSD: item.amount,
      priceInUSDEnabled: true,
      _status: 'published',
    } as never
    const found = await payload.find({ collection: 'products' as never, where: { slug: { equals: item.slug } }, limit: 1, overrideAccess: true })
    if (found.docs[0]) await payload.update({ collection: 'products' as never, id: (found.docs[0] as { id: string | number }).id, data, overrideAccess: true })
    else await payload.create({ collection: 'products' as never, data, overrideAccess: true })
  }
  payload.logger.info(`[seed] products: ${items.length}`)
}

await installShopDemo(payload)

payload.logger.info('[seed] done. Open http://localhost:3000 and http://localhost:3000/admin')
process.exit(0)
