import { DEFAULT_BREAKPOINTS, DEFAULT_KIT, type Breakpoints, type Kit } from '@blockwright/core'
import type { GlobalConfig } from 'payload'
import { invalidateBlockwrightCache } from './cache'
import type { BlockwrightRuntime } from './types'

const FONT_WEIGHTS = ['', '300', '400', '500', '600', '700', '800'].map((v) => ({ label: v || 'Default', value: v || 'default' }))

export function kitGlobal(rt: BlockwrightRuntime): GlobalConfig {
  const { kitSlug, adminGroup, mediaCollection, onChange } = rt.options
  return {
    slug: kitSlug,
    label: 'Site style',
    admin: { group: adminGroup, description: 'Global colors, fonts and layout used by every Blockwright page.' },
    access: { read: () => true, update: ({ req }) => !!req.user },
    fields: [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Identity',
            fields: [
              { name: 'siteName', type: 'text', defaultValue: 'My site' },
              { name: 'siteDescription', type: 'text' },
              { name: 'siteUrl', type: 'text', admin: { description: 'Public URL, e.g. https://example.com' } },
              ...(mediaCollection ? [{ name: 'logo', type: 'upload' as const, relationTo: mediaCollection }] : []),
            ],
          },
          {
            label: 'Colors',
            fields: [
              {
                name: 'colors',
                type: 'array',
                labels: { singular: 'Color', plural: 'Colors' },
                defaultValue: DEFAULT_KIT.colors.map((c) => ({ colorId: c.id, title: c.title, color: c.color })),
                admin: {
                  description: 'Referenced by widgets as global colors. Changing a color updates it everywhere.',
                  components: { RowLabel: 'blockwright/client#ColorRowLabel' },
                },
                fields: [
                  {
                    type: 'row',
                    fields: [
                      { name: 'title', type: 'text', required: true },
                      { name: 'colorId', type: 'text', required: true, admin: { description: 'Lowercase id, e.g. primary' } },
                      {
                        name: 'color',
                        type: 'text',
                        required: true,
                        admin: { description: 'Hex, rgb() or hsl()', components: { Field: 'blockwright/client#ColorField' } },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            label: 'Fonts',
            fields: [
              {
                name: 'typography',
                type: 'array',
                labels: { singular: 'Font', plural: 'Fonts' },
                admin: { components: { RowLabel: 'blockwright/client#TypographyRowLabel' } },
                defaultValue: DEFAULT_KIT.typography.map((t) => ({ typoId: t.id, title: t.title, fontFamily: t.fontFamily, fontWeight: t.fontWeight })),
                fields: [
                  {
                    type: 'row',
                    fields: [
                      { name: 'title', type: 'text', required: true },
                      { name: 'typoId', type: 'text', required: true },
                      { name: 'fontFamily', type: 'text', admin: { description: 'Google Fonts family, e.g. Inter', components: { Field: 'blockwright/client#FontField' } } },
                    ],
                  },
                  {
                    type: 'row',
                    fields: [
                      { name: 'fontSize', type: 'number', admin: { description: 'px' } },
                      { name: 'fontWeight', type: 'select', options: FONT_WEIGHTS },
                      { name: 'lineHeight', type: 'number', admin: { description: 'e.g. 1.5' } },
                      { name: 'letterSpacing', type: 'number', admin: { description: 'px' } },
                    ],
                  },
                ],
              },
              {
                name: 'fontProvider',
                type: 'select',
                defaultValue: 'google',
                options: [
                  { label: 'Google Fonts', value: 'google' },
                  { label: 'None (self-hosted or system fonts)', value: 'none' },
                ],
              },
            ],
          },
          {
            label: 'Layout',
            fields: [
              { name: 'containerWidth', type: 'number', defaultValue: DEFAULT_KIT.containerWidth, admin: { description: 'Content width of boxed frames, in px.' } },
              { name: 'elementGap', type: 'number', defaultValue: DEFAULT_KIT.elementGap, admin: { description: 'Default gap between elements, in px.' } },
              {
                name: 'breakpoints',
                type: 'group',
                admin: { description: 'Leave optional breakpoints empty to turn them off.' },
                fields: [
                  {
                    type: 'row',
                    fields: [
                      { name: 'mobile', type: 'number', defaultValue: DEFAULT_BREAKPOINTS.mobile.value },
                      { name: 'mobileExtra', type: 'number' },
                      { name: 'tablet', type: 'number', defaultValue: DEFAULT_BREAKPOINTS.tablet.value },
                      { name: 'tabletExtra', type: 'number' },
                      { name: 'laptop', type: 'number' },
                      { name: 'widescreen', type: 'number' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            label: 'Custom CSS',
            fields: [{ name: 'customCss', type: 'code', admin: { language: 'css', description: 'Added to every Blockwright page.' } }],
          },
        ],
      },
    ],
    hooks: {
      afterChange: [
        async ({ doc }) => {
          invalidateBlockwrightCache()
          await onChange?.({ global: kitSlug, doc })
          return doc
        },
      ],
    },
    custom: { blockwright: true },
  }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const ident = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '')

/** Convert the stored global into a render kit. */
export function kitFromDoc(doc: Record<string, any> | null | undefined): Kit {
  if (!doc) return DEFAULT_KIT
  const bp = (doc.breakpoints ?? {}) as Record<string, unknown>
  const point = (key: keyof Breakpoints, field: string, fallbackEnabled: boolean) => {
    const v = num(bp[field])
    const def = DEFAULT_BREAKPOINTS[key]
    return v ? { ...def, value: v, enabled: true } : { ...def, enabled: fallbackEnabled }
  }
  const colors = Array.isArray(doc.colors)
    ? doc.colors.filter((c: any) => c?.colorId && c?.color).map((c: any) => ({ id: ident(c.colorId), title: String(c.title ?? c.colorId), color: String(c.color) }))
    : DEFAULT_KIT.colors
  const typography = Array.isArray(doc.typography)
    ? doc.typography
        .filter((t: any) => t?.typoId)
        .map((t: any) => ({
          id: ident(t.typoId),
          title: String(t.title ?? t.typoId),
          fontFamily: t.fontFamily || undefined,
          fontSize: num(t.fontSize),
          fontWeight: t.fontWeight && t.fontWeight !== 'default' ? String(t.fontWeight) : undefined,
          lineHeight: num(t.lineHeight),
          letterSpacing: num(t.letterSpacing),
        }))
    : DEFAULT_KIT.typography
  return {
    colors,
    typography,
    containerWidth: num(doc.containerWidth) ?? DEFAULT_KIT.containerWidth,
    elementGap: num(doc.elementGap) ?? DEFAULT_KIT.elementGap,
    fontProvider: doc.fontProvider === 'none' ? 'none' : 'google',
    customCss: typeof doc.customCss === 'string' ? doc.customCss : undefined,
    breakpoints: {
      mobile: point('mobile', 'mobile', true),
      mobile_extra: point('mobile_extra', 'mobileExtra', false),
      tablet: point('tablet', 'tablet', true),
      tablet_extra: point('tablet_extra', 'tabletExtra', false),
      laptop: point('laptop', 'laptop', false),
      widescreen: point('widescreen', 'widescreen', false),
    },
  }
}
