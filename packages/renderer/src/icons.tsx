import type { CSSProperties } from 'react'

/**
 * Built-in icon set: 24×24, stroke-based, drawn for Blockwright.
 * Values are the inner SVG markup.
 */
export const ICONS: Record<string, string> = {
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-down': '<path d="m5 9 7 7 7-7"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
  'star-outline': '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  'map-pin': '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>',
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  cart: '<path d="M3 4h2l2.4 11h11L21 7H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  wallet: '<path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4z"/><path d="M4 6a2 2 0 0 1 2-2h10v2M20 11h-4a2 2 0 0 0 0 4h4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  gift: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  'play-circle': '<circle cx="12" cy="12" r="9"/><path d="M10 8v8l6-4z" fill="currentColor"/>',
  camera: '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
  message: '<path d="M4 4h16v12H8l-4 4z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.5"/>',
  quote: '<path d="M4 18v-5a5 5 0 0 1 5-5M4 13h5v5H4zM14 18v-5a5 5 0 0 1 5-5M14 13h5v5h-5z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  leaf: '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z"/><path d="M5 19 13 11"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
  'thumbs-up': '<path d="M7 11v10H3V11zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 21H7"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  rocket: '<path d="M5 15c-1 1-1.5 4-1.5 5.5C5 20.5 8 20 9 19"/><path d="M9 15l-3-3c1-5 5-9 12-9 0 7-4 11-9 12z"/><circle cx="14" cy="10" r="1.5"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.5"/>',
  x: '<path d="M4 4l16 16M20 4 4 20"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.5M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9v6l5-3z" fill="currentColor"/>',
  whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3a5 5 0 0 0 5 5"/>',
  github: '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-1-2.5c3 0 6-1.5 6-6.5a5 5 0 0 0-1.3-3.5 4.5 4.5 0 0 0-.2-3.5s-1.1-.3-3.5 1.3a12 12 0 0 0-6 0C6.6 1.2 5.5 1.5 5.5 1.5a4.5 4.5 0 0 0-.2 3.5A5 5 0 0 0 4 8.5c0 5 3 6.5 6 6.5a3 3 0 0 0-1 2.5V21"/>',
  pinterest: '<circle cx="12" cy="12" r="9"/><path d="M10 21l2-8M10.5 14.5c.5 1 1.5 1.5 2.5 1.5 2.5 0 4-2 4-4.5A5 5 0 0 0 12 7a5 5 0 0 0-5 5c0 1 .3 2 1 2.5"/>',
}

/** Common Font Awesome names from imported templates → built-in icons. */
const FA_MAP: Record<string, string> = {
  'fa-arrow-right': 'arrow-right', 'fa-arrow-left': 'arrow-left', 'fa-arrow-up': 'arrow-up', 'fa-arrow-down': 'arrow-down',
  'fa-chevron-right': 'chevron-right', 'fa-angle-right': 'chevron-right', 'fa-chevron-down': 'chevron-down', 'fa-angle-down': 'chevron-down',
  'fa-check': 'check', 'fa-check-circle': 'check-circle', 'fa-circle-check': 'check-circle', 'fa-times': 'close', 'fa-xmark': 'close',
  'fa-plus': 'plus', 'fa-minus': 'minus', 'fa-star': 'star', 'fa-heart': 'heart', 'fa-phone': 'phone', 'fa-phone-alt': 'phone',
  'fa-envelope': 'mail', 'fa-map-marker-alt': 'map-pin', 'fa-map-marker': 'map-pin', 'fa-location-dot': 'map-pin', 'fa-clock': 'clock',
  'fa-calendar': 'calendar', 'fa-calendar-alt': 'calendar', 'fa-user': 'user', 'fa-users': 'users', 'fa-home': 'home', 'fa-house': 'home',
  'fa-search': 'search', 'fa-shopping-cart': 'cart', 'fa-cart-shopping': 'cart', 'fa-shopping-bag': 'bag', 'fa-truck': 'truck',
  'fa-credit-card': 'credit-card', 'fa-wallet': 'wallet', 'fa-shield-alt': 'shield', 'fa-lock': 'lock', 'fa-gift': 'gift', 'fa-tag': 'tag',
  'fa-globe': 'globe', 'fa-link': 'link', 'fa-download': 'download', 'fa-play': 'play', 'fa-play-circle': 'play-circle', 'fa-camera': 'camera',
  'fa-image': 'image', 'fa-comment': 'message', 'fa-comments': 'message', 'fa-bell': 'bell', 'fa-cog': 'settings', 'fa-info-circle': 'info',
  'fa-exclamation-triangle': 'alert', 'fa-question-circle': 'help', 'fa-quote-left': 'quote', 'fa-bolt': 'bolt', 'fa-leaf': 'leaf',
  'fa-sun': 'sun', 'fa-award': 'award', 'fa-thumbs-up': 'thumbs-up', 'fa-chart-bar': 'chart', 'fa-rocket': 'rocket',
  'fa-facebook': 'facebook', 'fa-facebook-f': 'facebook', 'fa-instagram': 'instagram', 'fa-twitter': 'x', 'fa-x-twitter': 'x',
  'fa-linkedin': 'linkedin', 'fa-linkedin-in': 'linkedin', 'fa-youtube': 'youtube', 'fa-whatsapp': 'whatsapp', 'fa-tiktok': 'tiktok',
  'fa-github': 'github', 'fa-pinterest': 'pinterest', 'fa-pinterest-p': 'pinterest',
}

export interface IconValue {
  value?: string | { url?: string; id?: string | number }
  library?: string
}

/** Resolve an icon setting to a built-in icon name or an SVG URL. */
export function resolveIcon(v: unknown): { name?: string; url?: string } | null {
  if (!v) return null
  if (typeof v === 'string') return resolveIcon({ value: v })
  const iv = v as IconValue
  if (iv.library === 'svg' && iv.value && typeof iv.value === 'object') return iv.value.url ? { url: iv.value.url } : null
  if (typeof iv.value !== 'string' || !iv.value) return null
  const raw = iv.value.trim()
  if (raw.startsWith('bw-') && ICONS[raw.slice(3)]) return { name: raw.slice(3) }
  if (ICONS[raw]) return { name: raw }
  const fa = raw.split(/\s+/).find((c) => c.startsWith('fa-') && FA_MAP[c])
  return fa ? { name: FA_MAP[fa] } : null
}

export function BwIcon({ icon, className, style, label }: { icon: unknown; className?: string; style?: CSSProperties; label?: string }) {
  const r = resolveIcon(icon)
  if (!r) return null
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }
  if (r.url) return <img src={r.url} alt={label ?? ''} className={['bw-icon', className].filter(Boolean).join(' ')} style={style} loading="lazy" decoding="async" />
  return (
    <svg
      className={['bw-icon', className].filter(Boolean).join(' ')}
      style={style}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
      dangerouslySetInnerHTML={{ __html: ICONS[r.name!]! }}
    />
  )
}

export const ICON_BASE_CSS = '.bw-icon{display:inline-block;width:1em;height:1em;flex:none;vertical-align:-.125em}'
