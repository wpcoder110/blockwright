import { type CompiledCss, type Kit, hashString, kitFonts, kitToCss } from '@blockwright/core'

const SYSTEM_FONTS = new Set(
  ['system-ui', 'sans-serif', 'serif', 'monospace', 'arial', 'helvetica', 'georgia', 'times new roman', 'verdana', 'tahoma', 'courier new', 'inherit'].map((s) => s.toLowerCase()),
)

export function googleFontsHref(families: string[]): string | null {
  const list = [...new Set(families.map((f) => f.trim()).filter((f) => f && !SYSTEM_FONTS.has(f.toLowerCase())))].sort()
  if (!list.length) return null
  const q = list.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700`).join('&')
  return `https://fonts.googleapis.com/css2?${q}&display=swap`
}

/**
 * Emits kit variables, per-type base CSS and the layout CSS. Uses React 19
 * stylesheet hoisting (`href` + `precedence`), so styles land in <head>,
 * are de-duplicated across header/content/footer and never block hydration.
 */
export function BlockwrightStyles({ compiled, kit, includeKit = true }: { compiled: CompiledCss; kit: Kit; includeKit?: boolean }) {
  const kitCss = includeKit ? kitToCss(kit) : ''
  const fontsHref = kit.fontProvider === 'google' ? googleFontsHref([...kitFonts(kit), ...compiled.fonts]) : null
  return (
    <>
      {fontsHref ? (
        <>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="stylesheet" href={fontsHref} precedence="bw-fonts" />
        </>
      ) : null}
      {kitCss ? (
        <style href={`bw-kit-${hashString(kitCss)}`} precedence="bw-base">
          {kitCss}
        </style>
      ) : null}
      {Object.entries(compiled.base).map(([key, css]) => (
        <style key={key} href={`bw-base-${key.replace(/[^a-z0-9-]/gi, '-')}-${hashString(css)}`} precedence="bw-base">
          {css}
        </style>
      ))}
      {compiled.css ? (
        <style href={`bw-doc-${hashString(compiled.css)}`} precedence="bw-doc">
          {compiled.css}
        </style>
      ) : null}
    </>
  )
}
