/**
 * Minimal, safe template language for custom widgets.
 *
 *   {{ title }}                 escaped value (dotted paths: image.url, link.url)
 *   {{{ content }}}             raw HTML (admin-authored widgets only)
 *   {{#if show_badge}}…{{else}}…{{/if}}
 *   {{#each items}}{{ this.text }} {{ @index }}{{/each}}
 *   {{icon selected_icon}}      inline SVG from the built-in icon set
 *   {{link button_link}}        href/target/rel attributes for an <a>
 */
import { ICONS, resolveIcon } from './icons'

type Scope = Record<string, unknown>

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function lookup(path: string, stack: Scope[]): unknown {
  const p = path.trim()
  if (p === 'this') return stack[stack.length - 1]?.this
  if (p === '@index') return stack[stack.length - 1]?.['@index']
  const parts = p.replace(/^this\./, '\u0000').split('.')
  const fromThis = parts[0]!.startsWith('\u0000')
  if (fromThis) parts[0] = parts[0]!.slice(1)
  const scopes = fromThis ? [stack[stack.length - 1]?.this as Scope] : [...stack].reverse().flatMap((s) => [s.this as Scope, s])
  for (const scope of scopes) {
    if (!scope || typeof scope !== 'object') continue
    if (!(parts[0]! in scope)) continue
    let cur: unknown = scope
    for (const k of parts) {
      if (cur === null || cur === undefined) return undefined
      cur = (cur as Scope)[k]
    }
    return cur
  }
  return undefined
}

const truthy = (v: unknown) => {
  if (Array.isArray(v)) return v.length > 0
  if (v && typeof v === 'object') {
    const o = v as Scope
    if ('url' in o) return !!o.url
    if ('size' in o) return o.size !== '' && o.size !== undefined
    if ('value' in o) return !!o.value
    return Object.keys(o).length > 0
  }
  return !!v && v !== 'no' && v !== 'false'
}

const scalar = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  if (typeof v !== 'object') return String(v)
  const o = v as Scope
  if ('url' in o) return String(o.url ?? '')
  if ('size' in o) return `${o.size ?? ''}${o.unit && o.unit !== 'custom' ? o.unit : ''}`
  return ''
}

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#|\?)/i

function linkAttrsString(v: unknown): string {
  const o = (v && typeof v === 'object' ? v : { url: v }) as Scope
  const url = String(o.url ?? '').trim()
  if (!url || !SAFE_URL.test(url)) return 'href="#"'
  const external = o.is_external === 'on' || o.is_external === true
  const rel = [external ? 'noopener' : '', o.nofollow === 'on' || o.nofollow === true ? 'nofollow' : ''].filter(Boolean).join(' ')
  return `href="${esc(url)}"${external ? ' target="_blank"' : ''}${rel ? ` rel="${rel}"` : ''}`
}

function iconString(v: unknown): string {
  const r = resolveIcon(v)
  if (!r) return ''
  if (r.url) return `<img class="bw-icon" src="${esc(r.url)}" alt="" loading="lazy">`
  return `<svg class="bw-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[r.name!]}</svg>`
}

interface Node {
  kind: 'text' | 'var' | 'raw' | 'if' | 'each' | 'icon' | 'link'
  value: string
  children?: Node[]
  alt?: Node[]
}

const TAG = /\{\{\{\s*([\w.@-]+)\s*\}\}\}|\{\{\s*(#if|#each|\/if|\/each|else|icon|link)?\s*([\w.@-]*)\s*\}\}/g

export function parseTemplate(src: string): Node[] {
  const root: Node[] = []
  const stack: Array<{ node: Node | null; list: Node[] }> = [{ node: null, list: root }]
  let last = 0
  for (const m of src.matchAll(TAG)) {
    const top = stack[stack.length - 1]!
    if (m.index! > last) top.list.push({ kind: 'text', value: src.slice(last, m.index) })
    last = m.index! + m[0].length
    const [, raw, keyword, arg] = m
    if (raw) top.list.push({ kind: 'raw', value: raw })
    else if (keyword === '#if' || keyword === '#each') {
      const node: Node = { kind: keyword === '#if' ? 'if' : 'each', value: arg!, children: [], alt: [] }
      top.list.push(node)
      stack.push({ node, list: node.children! })
    } else if (keyword === 'else') {
      if (top.node?.kind === 'if') top.list = top.node.alt!
    } else if (keyword === '/if' || keyword === '/each') {
      if (stack.length > 1) stack.pop()
    } else if (keyword === 'icon' || keyword === 'link') top.list.push({ kind: keyword, value: arg! })
    else top.list.push({ kind: 'var', value: arg! })
  }
  if (last < src.length) stack[stack.length - 1]!.list.push({ kind: 'text', value: src.slice(last) })
  return root
}

function run(nodes: Node[], stack: Scope[], depth: number): string {
  if (depth > 20) return ''
  let out = ''
  for (const n of nodes) {
    switch (n.kind) {
      case 'text':
        out += n.value
        break
      case 'var':
        out += esc(scalar(lookup(n.value, stack)))
        break
      case 'raw':
        out += scalar(lookup(n.value, stack))
        break
      case 'icon':
        out += iconString(lookup(n.value, stack))
        break
      case 'link':
        out += linkAttrsString(lookup(n.value, stack))
        break
      case 'if':
        out += run(truthy(lookup(n.value, stack)) ? n.children! : n.alt!, stack, depth + 1)
        break
      case 'each': {
        const list = lookup(n.value, stack)
        if (Array.isArray(list)) {
          list.slice(0, 500).forEach((item, i) => {
            out += run(n.children!, [...stack, { this: item, '@index': i }], depth + 1)
          })
        }
        break
      }
    }
  }
  return out
}

const cache = new Map<string, Node[]>()

export function renderTemplate(src: string, data: Scope): string {
  let nodes = cache.get(src)
  if (!nodes) {
    nodes = parseTemplate(src)
    if (cache.size > 200) cache.clear()
    cache.set(src, nodes)
  }
  return run(nodes, [data], 0)
}
