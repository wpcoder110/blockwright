import { createContext, type MutableRefObject, useContext } from 'react'
import type { Device, Kit, Registry } from '@blockwright/core'
import type { Element } from '@blockwright/schema'
import type { EditorConfig } from './api'
import type { Layout, Position } from './tree'

export type DragPayload = { kind: 'new'; type: string } | { kind: 'move'; id: string }

export type PanelView = 'widgets' | 'settings' | 'document'

export interface DocMeta {
  title: string
  templateType?: string
  conditions?: string[]
}

export interface EditorApi {
  cfg: EditorConfig
  registry: Registry
  kit: Kit
  docData: Record<string, unknown>
  site: { name?: string; url?: string; description?: string }
  layout: Layout
  meta: DocMeta
  setMeta: (patch: Partial<DocMeta>) => void
  selectedId: string | null
  select: (id: string | null, focusField?: string | null) => void
  focusField: string | null
  hoveredId: string | null
  setHovered: (id: string | null) => void
  device: Device
  setDevice: (d: Device) => void
  panel: PanelView
  setPanel: (p: PanelView) => void
  apply: (fn: (l: Layout) => Layout, mergeKey?: string) => void
  insert: (pos: Position, items: Element[], selectId?: string) => void
  move: (id: string, pos: Position) => void
  remove: (id: string) => void
  duplicate: (id: string) => void
  setSetting: (id: string, key: string, value: unknown) => void
  setBag: (id: string, bag: '__dynamic__' | '__globals__', key: string, value: string | undefined) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  dirty: boolean
  drag: MutableRefObject<DragPayload | null>
  notify: (message: string, kind?: 'info' | 'error' | 'success') => void
  openLibrary: (mode?: 'templates' | 'import' | 'export', saveElementId?: string) => void
}

export const EditorContext = createContext<EditorApi | null>(null)

export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside the Blockwright editor')
  return ctx
}
