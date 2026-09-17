import { type Element, parseTagString } from '@blockwright/schema'
import type { PreparedElement, RenderContext } from './context'
import { type FlatControl, elementTypeOf, getDefinitionDefaults } from './widget'
import { toMedia } from './dynamic'

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const baseName = (key: string, controls: Map<string, FlatControl>): FlatControl | undefined => {
  const direct = controls.get(key)
  if (direct) return direct
  const m = /^(.*)_(widescreen|laptop|tablet_extra|tablet|mobile_extra|mobile)$/.exec(key)
  return m ? controls.get(m[1]!) : undefined
}

/** Resolve `__dynamic__` references into concrete setting values. */
export async function resolveDynamicSettings(
  settings: Record<string, unknown>,
  controls: FlatControl[],
  ctx: RenderContext,
): Promise<Record<string, unknown>> {
  const dyn = settings.__dynamic__
  if (!dyn || typeof dyn !== 'object') return settings
  const byName = new Map(controls.map((c) => [c.name, c]))
  const out: Record<string, unknown> = { ...settings }
  await Promise.all(
    Object.entries(dyn as Record<string, unknown>).map(async ([key, tagString]) => {
      const ref = parseTagString(tagString)
      if (!ref) return
      const tag = ctx.registry.tag(ref.name)
      if (!tag) return
      let value: unknown
      try {
        value = await tag.resolve(ctx, ref.settings)
      } catch {
        value = undefined
      }
      const control = baseName(key, byName)
      const kind = control?.type
      const s = ref.settings
      if (kind === 'media') {
        const media = toMedia(value)
        out[key] = media ?? (s.fallback ? { url: String(s.fallback) } : out[key])
        return
      }
      if (kind === 'url') {
        const existing = (out[key] && typeof out[key] === 'object' ? out[key] : {}) as Record<string, unknown>
        const u = typeof value === 'string' ? value : toMedia(value)?.url
        out[key] = { ...existing, url: u || (s.fallback ? String(s.fallback) : existing.url ?? '') }
        return
      }
      let str = value === undefined || value === null ? '' : typeof value === 'object' ? toMedia(value)?.url ?? '' : String(value)
      if (!str && s.fallback) str = String(s.fallback)
      if (str) str = `${s.before ?? ''}${str}${s.after ?? ''}`
      if (kind === 'wysiwyg' && !tag.returns.includes('html')) str = escapeHtml(str)
      out[key] = str
    }),
  )
  return out
}

/**
 * Resolve defaults, dynamic values and widget data for a whole layout.
 * Rendering afterwards is synchronous, so the same output works in React
 * Server Components, SSR, static export and the editor canvas.
 */
export async function prepareLayout(layout: Element[], ctx: RenderContext): Promise<PreparedElement[]> {
  const prepareOne = async (el: Element): Promise<PreparedElement> => {
    const type = elementTypeOf(el)
    const def = ctx.registry.get(type)
    const childrenP = Promise.all((el.elements ?? []).map(prepareOne))
    if (!def) {
      return { element: el, type, settings: el.settings ?? {}, children: await childrenP, missing: true }
    }
    const controls = ctx.registry.controls(def)
    let settings: Record<string, unknown> = { ...getDefinitionDefaults(def, controls), ...(el.settings ?? {}) }
    settings = await resolveDynamicSettings(settings, controls, ctx)
    const [data, children] = await Promise.all([
      def.prepare ? Promise.resolve(def.prepare(settings, ctx, el)).catch(() => undefined) : undefined,
      childrenP,
    ])
    return { element: el, type: def.type, settings, data, children }
  }
  return Promise.all(layout.map(prepareOne))
}
