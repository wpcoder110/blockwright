import { validateLayout } from '@blockwright/schema'
import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'
import { sanitizeLayout } from './sanitize'
import type { BlockwrightRuntime } from './types'
import { getRegistry } from './runtime'
import { invalidateBlockwrightCache } from './cache'

export const LAYOUT_FIELD = 'layout'

/** Sidebar button that opens the visual editor. */
export function editButtonField(): Field {
  return {
    name: 'blockwrightEdit',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: { Field: '@blockwright/payload-plugin/rsc#EditWithBlockwright' },
    },
  }
}

export function layoutField(): Field {
  return {
    name: LAYOUT_FIELD,
    type: 'json',
    label: 'Layout data (advanced)',
    admin: {
      description: 'Created by the visual editor. Use "Edit with Blockwright" instead of changing this by hand.',
    },
    validate: (value: unknown) => {
      if (value === null || value === undefined || value === '') return true
      const res = validateLayout(value)
      return res.success ? true : `Invalid layout: ${res.errors.slice(0, 3).join('; ')}`
    },
  }
}

/** Normalise, de-duplicate ids and sanitise the layout before it is stored. */
export function layoutBeforeChange(rt: BlockwrightRuntime, fieldName = LAYOUT_FIELD): CollectionBeforeChangeHook {
  return async ({ data, originalDoc, req }) => {
    if (!data || !(fieldName in data)) return data
    const raw = data[fieldName]
    if (raw === null || raw === undefined || raw === '') {
      data[fieldName] = []
      return data
    }
    const res = validateLayout(raw)
    if (!res.success) return data
    const registry = await getRegistry(req.payload).catch(() => rt.registry)
    data[fieldName] = sanitizeLayout(res.data!, originalDoc?.[fieldName], registry, rt.options.canUseUnfilteredHtml(req))
    return data
  }
}

/** Add the layout field and hooks to an existing collection. */
export function withLayout(collection: CollectionConfig, rt: BlockwrightRuntime): CollectionConfig {
  const hasField = collection.fields.some((f) => 'name' in f && f.name === LAYOUT_FIELD)
  const onChange = rt.options.onChange
  return {
    ...collection,
    fields: hasField ? collection.fields : [editButtonField(), ...collection.fields, layoutField()],
    hooks: {
      ...collection.hooks,
      beforeChange: [...(collection.hooks?.beforeChange ?? []), layoutBeforeChange(rt)],
      afterChange: [
        ...(collection.hooks?.afterChange ?? []),
        // menus link to these documents, so their URLs may have changed
        () => invalidateBlockwrightCache(),
        ...(onChange ? [async ({ doc }: { doc: Record<string, unknown> }) => void (await onChange({ collection: collection.slug, doc }))] : []),
      ],
    },
    custom: { ...collection.custom, blockwright: true },
  }
}
