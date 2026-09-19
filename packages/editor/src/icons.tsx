import { ICONS } from '@blockwright/renderer'
import type { ReactNode } from 'react'

const svg = (children: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

export const Icon = {
  frame: () => svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /></>),
  heading: () => svg(<><path d="M6 4v16M18 4v16M6 12h12" /></>),
  text: () => svg(<><path d="M4 6h16M4 10h16M4 14h10M4 18h13" /></>),
  button: () => svg(<><rect x="3" y="7" width="18" height="10" rx="5" /><path d="M9 12h6" /></>),
  image: () => svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 17-5-5-9 8" /></>),
  spacer: () => svg(<><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" /></>),
  divider: () => svg(<><path d="M3 12h18" /><path d="M8 7h8M8 17h8" opacity=".4" /></>),
  code: () => svg(<><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></>),
  form: () => svg(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 8h10M7 12h10M7 16h5" /></>),
  widget: () => svg(<rect x="4" y="4" width="16" height="16" rx="2" />),
  plus: () => svg(<path d="M12 5v14M5 12h14" />, 16),
  trash: () => svg(<><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>, 15),
  copy: () => svg(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>, 15),
  move: () => svg(<><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" /></>, 15),
  up: () => svg(<path d="m6 15 6-6 6 6" />, 15),
  down: () => svg(<path d="m6 9 6 6 6-6" />, 15),
  undo: () => svg(<><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></>),
  redo: () => svg(<><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></>),
  desktop: () => svg(<><rect x="3" y="4" width="18" height="12" rx="1" /><path d="M8 20h8M12 16v4" /></>),
  tablet: () => svg(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M11 18h2" /></>),
  mobile: () => svg(<><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>),
  layers: () => svg(<><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>),
  grid: () => svg(<><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></>),
  settings: () => svg(<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" /></>),
  library: () => svg(<><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="m16 5 3.5-1 3 15.5-3.5 1z" /></>),
  eye: () => svg(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  close: () => svg(<path d="M6 6l12 12M18 6 6 18" />, 16),
  link: () => svg(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>, 14),
  globe: () => svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>, 14),
  bolt: () => svg(<path d="M13 2 4 14h7l-1 8 9-12h-7z" />, 14),
  back: () => svg(<path d="m15 18-6-6 6-6" />),
  parent: () => svg(<><path d="M9 14 4 9l5-5" /><path d="M4 9h9a7 7 0 0 1 7 7v4" /></>, 15),
  save: () => svg(<><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7M8 21v-7h8v7" /></>, 15),
  check: () => svg(<path d="m5 12 5 5L20 7" />, 15),
  upload: () => svg(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>),
  download: () => svg(<><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 16v4h16v-4" /></>),
  file: () => svg(<><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></>),
  search: () => svg(<><circle cx="11" cy="11" r="7" /><path d="m21 21-5-5" /></>, 16),
}

export const WIDGET_ICONS: Record<string, () => ReactNode> = {
  container: Icon.frame,
  heading: Icon.heading,
  'text-editor': Icon.text,
  button: Icon.button,
  image: Icon.image,
  spacer: Icon.spacer,
  divider: Icon.divider,
  html: Icon.code,
  form: Icon.form,
  'product-grid': () => svg(<><path d="M3 4h2l2.2 10h10L20 7H6" /><circle cx="9" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>),
  cart: () => svg(<><path d="M3 4h2l2.2 10h10L20 7H6" /><circle cx="9" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>),
  'cart-count': () => svg(<><path d="M3 4h2l2.2 10h10L20 7H6" /><circle cx="9" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>),
  'add-to-cart': () => svg(<><path d="M3 4h2l2.2 10h10L20 7H6" /><path d="M12 6v5M9.5 8.5h5" /><circle cx="9" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>),
  checkout: () => svg(<><path d="M3 4h2l2.2 10h10L20 7H6" /><path d="m9.5 8.5 2 2 3.5-3.5" /><circle cx="9" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>),
  'product-price': () => svg(<><path d="M3 12V3h9l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.5" /></>),
  'nav-menu': () => svg(<><path d="M3 6h18M3 12h18M3 18h18" /></>),
  icon: () => svg(<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />),
  'icon-box': () => svg(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m12 6 1.5 3 3 .5-2.2 2 .6 3L12 13l-2.9 1.5.6-3-2.2-2 3-.5zM7 18h10" /></>),
  'image-box': () => svg(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M6 6h12v7H6zM6 17h12" /></>),
  'icon-list': () => svg(<><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" /></>),
  'social-icons': () => svg(<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></>),
  alert: () => svg(<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></>),
  video: () => svg(<><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M10 9v6l5-3z" /></>),
  'image-gallery': () => svg(<><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>),
  google_maps: () => svg(<><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>),
  tabs: () => svg(<><path d="M3 8h18v12H3z" /><path d="M3 8V5h6v3M9 5h6v3" /></>),
  accordion: () => svg(<><rect x="3" y="4" width="18" height="5" rx="1" /><rect x="3" y="11" width="18" height="9" rx="1" /><path d="m15 6 1.5 1L18 6" /></>),
  testimonial: () => svg(<><path d="M4 4h16v12H9l-5 4z" /><path d="M8 9h1.5M13 9h1.5" /></>),
  counter: () => svg(<><path d="M4 7h3v10M11 8a2.5 2.5 0 1 1 4 2l-4 7h5M19 7h1" /></>),
  progress: () => svg(<><rect x="2" y="9" width="20" height="6" rx="3" /><path d="M4 12h9" strokeWidth="3" /></>),
  'star-rating': () => svg(<><path d="m7 9 1.2 2.4 2.6.4-1.9 1.8.5 2.6L7 15l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4zM17 9l1.2 2.4 2.6.4-1.9 1.8.5 2.6L17 15l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" /></>),
}

export const widgetIcon = (type: string, iconName?: string) => {
  const own = WIDGET_ICONS[type]
  if (own) return own()
  if (iconName && ICONS[iconName]) {
    return (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[iconName]! }} />
    )
  }
  return Icon.widget()
}
