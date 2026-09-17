import type { CollectionConfig } from 'payload'
import type { BlockwrightRuntime } from '../types'

export function submissionsCollection(rt: BlockwrightRuntime): CollectionConfig {
  const { submissionsSlug, adminGroup } = rt.options
  const loggedIn = ({ req }: { req: { user?: unknown } }) => !!req.user
  return {
    slug: submissionsSlug,
    labels: { singular: 'Form entry', plural: 'Form entries' },
    admin: {
      group: adminGroup,
      useAsTitle: 'summary',
      defaultColumns: ['summary', 'formName', 'status', 'createdAt'],
      description: 'Everything visitors sent through Blockwright forms.',
    },
    access: {
      // entries are only created by the form endpoint
      create: () => false,
      read: loggedIn,
      update: loggedIn,
      delete: loggedIn,
    },
    fields: [
      {
        name: 'entryView',
        type: 'ui',
        admin: { components: { Field: '@blockwright/payload-plugin/rsc#FormEntryView' } },
      },
      { name: 'summary', type: 'text', admin: { readOnly: true, hidden: true } },
      {
        name: 'status',
        type: 'select',
        defaultValue: 'new',
        options: [
          { label: 'New', value: 'new' },
          { label: 'Read', value: 'read' },
          { label: 'Archived', value: 'archived' },
        ],
        admin: { position: 'sidebar' },
      },
      { name: 'formName', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar' } },
      { name: 'elementId', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar' } },
      {
        name: 'answers',
        type: 'array',
        admin: { readOnly: true, hidden: true },
        fields: [
          { name: 'fieldId', type: 'text' },
          { name: 'label', type: 'text' },
          { name: 'value', type: 'textarea' },
        ],
      },
      {
        type: 'collapsible',
        label: 'Technical details',
        admin: { initCollapsed: true },
        fields: [
          { name: 'values', type: 'json', admin: { readOnly: true, description: 'Raw values keyed by field ID.' } },
          {
            name: 'source',
            type: 'group',
            admin: { readOnly: true },
            fields: [
              { name: 'collection', type: 'text' },
              { name: 'docId', type: 'text' },
              { name: 'pageUrl', type: 'text' },
              { name: 'referer', type: 'text' },
              { name: 'userAgent', type: 'text' },
              { name: 'ip', type: 'text' },
            ],
          },
          { name: 'actionLog', type: 'json', admin: { readOnly: true } },
        ],
      },
    ],
    custom: { blockwright: true },
  }
}
