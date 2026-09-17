import NextImage from 'next/image'
import NextLink from 'next/link'
import type { ImageProps, LinkProps } from '@blockwright/renderer'

/** next/image with Blockwright's performance defaults. */
export function BlockwrightNextImage({ priority, src, alt, width, height, className, sizes, style }: ImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes ?? '(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 1140px'}
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
