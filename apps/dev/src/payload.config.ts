import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { blockwrightPlugin } from '@blockwright/payload-plugin'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Blockwright dev' },
  },
  collections: [Pages, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'hello@blockwright.local',
        defaultFromName: 'Blockwright dev',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 1025),
          secure: false,
          ignoreTLS: true,
        },
      })
    : undefined,
  sharp,
  plugins: [
    blockwrightPlugin({
      collections: ['pages'],
      forms: {
        emailTo: process.env.FORMS_EMAIL_TO,
        emailFrom: process.env.EMAIL_FROM,
        allowedCollections: [],
        rateLimit: { max: Number(process.env.FORMS_RATE_LIMIT || 10), windowMs: 60_000 },
      },
    }),
  ],
})
