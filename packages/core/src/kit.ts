import { parseGlobalRef, type SliderValue } from '@blockwright/schema'
import { type Breakpoints, DEFAULT_BREAKPOINTS } from './breakpoints'

export interface KitColor {
  id: string
  title: string
  color: string
}

export interface KitTypography {
  id: string
  title: string
  fontFamily?: string
  fontSize?: number | SliderValue
  fontWeight?: string
  lineHeight?: number | SliderValue
  letterSpacing?: number | SliderValue
  textTransform?: string
}

export interface Kit {
  colors: KitColor[]
  typography: KitTypography[]
  /** Content width of boxed frames, in px. */
  containerWidth: number
  /** Default gap between elements inside frames, in px. */
  elementGap: number
  breakpoints: Breakpoints
  /** Where web fonts are loaded from. */
  fontProvider: 'google' | 'none'
  customCss?: string
}

export const DEFAULT_KIT: Kit = {
  colors: [
    { id: 'primary', title: 'Primary', color: '#1d3557' },
    { id: 'secondary', title: 'Secondary', color: '#457b9d' },
    { id: 'text', title: 'Text', color: '#2b2d42' },
    { id: 'accent', title: 'Accent', color: '#e63946' },
  ],
  typography: [
    { id: 'primary', title: 'Primary', fontFamily: 'Inter', fontWeight: '600' },
    { id: 'secondary', title: 'Secondary', fontFamily: 'Inter', fontWeight: '400' },
    { id: 'text', title: 'Text', fontFamily: 'Inter', fontWeight: '400' },
    { id: 'accent', title: 'Accent', fontFamily: 'Inter', fontWeight: '500' },
  ],
  containerWidth: 1140,
  elementGap: 20,
  breakpoints: DEFAULT_BREAKPOINTS,
  fontProvider: 'google',
}

const cssIdent = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '')

export const colorVar = (id: string) => `var(--bw-c-${cssIdent(id)})`
export const typoVar = (id: string, prop: string) => `var(--bw-t-${cssIdent(id)}-${prop})`

const len = (v: number | SliderValue | undefined, unit = 'px'): string | null => {
  if (v === undefined || v === null || v === ('' as unknown)) return null
  if (typeof v === 'number') return `${v}${unit}`
  if (v.size === '' || v.size === undefined) return null
  return `${v.size}${v.unit ?? unit}`
}

export const TYPO_PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform'] as const

/** CSS custom properties for the kit, placed on :root. */
export function kitToCss(kit: Kit): string {
  const decl: string[] = []
  for (const c of kit.colors) if (c.color) decl.push(`--bw-c-${cssIdent(c.id)}:${sanitizeCssValue(c.color)}`)
  for (const t of kit.typography) {
    const id = cssIdent(t.id)
    if (t.fontFamily) decl.push(`--bw-t-${id}-font-family:"${sanitizeCssValue(t.fontFamily)}",system-ui,sans-serif`)
    const fs = len(t.fontSize)
    if (fs) decl.push(`--bw-t-${id}-font-size:${fs}`)
    if (t.fontWeight) decl.push(`--bw-t-${id}-font-weight:${sanitizeCssValue(t.fontWeight)}`)
    const lh = typeof t.lineHeight === 'number' ? String(t.lineHeight) : len(t.lineHeight, 'em')
    if (lh) decl.push(`--bw-t-${id}-line-height:${lh}`)
    const ls = len(t.letterSpacing)
    if (ls) decl.push(`--bw-t-${id}-letter-spacing:${ls}`)
    if (t.textTransform) decl.push(`--bw-t-${id}-text-transform:${sanitizeCssValue(t.textTransform)}`)
  }
  decl.push(`--bw-container:${Number(kit.containerWidth) || 1140}px`)
  decl.push(`--bw-gap:${Number(kit.elementGap ?? 20)}px`)
  let css = `:root{${decl.join(';')}}`
  if (kit.customCss) css += sanitizeCustomCss(kit.customCss)
  return css
}

/** Resolve a `globals/…` reference to a CSS value. */
export function resolveGlobalColor(ref: unknown): string | null {
  const g = parseGlobalRef(ref)
  if (!g || g.group !== 'colors') return null
  return colorVar(g.id)
}

const TYPO_FIELDS: Record<(typeof TYPO_PROPS)[number], keyof KitTypography> = {
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'line-height': 'lineHeight',
  'letter-spacing': 'letterSpacing',
  'text-transform': 'textTransform',
}

/** Declarations for a global typography reference. Only properties the kit defines are emitted. */
export function resolveGlobalTypography(ref: unknown, kit?: Kit): string[] | null {
  const g = parseGlobalRef(ref)
  if (!g || g.group !== 'typography') return null
  const entry = kit?.typography.find((t) => t.id === g.id)
  const props = TYPO_PROPS.filter((p) => {
    if (!kit) return true
    const v = entry?.[TYPO_FIELDS[p]]
    return v !== undefined && v !== null && v !== ''
  })
  return props.map((p) => `${p}:${typoVar(g.id, p)}`)
}

/** Strip characters that could break out of a declaration. */
export function sanitizeCssValue(value: string): string {
  return String(value).replace(/[;{}<>]/g, '').replace(/\/\*|\*\//g, '').trim()
}

/** Custom CSS is admin-only; still make sure it cannot close the <style> tag. */
export function sanitizeCustomCss(css: string): string {
  return String(css).replace(/<\/?style[^>]*>/gi, '').replace(/<\/?script[^>]*>/gi, '')
}

/** Collect font families used by the kit, for font loading. */
export function kitFonts(kit: Kit): string[] {
  return kit.typography.map((t) => t.fontFamily).filter((f): f is string => !!f)
}
