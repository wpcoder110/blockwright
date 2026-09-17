import type { DynamicTagDefinition, ElementDefinition, Registry } from '@blockwright/core'
import type { CollectionConfig, CollectionSlug, Field, GlobalConfig, PayloadRequest } from 'payload'

/** Replace the default fields of a generated collection. */
export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type CollectionOverride = { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
export type GlobalOverride = { fields?: FieldsOverride } & Partial<Omit<GlobalConfig, 'fields'>>

/** How one of your collections uses Blockwright. */
export interface BlockwrightCollectionConfig {
  /**
   * The collection has public pages, so the admin shows a "View page" button
   * and Payload's preview button. Default: true when the collection has a `slug` field.
   */
  public?: boolean
  /** Public URL of a document. Default: `/<slug>` (`home` → `/`). */
  url?: (doc: Record<string, unknown>) => string | null
  /** Field that stores the layout. Default: `layout`. */
  field?: string
}

export type BlockwrightPluginConfig = {
  /**
   * Collections that get a Blockwright layout, either as slugs or with options each.
   * Default: `['pages']` when that collection exists.
   */
  collections?: CollectionSlug[] | Partial<Record<CollectionSlug, BlockwrightCollectionConfig | true>>
  /** Keep the schema but skip hooks, endpoints and admin components. */
  disabled?: boolean
  /** Extra widgets, registered on the site and in the API. */
  elements?: ElementDefinition[]
  /** Extra dynamic values. */
  tags?: DynamicTagDefinition[]
  /** Upload collection used for images. Default: `media` when it exists. */
  uploadCollection?: CollectionSlug | false
  /** Admin sidebar group. Default: `Blockwright`. */
  adminGroup?: string
  /** Override the generated Templates collection. */
  templatesOverrides?: CollectionOverride
  /** Override the generated Form entries collection. */
  formEntriesOverrides?: CollectionOverride
  /** Override the generated Menus collection. */
  menusOverrides?: CollectionOverride
  /** Override the generated Custom widgets collection. */
  widgetsOverrides?: CollectionOverride
  /** Override the generated Site style global. */
  siteStyleOverrides?: GlobalOverride
  forms?: {
    /** Recipient used when a form has no "To" address. Falls back to the first admin user. */
    defaultToEmail?: string
    defaultFromEmail?: string
    defaultFromName?: string
    /** Collections the "Create document" action may write to. Default: none. */
    allowedCollections?: CollectionSlug[]
    /** Signs webhook bodies with HMAC-SHA256. */
    webhookSecret?: string
    /** Submissions per IP per window. Default: 10 per minute. `false` disables it. */
    rateLimit?: { max: number; windowMs: number } | false
    /** Store visitor IP addresses with entries. Default: false. */
    storeIp?: boolean
  }
  /** Who may save raw HTML and custom CSS. Default: logged-in admin users. */
  canUseUnfilteredHtml?: (req: PayloadRequest) => boolean
  /** Called after templates, menus, the site style or a layout changes (cache revalidation). */
  onChange?: (event: { collection?: string; global?: string; doc: Record<string, unknown> }) => void | Promise<void>
} & Record<string, unknown>

export interface ResolvedOptions {
  collections: string[]
  collectionConfig: Record<string, Required<Pick<BlockwrightCollectionConfig, 'public' | 'field'>> & { url?: BlockwrightCollectionConfig['url'] }>
  templatesSlug: string
  kitSlug: string
  submissionsSlug: string
  menusSlug: string
  widgetsSlug: string
  mediaCollection: string | false
  adminGroup: string
  forms: NonNullable<BlockwrightPluginConfig['forms']>
  canUseUnfilteredHtml: (req: PayloadRequest) => boolean
  onChange?: BlockwrightPluginConfig['onChange']
  previewUrl?: (args: { collection: string; doc: Record<string, unknown> }) => string | null
}

export interface BlockwrightRuntime {
  registry: Registry
  options: ResolvedOptions
}

/** @deprecated Use `BlockwrightPluginConfig`. */
export type BlockwrightPluginOptions = BlockwrightPluginConfig
