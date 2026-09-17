/**
 * Dynamic tag strings stored under `settings.__dynamic__[key]`.
 * Format: [bw-tag id="abc" name="doc-title" settings="%7B%7D"]
 * The equivalent `[elementor-tag ...]` format is accepted on read.
 */
export interface DynamicTagRef {
  id: string
  name: string
  settings: Record<string, unknown>
}

const TAG_RE = /\[(?:bw|elementor)-tag\s+([^\]]*)\]/
const ATTR_RE = /(\w+)="([^"]*)"/g

export function parseTagString(input: unknown): DynamicTagRef | null {
  if (typeof input !== 'string') return null
  const match = TAG_RE.exec(input)
  if (!match) return null
  const attrs: Record<string, string> = {}
  for (const m of match[1]!.matchAll(ATTR_RE)) attrs[m[1]!] = m[2]!
  if (!attrs.name) return null
  let settings: Record<string, unknown> = {}
  if (attrs.settings) {
    try {
      const parsed = JSON.parse(decodeURIComponent(attrs.settings))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) settings = parsed
    } catch {
      settings = {}
    }
  }
  return { id: attrs.id ?? '', name: attrs.name, settings }
}

export function buildTagString(ref: DynamicTagRef): string {
  const settings = encodeURIComponent(JSON.stringify(ref.settings ?? {}))
  return `[bw-tag id="${ref.id}" name="${ref.name}" settings="${settings}"]`
}

/** Parse `globals/colors?id=primary` → { group: 'colors', id: 'primary' } */
export function parseGlobalRef(input: unknown): { group: string; id: string } | null {
  if (typeof input !== 'string') return null
  const m = /^globals\/([a-z_-]+)\?id=([A-Za-z0-9_-]+)$/.exec(input.trim())
  return m ? { group: m[1]!, id: m[2]! } : null
}
