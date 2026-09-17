import type { CollectionConfig } from 'payload'
import { invalidateBlockwrightCache } from '../cache'
import { editButtonField, layoutBeforeChange, layoutField } from '../layoutField'
import type { BlockwrightRuntime } from '../types'

export const TEMPLATE_TYPES = [
  { label: 'Header', value: 'header' },
  { label: 'Footer', value: 'footer' },
  { label: 'Single page', value: 'single-page' },
  { label: 'Single post', value: 'single-post' },
  { label: 'Single (any document)', value: 'single' },
  { label: 'Archive', value: 'archive' },
  { label: 'Search results', value: 'search-results' },
  { label: '404 page', value: 'error-404' },
  { label: 'Section (reusable block)', value: 'section' },
  { label: 'Page template', value: 'page' },
  { label: 'Popup', value: 'popup' },
  { label: 'PDF for form entries', value: 'pdf' },
]

const CONDITION_RE = /^(include|exclude)\/(general|front_page|not_found404|singular|archive)(\/[A-Za-z0-9_-]+){0,4}$/

export function templatesCollection(rt: BlockwrightRuntime): CollectionConfig {
  const { templatesSlug, adminGroup, onChange } = rt.options
  const bust = async ({ doc }: { doc: Record<string, unknown> }) => {
    invalidateBlockwrightCache()
    await onChange?.({ collection: templatesSlug, doc })
  }
  return {
    slug: templatesSlug,
    labels: { singular: 'Template', plural: 'Templates' },
    admin: {
      group: adminGroup,
      useAsTitle: 'title',
      defaultColumns: ['title', 'type', 'conditions', 'updatedAt'],
      description: 'Headers, footers and other site parts, shown wherever their display conditions match.',
    },
    versions: { drafts: true, maxPerDoc: 20 },
    access: {
      read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
      create: ({ req }) => !!req.user,
      update: ({ req }) => !!req.user,
      delete: ({ req }) => !!req.user,
    },
    fields: [
      editButtonField(),
      { name: 'title', type: 'text', required: true },
      { name: 'type', type: 'select', required: true, defaultValue: 'section', options: TEMPLATE_TYPES, admin: { position: 'sidebar' } },
      {
        name: 'conditions',
        type: 'text',
        hasMany: true,
        admin: {
          position: 'sidebar',
          description:
            'Where to show it. Examples: include/general (entire site), include/front_page, include/singular/pages/12, exclude/singular/pages/12, include/not_found404.',
        },
        validate: (value: unknown) => {
          if (!Array.isArray(value)) return true
          const bad = value.find((v) => typeof v !== 'string' || !CONDITION_RE.test(v))
          return bad === undefined ? true : `"${String(bad)}" is not a valid condition`
        },
      },
      layoutField(),
      { name: 'pageSettings', type: 'json', admin: { hidden: true } },
    ],
    hooks: {
      beforeChange: [layoutBeforeChange(rt)],
      afterChange: [bust],
      afterDelete: [bust],
    },
    custom: { blockwright: true },
  }
}
