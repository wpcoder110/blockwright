import { type Breakpoints, DEFAULT_BREAKPOINTS, type Device, activeDevices, isEmptyValue, mediaQuery, responsiveKey } from './breakpoints'
import { evaluateCondition } from './condition'
import type { PreparedElement } from './context'
import { type Kit, resolveGlobalColor, resolveGlobalTypography, sanitizeCssValue, sanitizeCustomCss } from './kit'
import type { Registry } from './registry'
import { ANIMATIONS, CORE_BASE_CSS, animationCss, visibilityCss } from './advanced'
import type { FlatControl } from './widget'

export const wrapperClass = (id: string) => `bw-el-${id}`

const TOKEN_RE = /\{\{(?:([A-Za-z0-9_]+)\.)?([A-Z_]+)\}\}/g

type Settings = Record<string, unknown>

const minifySelector = (s: string) => s.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim()

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  const ka = Object.keys(a as object).filter((k) => k !== 'sizes')
  const kb = Object.keys(b as object).filter((k) => k !== 'sizes')
  if (ka.length !== kb.length) return false
  return ka.every((k) => deepEqual((a as Settings)[k], (b as Settings)[k]))
}

const num = (v: unknown): string | null => {
  if (v === '' || v === undefined || v === null) return null
  const s = sanitizeCssValue(String(v))
  return s === '' ? null : s
}

function tokenValue(token: string, value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'object') {
    if (token === 'VALUE' || token === 'SIZE') return num(value)
    if (token === 'UNIT') return ''
    return null
  }
  const o = value as Settings
  switch (token) {
    case 'VALUE':
      return 'size' in o ? num(o.size) : 'url' in o ? num(o.url) : null
    case 'SIZE':
      return num(o.size)
    case 'UNIT': {
      const u = String(o.unit ?? 'px')
      return u === 'custom' ? '' : sanitizeCssValue(u)
    }
    case 'TOP':
    case 'RIGHT':
    case 'BOTTOM':
    case 'LEFT': {
      const v = o[token.toLowerCase()]
      return v === '' || v === undefined || v === null ? '0' : num(v)
    }
    case 'URL':
      return typeof o.url === 'string' && o.url ? encodeURI(decodeURI(o.url)).replace(/["\\)]/g, '') : null
    case 'COLUMN':
    case 'ROW': {
      const v = o[token.toLowerCase()] ?? o.size
      return num(v)
    }
    default:
      return num(o[token.toLowerCase()])
  }
}

function readSetting(settings: Settings, key: string, device: Device): unknown {
  const globals = (settings.__globals__ ?? {}) as Settings
  const k = responsiveKey(key, device)
  const g = resolveGlobalColor(globals[k]) ?? (k !== key ? resolveGlobalColor(globals[key]) : null)
  if (g) return g
  const v = settings[k]
  return isEmptyValue(v) && k !== key ? settings[key] : v
}

/** Substitute placeholders in a declaration template. Returns null when a value is missing. */
export function substitute(
  template: string,
  value: unknown,
  settings: Settings,
  device: Device,
  trustedValue?: string,
): string | null {
  let missing = false
  const out = template.replace(TOKEN_RE, (_m, ref: string | undefined, token: string) => {
    if (ref) {
      const refValue = readSetting(settings, ref, device)
      // an explicitly empty referenced value (e.g. shadow position "outline") is valid
      if (refValue === '') return ''
      const v = tokenValue(token, refValue)
      if (v === null) missing = true
      return v ?? ''
    }
    if (trustedValue !== undefined && token === 'VALUE') return trustedValue
    const v = tokenValue(token, value)
    if (v === null) missing = true
    return v ?? ''
  })
  return missing ? null : out
}

interface Rule {
  device: Device
  selector: string
  decl: string
}

const minifyDecl = (d: string) =>
  d
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const i = p.indexOf(':')
      return i === -1 ? p : `${p.slice(0, i).trim()}:${p.slice(i + 1).trim()}`
    })

export interface CompileOptions {
  registry: Registry
  kit: Kit
}

export interface CompiledCss {
  /** CSS for the elements of this layout. */
  css: string
  /** Base CSS for the element types used (shared, dedupe by type). */
  base: Record<string, string>
  /** Font families referenced by element settings. */
  fonts: string[]
}

function elementRules(p: PreparedElement, controls: FlatControl[], devices: Device[], rules: Rule[], fonts: Set<string>, kit: Kit) {
  const settings = p.settings
  const globals = (settings.__globals__ ?? {}) as Settings
  const wrapper = `.${wrapperClass(p.element.id)}`
  for (const c of controls) {
    if (!c.selectors) continue
    if (!evaluateCondition(c.sectionCondition, settings) || !evaluateCondition(c.condition, settings)) continue
    const devs = c.responsive ? devices : (['desktop'] as Device[])
    for (const device of devs) {
      const key = responsiveKey(c.name, device)
      const gRef = globals[key]
      if (c.global === 'typography') {
        const decls = gRef ? resolveGlobalTypography(gRef, kit) : null
        if (decls) {
          for (const sel of Object.keys(c.selectors)) {
            rules.push({ device, selector: minifySelector(sel.replaceAll('{{WRAPPER}}', wrapper)), decl: decls.join(';') })
          }
        }
        continue
      }
      let value: unknown = settings[key]
      let trusted: string | undefined
      if (gRef && c.global === 'colors') {
        const resolved = resolveGlobalColor(gRef)
        if (resolved) {
          value = resolved
          trusted = resolved
        }
      }
      if (isEmptyValue(value)) continue
      if (device === 'desktop' && !gRef && !c.cssDefault && c.default !== undefined && deepEqual(value, c.default)) continue
      if (c.selectorsDictionary && typeof value === 'string' && value in c.selectorsDictionary) {
        trusted = c.selectorsDictionary[value]
      }
      if (c.type === 'font' && typeof value === 'string') fonts.add(value)
      for (const [selTpl, declTpl] of Object.entries(c.selectors)) {
        if (!declTpl) continue
        const decl = substitute(declTpl, value, settings, device, trusted)
        if (!decl) continue
        rules.push({ device, selector: minifySelector(selTpl.replaceAll('{{WRAPPER}}', wrapper)), decl })
      }
    }
  }
  const custom = settings.custom_css
  if (typeof custom === 'string' && custom.trim()) {
    rules.push({ device: 'desktop', selector: '', decl: sanitizeCustomCss(custom).replace(/\bselector\b/g, wrapper) })
  }
}

/** Compile the CSS for a prepared layout. */
export function compileCss(layout: PreparedElement[], { registry, kit }: CompileOptions): CompiledCss {
  const bp: Breakpoints = kit.breakpoints ?? DEFAULT_BREAKPOINTS
  const devices = activeDevices(bp)
  const rules: Rule[] = []
  const fonts = new Set<string>()
  const base: Record<string, string> = { core: CORE_BASE_CSS }
  const anims = new Set<string>()
  const hides = new Set<'desktop' | 'tablet' | 'mobile'>()

  const visit = (p: PreparedElement) => {
    const def = p.missing ? undefined : registry.get(p.type)
    if (def) {
      if (def.baseCss && !base[def.type]) base[def.type] = def.baseCss
      elementRules(p, registry.controls(def), devices, rules, fonts, kit)
      const anim = p.settings._animation
      if (typeof anim === 'string' && (ANIMATIONS as readonly string[]).includes(anim)) anims.add(anim)
      for (const d of ['desktop', 'tablet', 'mobile'] as const) if (p.settings[`hide_${d}`]) hides.add(d)
    }
    p.children.forEach(visit)
  }
  layout.forEach(visit)

  if (anims.size) base['anim:' + [...anims].sort().join(',')] = animationCss(anims)
  if (hides.size) base['hide:' + [...hides].sort().join(',')] = visibilityCss(hides, bp)

  return { css: stringifyRules(rules, bp, devices), base, fonts: [...fonts] }
}

function stringifyRules(rules: Rule[], bp: Breakpoints, devices: Device[]): string {
  const byDevice = new Map<Device, Map<string, string[]>>()
  const raw: string[] = []
  for (const r of rules) {
    if (!r.selector) {
      raw.push(r.decl)
      continue
    }
    let m = byDevice.get(r.device)
    if (!m) byDevice.set(r.device, (m = new Map()))
    const list = m.get(r.selector) ?? []
    for (const d of minifyDecl(r.decl)) {
      // identical declarations are dropped; otherwise order is kept so later values win
      if (!list.includes(d)) list.push(d)
    }
    m.set(r.selector, list)
  }
  let out = ''
  for (const device of devices) {
    const m = byDevice.get(device)
    if (!m) continue
    const body = [...m.entries()].map(([sel, decls]) => `${sel}{${decls.join(';')}}`).join('')
    const mq = mediaQuery(device, bp)
    out += mq ? `@media ${mq}{${body}}` : body
  }
  return out + raw.join('')
}

/** Small, fast, stable string hash (FNV-1a) for cache keys and style hrefs. */
export function hashString(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}
