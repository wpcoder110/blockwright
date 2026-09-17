/**
 * Tiny process-wide cache for templates and the site style. Hooks bump the
 * version whenever a template or the kit changes. Stored on globalThis so the
 * Payload config and the Next.js app share it even if modules load twice.
 */
const KEY = Symbol.for('blockwright.cache')

interface Store {
  version: number
  entries: Map<string, { version: number; value: Promise<unknown> }>
}

const store = (): Store => {
  const g = globalThis as unknown as Record<symbol, Store | undefined>
  if (!g[KEY]) g[KEY] = { version: 0, entries: new Map() }
  return g[KEY]!
}

export function invalidateBlockwrightCache() {
  const s = store()
  s.version++
  s.entries.clear()
}

export function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const s = store()
  const hit = s.entries.get(key)
  if (hit && hit.version === s.version) return hit.value as Promise<T>
  const value = load().catch((err) => {
    s.entries.delete(key)
    throw err
  })
  s.entries.set(key, { version: s.version, value })
  return value
}
