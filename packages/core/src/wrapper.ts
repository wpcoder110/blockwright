import type { PreparedElement, RenderContext } from './context'
import { wrapperClass } from './css'
import type { ElementDefinition, WrapperProps } from './widget'

const clean = (s: unknown) =>
  typeof s === 'string'
    ? s
        .split(/\s+/)
        .map((c) => c.replace(/[^A-Za-z0-9_-]/g, ''))
        .filter(Boolean)
    : []

/** Class names and attributes shared by every element wrapper. */
export function wrapperProps(p: PreparedElement, def: ElementDefinition | undefined, ctx: RenderContext, extra: string[] = []): WrapperProps {
  const s = p.settings
  const classes = ['bw-el', wrapperClass(p.element.id)]
  if (def) classes.push(def.elType === 'container' ? 'bw-frame' : `bw-w-${def.type}`)
  classes.push(...extra)
  classes.push(...clean(def?.elType === 'container' ? s.css_classes : s._css_classes))
  if (typeof s._animation === 'string' && s._animation) {
    classes.push(`bw-anim-${s._animation}`)
    if (s.animation_duration === 'fast' || s.animation_duration === 'slow') classes.push(`bw-anim-${s.animation_duration}`)
  }
  for (const d of ['desktop', 'tablet', 'mobile']) if (s[`hide_${d}`]) classes.push(`bw-hide-${d}`)
  const props: WrapperProps = { className: classes.join(' ') }
  const id = clean(s._element_id)[0]
  if (id) props.id = id
  if (ctx.mode === 'edit') {
    props['data-bw-id'] = p.element.id
    props['data-bw-type'] = p.type
  }
  return props
}
