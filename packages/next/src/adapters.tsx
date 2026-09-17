import NextImage from 'next/image'
import NextLink from 'next/link'
import type { ImageProps, LinkProps } from '@blockwright/renderer'

/** next/image with Blockwright's performance defaults. */
const UNOPTIMIZED = /\.(svg|gif|avif)(\?|$)/i

/** Same-site absolute URLs become paths so Next.js can optimise them without extra config. */
export function toLocalSrc(src: string, serverURL?: string | null): string {
  if (!/^https?:\/\//i.test(src)) return src
  if (serverURL && src.startsWith(serverURL.replace(/\/$/, ''))) return src.slice(serverURL.replace(/\/$/, '').length) || '/'
  return src
}

export interface NextImageOptions {
  /** `serverURL` from the Payload config, used to shorten absolute media URLs. */
  serverURL?: string | null
}

/** Creates the image adapter with the site URL baked in. */
export function createNextImage(opts: NextImageOptions = {}) {
  function Image(props: ImageProps) {
    return <BlockwrightNextImage {...props} src={toLocalSrc(props.src, opts.serverURL)} />
  }
  return Image
}

export function BlockwrightNextImage({ priority, src, alt, width, height, className, sizes, style }: ImageProps) {
  // remote images need images.remotePatterns, so serve them directly instead of breaking
  const remote = /^https?:\/\//i.test(src)
  // vector and animated formats are served as-is; Next.js cannot resize them usefully
  if (remote || !width || !height || UNOPTIMIZED.test(src)) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        sizes={sizes}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
      />
    )
  }
  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      // without `sizes`, Next.js builds a 1x/2x srcset from the real image size
      sizes={sizes}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
    />
  )
}

/** next/link for internal URLs (client-side navigation and prefetching). */
export function BlockwrightNextLink({ href, children, ...rest }: LinkProps) {
  return (
    <NextLink href={href} {...(rest as Record<string, unknown>)}>
      {children}
    </NextLink>
  )
}
