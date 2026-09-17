import type { CollectionConfig } from 'payload'

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const pathFor = (slug?: string | null) => (!slug || slug === 'home' ? '/' : `/${slug}`)

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    preview: (doc) => `${serverUrl}${pathFor(doc?.slug as string)}?preview=1`,
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'URL path. Use "home" for the front page.' },
      validate: (v: unknown) => (typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(v) ? true : 'Use lowercase letters, numbers and dashes'),
    },
    {
      name: 'meta',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
