/**
 * Placeholders and email layout, shared by the server (sending) and the
 * editor (preview). No Node-only APIs.
 */
import type { FieldResult, FieldValue } from './types'

export interface ReplaceContext {
  formName?: string
  siteName?: string
  siteUrl?: string
  pageUrl?: string
  entryId?: string | number
  entryUrl?: string
  fields: FieldResult[]
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const display = (v: FieldValue) => (Array.isArray(v) ? v.join(', ') : v)

export function allFieldsHtml(fields: FieldResult[]): string {
  const rows = fields
    .filter((f) => f.type !== 'password')
    .map(
      (f) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e9ecef;width:35%;font-weight:600;color:#343a40;vertical-align:top">${escapeHtml(f.label)}</td>` +
        `<td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#212529;vertical-align:top">${escapeHtml(display(f.value) || '—').replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #e9ecef;border-radius:6px;font-size:14px">${rows}</table>`
}

export interface ReplaceOptions {
  /** Escape inserted values for HTML. */
  html?: boolean
  /** URL-encode inserted values. */
  url?: boolean
  /** Convert line breaks in the template to <br> (plain text written into an HTML email). */
  nl2br?: boolean
}

/** Replace [all-fields], [field id="x"], {form_name}, {site_name}, {page_url}, {date}, {entry_id}, {entry_url}. */
export function replacePlaceholders(template: unknown, c: ReplaceContext, opts: ReplaceOptions = {}): string {
  if (typeof template !== 'string') return ''
  const enc = (s: string) => (opts.url ? encodeURIComponent(s) : opts.html ? escapeHtml(s) : s)
  const byId = new Map(c.fields.map((f) => [f.id, f]))
  const tokens: Record<string, string> = {
    form_name: c.formName ?? '',
    site_name: c.siteName ?? '',
    site_url: c.siteUrl ?? '',
    page_url: c.pageUrl ?? '',
    entry_id: c.entryId === undefined ? '' : String(c.entryId),
    entry_url: c.entryUrl ?? '',
    date: new Date().toISOString().slice(0, 10),
    date_time: new Date().toISOString().replace('T', ' ').slice(0, 16),
  }
  let out = template
    // placeholders the rich-text editor may have escaped
    .replace(/&quot;/g, '"')
    .replace(/\[all-fields\]/g, () =>
      opts.url ? '' : opts.html ? allFieldsHtml(c.fields) : c.fields.filter((f) => f.type !== 'password').map((f) => `${f.label}: ${display(f.value)}`).join('\n'),
    )
    .replace(/\[field\s+id=["']?([A-Za-z0-9_-]+)["']?(?:\s+label)?\s*\]/g, (m, id: string) => {
      const f = byId.get(id)
      if (!f) return ''
      const value = enc(display(f.value))
      return /\slabel\s*\]$/.test(m) ? `${enc(f.label)}: ${value}` : value
    })
    .replace(/\{(form_name|site_name|site_url|page_url|entry_id|entry_url|date|date_time)\}/g, (_m, k: string) => enc(tokens[k] ?? ''))
  if (opts.nl2br) out = out.replace(/\n/g, '<br>')
  return out
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/div|\/h[1-6]|\/li|\/tr)\s*\/?>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Wrap content in a simple, email-client-safe layout. */
export function emailLayout(content: string, o: { siteName?: string; siteUrl?: string; accent?: string; footer?: string } = {}): string {
  const accent = /^#[0-9a-f]{3,8}$/i.test(o.accent ?? '') ? o.accent : '#1d3557'
  const name = escapeHtml(o.siteName ?? '')
  const footer = o.footer ?? (name ? `Sent from ${o.siteUrl ? `<a href="${escapeHtml(o.siteUrl)}" style="color:#868e96">${name}</a>` : name}` : '')
  return (
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f1f3f5">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f5;padding:24px 12px"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#212529">' +
    (name ? `<tr><td style="padding:18px 28px;background:${accent};color:#ffffff;font-size:17px;font-weight:700">${name}</td></tr>` : '') +
    `<tr><td style="padding:26px 28px">${content}</td></tr>` +
    (footer ? `<tr><td style="padding:14px 28px;border-top:1px solid #e9ecef;font-size:12px;color:#868e96">${footer}</td></tr>` : '') +
    '</table></td></tr></table></body></html>'
  )
}

export const DEFAULT_NOTIFICATION_HTML =
  '<p>You have a new submission from <strong>{form_name}</strong>.</p><p>[all-fields]</p><p>Sent from {page_url} on {date_time}.</p>'

export interface Notification {
  _id?: string
  name?: string
  enabled?: string | boolean
  to?: string
  cc?: string
  bcc?: string
  subject?: string
  format?: 'html' | 'plain'
  message_html?: string
  message_text?: string
  from_email?: string
  from_name?: string
  reply_to?: string
  wrap?: string | boolean
  bw_route?: unknown
}

/** Build the email for one notification (also used by the editor preview). */
export function buildNotification(n: Notification, replace: (t: unknown, o?: ReplaceOptions) => string, brand: { siteName?: string; siteUrl?: string; accent?: string } = {}) {
  const plain = n.format === 'plain'
  const body = plain ? replace(n.message_text ?? '', { html: true, nl2br: true }) : replace(n.message_html || DEFAULT_NOTIFICATION_HTML, { html: true })
  const html = n.wrap === '' || n.wrap === false ? body : emailLayout(body, brand)
  const text = plain ? replace(n.message_text ?? '') : htmlToText(body)
  return {
    subject: replace(n.subject || 'New submission: {form_name}').replace(/[\r\n]+/g, ' ').slice(0, 250),
    html,
    text,
  }
}

