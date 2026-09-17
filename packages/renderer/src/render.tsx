import type { ComponentType, ReactNode } from 'react'
import type { PreparedElement, RenderContext, RenderProps } from '@blockwright/core'
import { wrapperProps } from '@blockwright/core'

export function RenderElements({ items, ctx }: { items: PreparedElement[]; ctx: RenderContext }) {
  return (
    <>
      {items.map((p) => (
        <RenderElement key={p.element.id} prepared={p} ctx={ctx} />
      ))}
    </>
  )
}

export function RenderElement({ prepared, ctx }: { prepared: PreparedElement; ctx: RenderContext }): ReactNode {
  const def = prepared.missing ? undefined : ctx.registry.get(prepared.type)
  if (!def) {
    if (ctx.mode === 'live') return null
    return (
      <div className="bw-missing" data-bw-id={prepared.element.id}>
        Unknown element: {prepared.type}
      </div>
    )
  }
  const children = prepared.children.length ? <RenderElements items={prepared.children} ctx={ctx} /> : null
  const wrapper = wrapperProps(prepared, def, ctx)
  const Comp = def.render as ComponentType<RenderProps>
  const inner = (
    <Comp
      element={prepared.element}
      settings={prepared.settings}
      data={prepared.data}
      ctx={ctx}
      wrapper={wrapper}
      prepared={prepared}
    >
      {children}
    </Comp>
  )
  if (def.wrapper === false) return inner
  const { className, ...attrs } = wrapper
  return (
    <div className={className} {...(attrs as Record<string, unknown>)}>
      {inner}
    </div>
  )
}
