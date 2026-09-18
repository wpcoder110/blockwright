// Example: Payload plugin template + roles + @payloadcms/plugin-ecommerce + Blockwright.
// Copy the parts you need into your own dev/payload.config.ts.
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig, type Access, type FieldAccess } from 'payload'
import { rlt } from 'rlt'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { blockwrightPlugin } from 'blockwright'
import { Pages } from './collections/Pages.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
if (!process.env.ROOT_DIR) process.env.ROOT_DIR = dirname

const userIsAdmin = (user: unknown): boolean => {
  if (!user || typeof user !== 'object') return false
  const roles = (user as { roles?: string[] }).roles
  return Boolean(roles?.includes('admin'))
}
const isAdmin: Access = ({ req: { user } }) => userIsAdmin(user)
const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => userIsAdmin(user)
const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)
const isCustomer: FieldAccess = ({ req: { user } }) => Boolean(user && !userIsAdmin(user))
const adminOrPublishedStatus: Access = ({ req: { user } }) => (userIsAdmin(user) ? true : { _status: { equals: 'published' } })
const isDocumentOwner: Access = ({ req: { user } }) => {
  if (userIsAdmin(user)) return true
  if (user?.id) return { customer: { equals: user.id } }
  return false
}

const buildConfigWithDatabase = async () => {
  let db
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({ replSet: { count: 3, dbName: 'payloadmemory' } })
    process.env.DATABASE_URL = `${memoryDB.getUri()}&retryWrites=true`
    db = mongooseAdapter({ ensureIndexes: true, url: process.env.DATABASE_URL })
  } else {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Add your PostgreSQL connection string to .env')
    db = postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })
  }

  return buildConfig({
    admin: { user: 'users', importMap: { baseDir: path.resolve(dirname) } },
    collections: [
      {
        slug: 'users',
        auth: true,
        admin: { useAsTitle: 'email', group: 'Users' },
        access: {
          create: ({ req: { user } }) => (!user ? true : userIsAdmin(user)),
          read: ({ req: { user } }) => (userIsAdmin(user) ? true : user?.id ? { id: { equals: user.id } } : false),
          update: ({ req: { user } }) => (userIsAdmin(user) ? true : user?.id ? { id: { equals: user.id } } : false),
          delete: isAdmin,
        },
        fields: [
          { name: 'name', type: 'text' },
          {
            name: 'roles',
            type: 'select',
            hasMany: true,
            required: true,
            defaultValue: ['customer'],
            saveToJWT: true,
            options: [
              { label: 'Admin', value: 'admin' },
              { label: 'Customer', value: 'customer' },
            ],
            access: {
              create: ({ req: { user } }) => (!user ? true : userIsAdmin(user)),
              update: ({ req: { user } }) => userIsAdmin(user),
            },
          },
        ],
      },
      Pages,
      { slug: 'posts', fields: [] },
      {
        slug: 'media',
        access: { read: () => true },
        fields: [{ name: 'alt', type: 'text' }],
        upload: { staticDir: path.resolve(dirname, 'media') },
      },
    ],
    db,
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
      const admins = await payload.count({ collection: 'users', where: { roles: { contains: 'admin' } }, overrideAccess: true })
      if (admins.totalDocs === 0) {
        const { docs } = await payload.find({ collection: 'users', limit: 1, sort: 'createdAt', overrideAccess: true })
        if (docs[0]) {
          await payload.update({ collection: 'users', id: docs[0].id, data: { roles: ['admin', 'customer'] }, overrideAccess: true })
          payload.logger.info(`Granted the admin role to ${docs[0].email}`)
        }
      }
    },
    plugins: [
      rlt({ collections: { posts: true } }),
      ecommercePlugin({
        products: true,
        access: { adminOnlyFieldAccess, adminOrPublishedStatus, isAdmin, isAuthenticated, isCustomer, isDocumentOwner },
        customers: { slug: 'users' },
      }),
      blockwrightPlugin({ collections: { pages: { public: true } } }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  })
}

export default buildConfigWithDatabase()
