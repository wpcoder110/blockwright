import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CORE_TAGS, type Device, type Kit, createRegistry } from '@blockwright/core'
import { ENTRY_TAGS, formElements } from '@blockwright/forms'
import { COMMERCE_TAGS, commerceElements } from '@blockwright/widgets-commerce'
import { type Element, validateLayout } from '@blockwright/schema'
import { basicElements } from '@blockwright/widgets-basic'
import { type CustomWidgetSpec, createCustomWidget } from '@blockwright/renderer'
import { type EditorConfig, saveDocument } from './api'
import { Canvas } from './canvas'
import { type DocMeta, type DragPayload, EditorContext, type EditorApi, type PanelView } from './context'
import { Library, Structure } from './extras'
import { Icon } from './icons'
import { Panel } from './panel'
import { EDITOR_CSS, EXTRA_CSS } from './styles'
import { type History, type Layout, commit, duplicateById, insertAt, moveTo, redo, removeById, setBagValue, setSetting, undo } from './tree'

export type { EditorConfig } from './api'
export * from './tree'

export interface BlockwrightEditorProps {
  config: EditorConfig
  initial: {
    layout: unknown
    title: string
    status?: string
    templateType?: string
    conditions?: string[]
    data?: Record<string, unknown>
  }
  kit: Kit
  site?: { name?: string; url?: string; description?: string }
  /** Widgets built in the admin. */
  customWidgets?: CustomWidgetSpec[]
}

interface Toast {
  id: number
  message: string
  kind: 'info' | 'error' | 'success'
}

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null
  if (!t) return false
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
}

export function BlockwrightEditor({ config, initial, kit, site = {}, customWidgets = [] }: BlockwrightEditorProps) {
  const registry = useMemo(() => {
    const custom = customWidgets.flatMap((s) => {
      try {
        return [createCustomWidget(s)]
      } catch {
        return []
      }
    })
    const base = [...basicElements, ...formElements, ...commerceElements]
    return createRegistry([...base, ...custom.filter((c) => !base.some((b) => b.type === c.type))], [...CORE_TAGS, ...ENTRY_TAGS, ...COMMERCE_TAGS])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [history, setHistory] = useState<History>(() => ({ past: [], present: validateLayout(initial.layout).data ?? [], future: [] }))
  const [savedLayout, setSavedLayout] = useState<Layout>(history.present)
  const [meta, setMetaState] = useState<DocMeta>({ title: initial.title, templateType: initial.templateType, conditions: initial.conditions ?? [] })
  const [savedMeta, setSavedMeta] = useState<DocMeta>(meta)
  const [status, setStatus] = useState(initial.status ?? 'draft')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusField, setFocusField] = useState<string | null>(null)
  const [hoveredId, setHovered] = useState<string | null>(null)
  const [device, setDevice] = useState<Device>('desktop')
  const [panel, setPanel] = useState<PanelView>('widgets')
  const [navOpen, setNavOpen] = useState(false)
  const navLoaded = useRef(false)
  // read the saved state after hydration so server and client markup match
  useEffect(() => {
    try {
      if (localStorage.getItem('bw-editor-structure-open') === '1') setNavOpen(true)
    } catch {
      /* storage unavailable */
    }
    navLoaded.current = true
  }, [])
  useEffect(() => {
    if (!navLoaded.current) return
    try {
      localStorage.setItem('bw-editor-structure-open', navOpen ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }, [navOpen])
  const [library, setLibrary] = useState<{ mode: 'templates' | 'import' | 'export'; saveElementId?: string } | null>(null)
  const [saving, setSaving] = useState<null | 'draft' | 'publish'>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const drag = useRef<DragPayload | null>(null)
  const toastId = useRef(0)

  const layout = history.present
  const dirty = layout !== savedLayout || JSON.stringify(meta) !== JSON.stringify(savedMeta)

  const notify = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId.current
    setToasts((t) => [...t.slice(-2), { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 2800)
  }, [])

  const apply = useCallback((fn: (l: Layout) => Layout, key?: string) => setHistory((h) => commit(h, fn(h.present), key)), [])

  const select = useCallback((id: string | null, field: string | null = null) => {
    setSelectedId(id)
    setFocusField(field)
    setPanel(id ? 'settings' : 'widgets')
  }, [])

  const save = useCallback(
    async (publish: boolean) => {
      setSaving(publish ? 'publish' : 'draft')
      try {
        const data: Record<string, unknown> = { layout, title: meta.title }
        if (config.collection === config.templatesSlug) {
          data.type = meta.templateType
          data.conditions = meta.conditions
        }
        const res = await saveDocument(config, data, publish)
        const saved = validateLayout(res.doc?.layout).data
        setSavedLayout(layout)
        setSavedMeta(meta)
        if (saved && JSON.stringify(saved) !== JSON.stringify(layout)) {
          // the server cleaned something (e.g. unsafe HTML): show what was stored
          setHistory((h) => commit(h, saved))
          setSavedLayout(saved)
        }
        if (config.drafts) setStatus(publish ? 'published' : 'draft')
        notify(publish ? 'Published' : 'Draft saved', 'success')
      } catch (e) {
        notify((e as Error).message, 'error')
      } finally {
        setSaving(null)
      }
    },
    [config, layout, meta, notify],
  )

  const api: EditorApi = useMemo(
    () => ({
      cfg: config,
      registry,
      kit,
      site,
      docData: { ...(initial.data ?? {}), title: meta.title },
      layout,
      meta,
      setMeta: (patch) => setMetaState((m) => ({ ...m, ...patch })),
      selectedId,
      select,
      focusField,
      hoveredId,
      setHovered,
      device,
      setDevice,
      panel,
      setPanel,
      apply,
      insert: (pos, items, selectId) => {
        apply((l) => insertAt(l, pos, items))
        if (selectId) select(selectId)
      },
      move: (id, pos) => apply((l) => moveTo(l, id, pos)),
      remove: (id) => {
        apply((l) => removeById(l, id))
        setSelectedId((s) => (s === id ? null : s))
        setPanel((p) => (p === 'settings' ? 'widgets' : p))
      },
      duplicate: (id) => {
        let newId: string | null = null
        apply((l) => {
          const r = duplicateById(l, id)
          newId = r.newId
          return r.layout
        })
        setTimeout(() => newId && select(newId), 0)
      },
      setSetting: (id, key, value) => apply((l) => setSetting(l, id, key, value), `${id}:${key}`),
      setBag: (id, bag, key, value) => apply((l) => setBagValue(l, id, bag, key, value)),
      undo: () => setHistory(undo),
      redo: () => setHistory(redo),
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      dirty,
      drag,
      notify,
      openLibrary: (mode = 'templates', saveElementId) => setLibrary({ mode, saveElementId }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, registry, kit, site, initial.data, layout, meta, selectedId, focusField, hoveredId, device, panel, history, dirty, apply, select, notify],
  )

  // keyboard shortcuts
  const apiRef = useRef(api)
  apiRef.current = api
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = apiRef.current
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current(false)
        return
      }
      if (mod && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        setNavOpen((o) => !o)
        return
      }
      if (isTyping(document.activeElement)) {
        // Escape leaves the field; a second Escape deselects
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur()
        return
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) a.redo()
        else a.undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        a.redo()
      } else if (mod && e.key.toLowerCase() === 'd' && a.selectedId) {
        e.preventDefault()
        a.duplicate(a.selectedId)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && a.selectedId) {
        e.preventDefault()
        a.remove(a.selectedId)
      } else if (e.key === 'Escape') {
        a.select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const fn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', fn)
    return () => window.removeEventListener('beforeunload', fn)
  }, [dirty])

  const editUrl = `${config.adminRoute}/collections/${config.collection}/${config.id}`
  const devices: Array<[Device, string, () => React.ReactNode]> = [
    ['desktop', 'Desktop', Icon.desktop],
    ['tablet', 'Tablet', Icon.tablet],
    ['mobile', 'Mobile', Icon.mobile],
  ]

  return (
    <EditorContext.Provider value={api}>
      <style>{EDITOR_CSS + EXTRA_CSS}</style>
      <div className="bwe">
        <header className="bwe-top">
          <div className="bwe-brand">
            <a href={editUrl} title="Back to the admin" onClick={(e) => dirty && !window.confirm('Leave the editor? Unsaved changes will be lost.') && e.preventDefault()}>
              {Icon.back()}
            </a>
            <span className="bwe-title" title={meta.title}>
              {meta.title || 'Untitled'}
            </span>
          </div>
          <button type="button" className="bwe-ibtn" aria-pressed={panel === 'widgets'} title="Widgets" onClick={() => setPanel('widgets')}>
            {Icon.grid()}
          </button>
          <button type="button" className="bwe-ibtn" aria-pressed={panel === 'document'} title={config.collection === config.templatesSlug ? 'Template settings' : 'Page settings'} onClick={() => setPanel('document')}>
            {Icon.settings()}
          </button>
          <button type="button" className="bwe-ibtn" aria-pressed={navOpen} title="Structure (Ctrl+I)" onClick={() => setNavOpen((o) => !o)}>
            {Icon.layers()}
          </button>
          <button type="button" className="bwe-ibtn" title="Library: templates, import and export" onClick={() => setLibrary({ mode: 'templates' })}>
            {Icon.library()}
          </button>
          <span className="bwe-spacer" />
          <div className="bwe-devices" role="group" aria-label="Preview device">
            {devices.map(([d, label, icon]) => (
              <button key={d} type="button" className="bwe-ibtn" aria-pressed={device === d} title={label} onClick={() => setDevice(d)}>
                {icon()}
              </button>
            ))}
          </div>
          <span className="bwe-spacer" />
          <button type="button" className="bwe-ibtn" title="Undo (Ctrl+Z)" disabled={!api.canUndo} onClick={api.undo}>
            {Icon.undo()}
          </button>
          <button type="button" className="bwe-ibtn" title="Redo (Ctrl+Shift+Z)" disabled={!api.canRedo} onClick={api.redo}>
            {Icon.redo()}
          </button>
          <span className="bwe-status" aria-live="polite">
            {dirty ? 'Unsaved changes' : config.drafts ? (status === 'published' ? 'Published' : 'Draft') : 'Saved'}
          </span>
          {config.previewUrl ? (
            <a className="bwe-ibtn" href={config.previewUrl} target="_blank" rel="noopener" title="View page">
              {Icon.eye()}
            </a>
          ) : null}
          {config.drafts ? (
            <button type="button" className="bwe-btn bwe-btn-ghost" disabled={!!saving || !dirty} onClick={() => save(false)}>
              {saving === 'draft' ? 'Saving…' : 'Save draft'}
            </button>
          ) : null}
          <button type="button" className="bwe-btn bwe-btn-publish" disabled={!!saving || (!dirty && (!config.drafts || status === 'published'))} onClick={() => save(true)}>
            {saving === 'publish' ? 'Publishing…' : !dirty && (!config.drafts || status === 'published') ? <>{Icon.check()} {config.drafts ? 'Published' : 'Saved'}</> : config.drafts ? 'Publish' : 'Save'}
          </button>
        </header>
        <Panel />
        <Canvas />
        {navOpen ? <Structure onClose={() => setNavOpen(false)} /> : null}
        {library ? <Library mode={library.mode} saveElementId={library.saveElementId} onClose={() => setLibrary(null)} /> : null}
        <div className="bwe-toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`bwe-toast is-${t.kind}`}>
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </EditorContext.Provider>
  )
}

export type { Element }
