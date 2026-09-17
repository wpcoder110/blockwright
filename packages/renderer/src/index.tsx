import type { ReactNode } from 'react'
import { type CompiledCss, type PreparedElement, type RenderContext, compileCss, prepareLayout } from '@blockwright/core'
import type { Element } from '@blockwright/schema'
import { RenderElements } from './render'
import { BlockwrightStyles } from './styles'

export * from './render'
export * from './styles'
export * from './primitives'

export interface RenderedLayout {
  prepared: PreparedElement[]
  compiled: CompiledCss
}

/** Resolve data and compile CSS for a layout (async step). */
export async function buildLayout(layout: Element[] | null | undefined, ctx: RenderContext): Promise<RenderedLayout> {
  const prepared = await prepareLayout(Array.isArray(layout) ? layout : [], ctx)
  const compiled = compileCss(prepared, { registry: ctx.registry, kit: ctx.kit })
  return { prepared, compiled }
}

export interface BlockwrightProps {
  built: RenderedLayout
  ctx: RenderContext
  /** Wrapper tag, e.g. `main`, `header`, `footer`. */
  as?: 'div' | 'main' | 'header' | 'footer' | 'section' | 'article' | 'aside'
  className?: string
  includeKit?: boolean
}

/** Synchronous render of an already-built layout. */
export function Blockwright({ built, ctx, as: Tag = 'div', className, includeKit = true }: BlockwrightProps): ReactNode {
  if (!built.prepared.length) return null
  return (
    <>
      <BlockwrightStyles compiled={built.compiled} kit={ctx.kit} includeKit={includeKit} />
      <Tag className={['bw-content', className].filter(Boolean).join(' ')}>
        <RenderElements items={built.prepared} ctx={ctx} />
      </Tag>
    </>
  )
}

/** Async Server Component: build + render in one step. */
export async function BlockwrightLayout(props: Omit<BlockwrightProps, 'built'> & { layout: Element[] | null | undefined }) {
  const built = await buildLayout(props.layout, props.ctx)
  return <Blockwright {...props} built={built} />
}
export * from './icons'
export * from './template'
export * from './custom'
