import { DEFAULT_CATEGORIES } from '@blockwright/core'
import { ICONS } from '@blockwright/renderer'
import type { CollectionConfig } from 'payload'
import { invalidateBlockwrightCache } from '../cache'
import type { BlockwrightRuntime } from '../types'

const FIELD_TYPES = [
  ['text', 'Text'], ['textarea', 'Textarea'], ['wysiwyg', 'Rich text'], ['number', 'Number'], ['switcher', 'Switch'],
  ['select', 'Select'], ['choose', 'Button group'], ['color', 'Color'], ['media', 'Image'], ['gallery', 'Gallery'],
  ['url', 'Link'], ['icon', 'Icon'], ['slider', 'Slider'], ['font', 'Font family'],
  ['typography', 'Typography (group)'], ['background', 'Background (group)'], ['border', 'Border (group)'],
  ['border-radius', 'Border radius'], ['box-shadow', 'Box shadow (group)'], ['padding', 'Padding'], ['margin', 'Margin'],
].map(([value, label]) => ({ value: value!, label: label! }))

const STARTER_TEMPLATE = `<div class="card">
  {{#if image}}<img src="{{ image.url }}" alt="{{ title }}" loading="lazy">{{/if}}
  <h3>{{ title }}</h3>
  <p>{{ text }}</p>
  {{#if link}}<a class="card-link" {{link link}}>{{ link_text }} {{icon link_icon}}</a>{{/if}}
</div>`

const STARTER_CSS = `selector .card { display: flex; flex-direction: column; gap: 10px; }
selector .card img { width: 100%; height: auto; border-radius: 8px; }
selector h3 { margin: 0; }
selector .card-link { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }`

export function widgetsCollection(rt: BlockwrightRuntime): CollectionConfig {
  const { adminGroup, canUseUnfilteredHtml, onChange } = rt.options
  const slug = 'bw-widgets'
  const bust = async ({ doc }: { doc: Record<string, unknown> }) => {
    invalidateBlockwrightCache()
    await onChange?.({ collection: slug, doc })
  }
  return {
    slug,
    labels: { singular: 'Custom widget', plural: 'Custom widgets' },
    admin: {
      group: adminGroup,
      useAsTitle: 'title',
      defaultColumns: ['title', 'type', 'category', 'enabled', 'updatedAt'],
      description:
        'Build your own widgets from fields and an HTML template. They appear in the editor under their category. Because they can contain raw HTML, only users allowed to post unfiltered HTML (the admin role by default) can create or edit them.',
    },
    access: {
      read: ({ req }) => !!req.user,
      create: ({ req }) => canUseUnfilteredHtml(req),
      update: ({ req }) => canUseUnfilteredHtml(req),
      delete: ({ req }) => canUseUnfilteredHtml(req),
    },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'title', type: 'text', required: true, admin: { width: '50%' } },
          {
            name: 'type',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: { width: '50%', description: 'Unique ID, e.g. pricing-card. Changing it disconnects existing uses.' },
            validate: (value: unknown) => {
              if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{1,40}$/.test(value)) return 'Use 2–41 lowercase letters, numbers and dashes, starting with a letter.'
              if (rt.registry.get(value)) return `"${value}" is a built-in widget. Choose another ID.`
              return true
            },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'category',
            type: 'select',
            defaultValue: 'custom',
            options: DEFAULT_CATEGORIES.map((c) => ({ label: c.title, value: c.id })),
            admin: { width: '33%' },
          },
          {
            name: 'icon',
            type: 'select',
            defaultValue: 'star',
            options: Object.keys(ICONS).map((k) => ({ label: k, value: k })),
            admin: { width: '33%' },
          },
          { name: 'enabled', type: 'checkbox', defaultValue: true, admin: { width: '33%', style: { alignSelf: 'center' } } },
        ],
      },
      { name: 'description', type: 'text' },
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Fields',
            description: 'Settings shown in the editor. Use each field name in the template, e.g. {{ title }}.',
            fields: [
              {
                name: 'fields',
                type: 'array',
                labels: { singular: 'Field', plural: 'Fields' },
                admin: { initCollapsed: true, components: {} },
                defaultValue: [
                  { name: 'title', label: 'Title', type: 'text', default: 'Card title' },
                  { name: 'text', label: 'Text', type: 'textarea', default: 'A short description.' },
                  { name: 'image', label: 'Image', type: 'media' },
                  { name: 'link', label: 'Link', type: 'url' },
                  { name: 'link_text', label: 'Link text', type: 'text', default: 'Learn more' },
                  { name: 'link_icon', label: 'Link icon', type: 'icon', default: 'arrow-right' },
                  { name: 'title_color', label: 'Title color', type: 'color', tab: 'style', selector: '{{WRAPPER}} h3', css: 'color: {{VALUE}};' },
                  { name: 'title_typography', label: 'Title typography', type: 'typography', tab: 'style', selector: '{{WRAPPER}} h3' },
                ],
                fields: [
                  {
                    type: 'row',
                    fields: [
                      { name: 'name', type: 'text', required: true, admin: { width: '34%', description: 'lowercase_with_underscores' }, validate: (v: unknown) => (typeof v === 'string' && /^[a-z_][a-z0-9_]{0,60}$/.test(v) ? true : 'Use lowercase letters, numbers and underscores') },
                      { name: 'label', type: 'text', admin: { width: '33%' } },
                      { name: 'type', type: 'select', defaultValue: 'text', options: FIELD_TYPES, admin: { width: '33%' } },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      { name: 'default', type: 'text', admin: { width: '34%', description: 'Default value (slider: 24px, icon: star)' } },
                      { name: 'tab', type: 'select', defaultValue: 'content', options: [{ label: 'Content', value: 'content' }, { label: 'Style', value: 'style' }], admin: { width: '33%' } },
                      { name: 'section', type: 'text', admin: { width: '33%', description: 'Panel section name' } },
                    ],
                  },
                  { name: 'options', type: 'textarea', admin: { description: 'For Select and Button group: one option per line, "Label|value".', condition: (_d, s) => ['select', 'choose'].includes(s?.type) } },
                  {
                    type: 'row',
                    fields: [
                      { name: 'selector', type: 'text', admin: { width: '50%', description: 'CSS selector, e.g. {{WRAPPER}} h3' } },
                      { name: 'css', type: 'text', admin: { width: '50%', description: 'Declaration, e.g. color: {{VALUE}}; or font-size: {{SIZE}}{{UNIT}};' } },
                    ],
                  },
                  { name: 'responsive', type: 'checkbox', admin: { description: 'Different values per device' } },
                ],
              },
            ],
          },
          {
            label: 'Template',
            fields: [
              {
                name: 'template',
                type: 'code',
                required: true,
                defaultValue: STARTER_TEMPLATE,
                admin: {
                  language: 'html',
                  description:
                    'HTML with placeholders: {{ field }} (escaped), {{{ field }}} (HTML), {{#if field}}…{{else}}…{{/if}}, {{#each items}}{{ this.text }}{{/each}}, {{icon field}}, {{link field}}, {{ image.url }}.',
                },
              },
              { name: 'css', type: 'code', defaultValue: STARTER_CSS, admin: { language: 'css', description: 'Loaded once per page when the widget is used. "selector" targets this widget.' } },
            ],
          },
          {
            label: 'JSON (advanced)',
            fields: [
              {
                name: 'definition',
                type: 'json',
                admin: {
                  description:
                    'Optional. A full definition replaces the Fields tab: { "sections": [{ "id": "content", "label": "Content", "tab": "content", "controls": [{ "name": "title", "type": "text", "label": "Title" }, { "name": "title_typography", "type": "typography", "selector": "{{WRAPPER}} h3" }] }] }',
                },
              },
            ],
          },
        ],
      },
    ],
    hooks: { afterChange: [bust], afterDelete: [bust] },
    custom: { blockwright: true },
  }
}
