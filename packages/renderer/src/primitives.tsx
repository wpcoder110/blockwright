import type { ComponentType, ReactNode } from 'react'
import type { RenderContext } from '@blockwright/core'
import type { MediaValue, UrlValue } from '@blockwright/schema'

export interface ImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  sizes?: string
  /** `high` for the largest above-the-fold image (LCP). */
  priority?: boolean
  style?: React.CSSProperties
}

export interface LinkProps {
  href: string
  className?: string
  children?: ReactNode
  target?: string
  rel?: string
  [attr: string]: unknown
}

/** Framework-agnostic <img> with performance defaults. Override via ctx.components.Image. */
export function BwImage({ ctx, ...props }: ImageProps & { ctx: RenderContext }) {
  const Custom = ctx.components?.Image as ComponentType<ImageProps> | undefined
  if (Custom && props.width && props.height) return <Custom {...props} />
  const { priority, ...rest } = props
  return (
    <img
      {...rest}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
    />
  )
}

export function BwLink({ ctx, href, children, ...rest }: LinkProps & { ctx: RenderContext }) {
  const Custom = ctx.components?.Link as ComponentType<LinkProps> | undefined
  const internal = href.startsWith('/') && !href.startsWith('//')
  if (Custom && internal && !rest.target) {
    return (
      <Custom href={href} {...rest}>
        {children}
      </Custom>
    )
  }
  return (
    <a href={href} {...(rest as Record<string, unknown>)}>
      {children}
    </a>
  )
}

const SAFE_PROTOCOL = /^(https?:|mailto:|tel:|sms:|\/|#|\?)/i

/** Normalise a URL setting into anchor attributes, rejecting unsafe protocols. */
export function linkAttrs(value: UrlValue | string | undefined | null): { href: string; target?: string; rel?: string; extra: Record<string, string> } | null {
  const v: UrlValue = typeof value === 'string' ? { url: value } : value ?? {}
  const href = (v.url ?? '').trim()
  if (!href || !SAFE_PROTOCOL.test(href)) return null
  const external = v.is_external === true || v.is_external === 'on'
  const nofollow = v.nofollow === true || v.nofollow === 'on'
  const rel = [external ? 'noopener' : '', nofollow ? 'nofollow' : ''].filter(Boolean).join(' ') || undefined
  const extra: Record<string, string> = {}
  if (typeof v.custom_attributes === 'string') {
    for (const pair of v.custom_attributes.split(',')) {
      const [k, ...rest] = pair.split('|')
      const key = (k ?? '').trim().toLowerCase()
      if (/^[a-z][a-z0-9-]*$/.test(key) && !key.startsWith('on') && !['href', 'style', 'class'].includes(key)) {
        extra[key] = rest.join('|').trim()
      }
    }
  }
  return { href, target: external ? '_blank' : undefined, rel, extra }
}

export const mediaUrl = (m: MediaValue | undefined | null) => (m && typeof m.url === 'string' ? m.url : '')
