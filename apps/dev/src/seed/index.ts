/**
 * Demo content for local testing: `pnpm seed`
 * Safe to run repeatedly: demo documents are replaced.
 * The same content can be installed from the admin dashboard.
 */
import { installDemoContent } from 'blockwright'
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
payload.logger.info('[seed] done. Open http://localhost:3000 and http://localhost:3000/admin')
process.exit(0)
