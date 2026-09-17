import type { CollectionConfig, Field } from 'payload'
import { invalidateBlockwrightCache } from '../cache'
import type { BlockwrightRuntime } from '../types'

export const MENUS_SLUG = 'bw-menus'

function itemFields(rt: BlockwrightRuntime, depth: number): Field[] {
  const linkable = rt.options.collections
  const fields: Field[] = [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
        {
          name: 'type',
          type: 'radio',
          defaultValue: linkable.length ? 'page' : 'custom',
          options: [
            ...(linkable.length ? [{ label: 'Page on this site', value: 'page' }] : []),
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: { width: '60%', layout: 'horizontal' },
        },
      ],
    },
    ...(linkable.length
      ? [
          {
            name: 'doc',
            label: 'Page',
            type: 'relationship' as const,
            relationTo: linkable.length === 1 ? linkable[0]! : linkable,
            admin: { condition: (_: unknown, sibling: Record<string, unknown>) => sibling?.type !== 'custom' },
          } as Field,
        ]
      : []),
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      admin: {
        condition: (_: unknown, sibling: Record<string, unknown>) => sibling?.type === 'custom' || !linkable.length,
        description: 'https://…, /path, #section, mailto: or tel:',
      },
      validate: (v: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
        if (siblingData?.type !== 'custom' && linkable.length) return true
        if (typeof v !== 'string' || !v.trim()) return 'Enter a URL'
        return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(v.trim()) ? true : 'Start with https://, /, #, mailto: or tel:'
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'newTab', label: 'Open in a new tab', type: 'checkbox', admin: { width: '50%' } },
        { name: 'nofollow', label: 'Add nofollow', type: 'checkbox', admin: { width: '50%' } },
      ],
    },
  ]
  if (depth < 3) {
    fields.push({
      // distinct names per level keep SQL table and relation names unique
      name: depth === 1 ? 'submenu' : 'subitems',
      label: depth === 1 ? 'Dropdown items' : 'Sub-items',
      type: 'array',
      admin: { initCollapsed: true, components: {} },
      fields: itemFields(rt, depth + 1),
    })
  }
  return fields
}

export function menusCollection(rt: BlockwrightRuntime): CollectionConfig {
  const { adminGroup, onChange } = rt.options
  const bust = async ({ doc }: { doc: Record<string, unknown> }) => {
    invalidateBlockwrightCache()
    await onChange?.({ collection: MENUS_SLUG, doc })
  }
  return {
    slug: MENUS_SLUG,
    labels: { singular: 'Menu', plural: 'Menus' },
    admin: {
      group: adminGroup,
      useAsTitle: 'title',
      defaultColumns: ['title', 'updatedAt'],
      description: 'Navigation menus for the Nav menu widget. Links to pages follow slug changes automatically.',
    },
    access: {
      read: () => true,
      create: ({ req }) => !!req.user,
      update: ({ req }) => !!req.user,
      delete: ({ req }) => !!req.user,
    },
    fields: [
      { name: 'title', type: 'text', required: true, admin: { description: 'For example "Main menu" or "Footer links".' } },
      {
        name: 'items',
        type: 'array',
        labels: { singular: 'Menu item', plural: 'Menu items' },
        admin: { initCollapsed: false },
        fields: itemFields(rt, 1),
      },
    ],
    hooks: { afterChange: [bust], afterDelete: [bust] },
    custom: { blockwright: true },
  }
}
