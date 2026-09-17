import sanitizeHtml from 'sanitize-html'
import type { Control, Registry } from '@blockwright/core'
import { type Element, walk } from '@blockwright/schema'

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'small', 'mark', 'code', 'pre', 'kbd',
    'blockquote', 'q', 'cite', 'abbr', 'a', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'figure', 'figcaption', 'picture', 'source',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'title', 'lang', 'dir', 'style', 'aria-label', 'aria-hidden', 'role'],
    a: ['href', 'target', 'rel', 'name'],
    img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
    source: ['srcset', 'sizes', 'media', 'type'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    ol: ['start', 'reversed', 'type'],
  },
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^hsla?\([\d\s.,%deg]+\)$/i, /^var\(--[\w-]+\)$/, /^[a-z]+$/i],
      'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^var\(--[\w-]+\)$/, /^[a-z]+$/i],
      'text-align': [/^(left|right|center|justify|start|end)$/],
      'font-weight': [/^(normal|bold|[1-9]00)$/],
      'font-style': [/^(normal|italic)$/],
      'text-decoration': [/^(none|underline|line-through)$/],
      'font-size': [/^\d+(\.\d+)?(px|em|rem|%)$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        const rel = new Set((attribs.rel ?? '').split(/\s+/).filter(Boolean))
        rel.add('noopener')
        attribs.rel = [...rel].join(' ')
      }
      return { tagName, attribs }
    },
  },
}

export const cleanHtml = (html: string) => sanitizeHtml(html, OPTIONS)

type Settings = Record<string, unknown>

const isHtmlControl = (c: Control) => c.type === 'wysiwyg' || (c.type === 'code' && c.language === 'html' && !c.restricted)

function sanitizeRepeater(items: unknown, fields: Control[]): unknown {
  if (!Array.isArray(items)) return items
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item
    const next: Settings = { ...(item as Settings) }
    for (const f of fields) {
      if (isHtmlControl(f) && typeof next[f.name] === 'string') next[f.name] = cleanHtml(next[f.name] as string)
    }
    return next
  })
}

/**
 * Clean user-supplied HTML in a layout and protect restricted settings
 * (raw HTML, custom CSS) from users without the unfiltered-HTML capability.
 */
export function sanitizeLayout(layout: Element[], previous: Element[] | null | undefined, registry: Registry, canUnfiltered: boolean): Element[] {
  const prevSettings = new Map<string, Settings>()
  if (Array.isArray(previous)) walk(previous, (el) => void prevSettings.set(el.id, el.settings ?? {}))

  const visit = (el: Element): Element => {
    const def = registry.getForElement(el)
    const settings: Settings = { ...(el.settings ?? {}) }
    if (def) {
      for (const c of registry.controls(def)) {
        const keys = Object.keys(settings).filter((k) => k === c.name || k.startsWith(`${c.name}_`))
        for (const key of keys) {
          if (key !== c.name && !/_(widescreen|laptop|tablet_extra|tablet|mobile_extra|mobile)$/.test(key)) continue
          const value = settings[key]
          if (c.restricted && !canUnfiltered) {
            const old = prevSettings.get(el.id)?.[key]
            if (old === undefined) delete settings[key]
            else settings[key] = old
            continue
          }
          if (isHtmlControl(c) && typeof value === 'string') settings[key] = cleanHtml(value)
          if (c.type === 'repeater' && c.fields) settings[key] = sanitizeRepeater(value, c.fields)
        }
      }
    }
    return { ...el, settings, elements: (el.elements ?? []).map(visit) } as Element
  }
  return layout.map(visit)
}
