import type { DynamicTagDefinition, ElementDefinition, Registry } from '@blockwright/core'
import type { PayloadRequest } from 'payload'

export interface BlockwrightPluginOptions {
  /** Set false to keep the schema but skip hooks and endpoints. */
  enabled?: boolean
  /** Collections that get a Blockwright `layout` field. Default: `['pages']`. */
  collections?: string[]
  /** Extra widgets to register. */
  elements?: ElementDefinition[]
  /** Extra dynamic value sources. */
  tags?: DynamicTagDefinition[]
  /** Slug of the upload collection used for the site logo. Default: `media` when it exists. */
  mediaCollection?: string | false
  /** Admin sidebar group label. */
  adminGroup?: string
  templates?: { slug?: string }
  kit?: { slug?: string }
  forms?: {
    submissionsSlug?: string
    /** Fallback recipient when a form has no "To" address. */
    emailTo?: string
    emailFrom?: string
    emailFromName?: string
    /** Collections the "Create document" action may write to. Default: none. */
    allowedCollections?: string[]
    /** Signs webhook bodies with HMAC-SHA256 (X-Blockwright-Signature header). */
    webhookSecret?: string
    /** Max submissions per IP per window. Default: 10 per 60 seconds. */
    rateLimit?: { max: number; windowMs: number } | false
    /** Store the visitor IP address with submissions. Default: false. */
    storeIp?: boolean
  }
  /** Who may save raw HTML and custom CSS. Default: any logged-in admin user. */
  canUseUnfilteredHtml?: (req: PayloadRequest) => boolean
  /** Public URL of a document, used by the editor's "View page" button. Default: `/<slug>` (`home` → `/`). */
  previewUrl?: (args: { collection: string; doc: Record<string, unknown> }) => string | null
  /** Called after templates, the site style or a Blockwright document change (use for cache revalidation). */
  onChange?: (event: { collection?: string; global?: string; doc: Record<string, unknown> }) => void | Promise<void>
}

export interface ResolvedOptions {
  collections: string[]
  templatesSlug: string
  kitSlug: string
  submissionsSlug: string
  mediaCollection: string | false
  adminGroup: string
  forms: NonNullable<BlockwrightPluginOptions['forms']>
  canUseUnfilteredHtml: (req: PayloadRequest) => boolean
  onChange?: BlockwrightPluginOptions['onChange']
  previewUrl?: BlockwrightPluginOptions['previewUrl']
}

export interface BlockwrightRuntime {
  registry: Registry
  options: ResolvedOptions
}
