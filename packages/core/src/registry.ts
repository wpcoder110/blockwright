import type { Element } from '@blockwright/schema'
import type { Section } from './controls'
import { type DynamicTagDefinition, CORE_TAGS } from './dynamic'
import { advancedSections, containerAdvancedSections } from './advanced'
import { type ElementDefinition, type FlatControl, elementTypeOf, flattenControls } from './widget'

export interface Category {
  id: string
  title: string
  icon?: string
}

/** Widget categories shown in the editor panel. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'layout', title: 'Layout' },
  { id: 'essentials', title: 'Essentials' },
  { id: 'media', title: 'Media' },
  { id: 'forms', title: 'Forms' },
  { id: 'interactive', title: 'Interactive' },
  { id: 'marketing', title: 'Marketing' },
  { id: 'site', title: 'Site' },
  { id: 'commerce', title: 'Commerce' },
  { id: 'advanced', title: 'Advanced' },
  { id: 'custom', title: 'Custom' },
]

export interface Registry {
  register(def: ElementDefinition): void
  registerTag(tag: DynamicTagDefinition): void
  get(type: string): ElementDefinition | undefined
  getForElement(el: Element): ElementDefinition | undefined
  /** All controls for a definition, including the shared Advanced tab. */
  controls(def: ElementDefinition): FlatControl[]
  all(): ElementDefinition[]
  categories(): Category[]
  addCategory(cat: Category): void
  tag(name: string): DynamicTagDefinition | undefined
  tags(): DynamicTagDefinition[]
}

export function createRegistry(defs: ElementDefinition[] = [], tags: DynamicTagDefinition[] = CORE_TAGS): Registry {
  const map = new Map<string, ElementDefinition>()
  const aliasMap = new Map<string, string>()
  const tagMap = new Map<string, DynamicTagDefinition>()
  const cats: Category[] = [...DEFAULT_CATEGORIES]
  const controlCache = new Map<ElementDefinition, FlatControl[]>()

  const registry: Registry = {
    register(def) {
      map.set(def.type, def)
      for (const a of def.aliases ?? []) aliasMap.set(a, def.type)
      controlCache.delete(def)
    },
    registerTag(tag) {
      tagMap.set(tag.name, tag)
      for (const a of tag.aliases ?? []) tagMap.set(a, tag)
    },
    get(type) {
      return map.get(type) ?? map.get(aliasMap.get(type) ?? '')
    },
    getForElement(el) {
      return registry.get(elementTypeOf(el))
    },
    controls(def) {
      let c = controlCache.get(def)
      if (!c) {
        const extra: Section[] =
          def.advanced === false ? [] : def.elType === 'container' ? containerAdvancedSections : advancedSections
        c = flattenControls(def, extra)
        controlCache.set(def, c)
      }
      return c
    },
    all: () => [...map.values()],
    categories: () => cats,
    addCategory(cat) {
      if (!cats.some((c) => c.id === cat.id)) cats.push(cat)
    },
    tag: (name) => tagMap.get(name),
    tags: () => [...new Set(tagMap.values())],
  }
  defs.forEach((d) => registry.register(d))
  tags.forEach((t) => registry.registerTag(t))
  return registry
}
