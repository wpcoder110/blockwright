export type Device = 'desktop' | 'widescreen' | 'laptop' | 'tablet_extra' | 'tablet' | 'mobile_extra' | 'mobile'

export interface BreakpointConfig {
  /** Pixel value: max-width for smaller devices, min-width for widescreen. */
  value: number
  enabled: boolean
  label: string
}

export type Breakpoints = Record<Exclude<Device, 'desktop'>, BreakpointConfig>

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  widescreen: { value: 2400, enabled: false, label: 'Widescreen' },
  laptop: { value: 1366, enabled: false, label: 'Laptop' },
  tablet_extra: { value: 1200, enabled: false, label: 'Tablet extra' },
  tablet: { value: 1024, enabled: true, label: 'Tablet' },
  mobile_extra: { value: 880, enabled: false, label: 'Mobile extra' },
  mobile: { value: 767, enabled: true, label: 'Mobile' },
}

/** Devices in cascade order: desktop first, then smaller max-width devices, widescreen last. */
export const DEVICE_ORDER: Device[] = ['desktop', 'laptop', 'tablet_extra', 'tablet', 'mobile_extra', 'mobile', 'widescreen']

export function activeDevices(bp: Breakpoints = DEFAULT_BREAKPOINTS): Device[] {
  return DEVICE_ORDER.filter((d) => d === 'desktop' || bp[d as Exclude<Device, 'desktop'>]?.enabled)
}

export function mediaQuery(device: Device, bp: Breakpoints = DEFAULT_BREAKPOINTS): string | null {
  if (device === 'desktop') return null
  const cfg = bp[device]
  if (!cfg) return null
  return device === 'widescreen' ? `(min-width:${cfg.value}px)` : `(max-width:${cfg.value}px)`
}

export function responsiveKey(name: string, device: Device): string {
  return device === 'desktop' ? name : `${name}_${device}`
}

/**
 * Read a responsive value with inheritance: mobile falls back to
 * mobile_extra → tablet → … → desktop, like the editor shows it.
 */
export function getResponsiveValue(
  settings: Record<string, unknown>,
  name: string,
  device: Device,
  bp: Breakpoints = DEFAULT_BREAKPOINTS,
): unknown {
  if (device === 'widescreen') {
    const v = settings[responsiveKey(name, 'widescreen')]
    return isEmptyValue(v) ? settings[name] : v
  }
  const chain = DEVICE_ORDER.filter((d) => d !== 'widescreen')
  const start = chain.indexOf(device)
  for (let i = start; i >= 0; i--) {
    const d = chain[i]!
    if (d !== 'desktop' && !bp[d as Exclude<Device, 'desktop'>]?.enabled) continue
    const v = settings[responsiveKey(name, d)]
    if (!isEmptyValue(v)) return v
  }
  return undefined
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if ('size' in o && !('url' in o)) return o.size === '' || o.size === undefined || o.size === null
    if ('top' in o || 'right' in o || 'bottom' in o || 'left' in o) {
      return ['top', 'right', 'bottom', 'left'].every((k) => o[k] === '' || o[k] === undefined || o[k] === null)
    }
    if ('url' in o) return !o.url
    if ('column' in o || 'row' in o) return (o.column === '' || o.column == null) && (o.row === '' || o.row == null)
    return Object.keys(o).length === 0
  }
  return false
}
