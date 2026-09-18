import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Element, cloneWithNewIds, parseConditions, parseTemplateEnvelope } from '@blockwright/schema'
import { type TemplateSummary, createTemplate, downloadJson, getTemplate, listTemplates } from './api'
import { LayoutPreview } from './preview'
import { useEditor } from './context'
import { Icon, widgetIcon } from './icons'
import { findElementById, findWithParent, isDescendant } from './tree'
import { countElements } from '@blockwright/schema'

/* ------------------------------------------------------------------ */
/* Display conditions                                                  */
/* ------------------------------------------------------------------ */

const RULES = [
  { value: 'general', label: 'Entire site' },
  { value: 'front_page', label: 'Front page' },
  { value: 'singular', label: 'All single documents' },
  { value: 'singular/*', label: 'All documents in a collection' },
  { value: 'singular/*/id', label: 'A specific document' },
  { value: 'archive', label: 'All archives' },
  { value: 'archive/*', label: 'A collection archive' },
  { value: 'archive/search', label: 'Search results' },
  { value: 'not_found404', label: '404 page' },
]

interface Row {
  mode: 'include' | 'exclude'
  rule: string
  collection: string
  id: string
}

function toRow(s: string, fallbackCollection: string): Row {
  const c = parseConditions([s])[0]
  if (!c) return { mode: 'include', rule: 'general', collection: fallbackCollection, id: '' }
  const [a, b] = c.args
  if (c.name === 'singular' && a && b) return { mode: c.mode, rule: 'singular/*/id', collection: a, id: b }
  if (c.name === 'singular' && a) return { mode: c.mode, rule: 'singular/*', collection: a, id: '' }
  if (c.name === 'archive' && a === 'search') return { mode: c.mode, rule: 'archive/search', collection: fallbackCollection, id: '' }
  if (c.name === 'archive' && a) return { mode: c.mode, rule: 'archive/*', collection: a, id: '' }
  return { mode: c.mode, rule: c.name, collection: fallbackCollection, id: '' }
}

function fromRow(r: Row): string {
  const rule = r.rule.replace('/*/id', `/${r.collection}/${r.id || '0'}`).replace('/*', `/${r.collection}`)
  return `${r.mode}/${rule}`
}

export function ConditionsEditor() {
  const ed = useEditor()
  const collections = ed.cfg.collections.length ? ed.cfg.collections : ['pages']
  const rows = (ed.meta.conditions ?? []).map((s) => toRow(s, collections[0]!))
  const put = (next: Row[]) => ed.setMeta({ conditions: next.map(fromRow) })
  const setRow = (i: number, patch: Partial<Row>) => put(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)))
  return (
    <div className="bwe-field">
      <span className="bwe-label">Display conditions</span>
      <p className="bwe-desc">Choose where this template appears. Exclusions win over inclusions.</p>
      {rows.map((r, i) => (
        <div className="bwe-rule" key={i}>
          <select className="bwe-select" value={r.mode} onChange={(e) => setRow(i, { mode: e.target.value as Row['mode'] })} aria-label="Include or exclude">
            <option value="include">Include</option>
            <option value="exclude">Exclude</option>
          </select>
          <select className="bwe-select" value={r.rule} onChange={(e) => setRow(i, { rule: e.target.value })} aria-label="Where">
            {RULES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="bwe-wide">
            {r.rule.includes('*') ? (
              <select className="bwe-select" value={r.collection} onChange={(e) => setRow(i, { collection: e.target.value })} aria-label="Collection">
                {collections.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : null}
            {r.rule.endsWith('/id') ? <input className="bwe-input" placeholder="Document ID" value={r.id} onChange={(e) => setRow(i, { id: e.target.value.replace(/[^A-Za-z0-9_-]/g, '') })} /> : null}
            <span style={{ flex: 1 }} />
            <button type="button" className="bwe-mini" title="Remove condition" onClick={() => put(rows.filter((_, n) => n !== i))}>
              {Icon.trash()}
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => put([...rows, { mode: 'include', rule: 'general', collection: collections[0]!, id: '' }])}>
        {Icon.plus()} Add condition
      </button>
      {!rows.length ? <p className="bwe-desc">No conditions yet, so this template is not shown anywhere.</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Structure panel                                                     */
/* ------------------------------------------------------------------ */

type DropSpot = { id: string; where: 'before' | 'after' | 'inside' } | null
const STRUCTURE_KEY = 'bw-editor-structure'

export function Structure({ onClose }: { onClose: () => void }) {
  const ed = useEditor()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [spot, setSpot] = useState<DropSpot>(null)
  const dragId = useRef<string | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number; w: number; h: number }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STRUCTURE_KEY) ?? '')
      if (saved && typeof saved.x === 'number') return saved
    } catch {
      /* first use */
    }
    return { x: Math.max(340, window.innerWidth - 320), y: 64, w: 290, h: Math.min(560, window.innerHeight - 90) }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STRUCTURE_KEY, JSON.stringify(pos))
    } catch {
      /* storage unavailable */
    }
  }, [pos])

  // remember size after the user resizes the panel
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setPos((p) => (Math.abs(p.w - r.width) > 2 || Math.abs(p.h - r.height) > 2 ? { ...p, w: r.width, h: r.height } : p))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const startMove = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const sx = e.clientX - pos.x
    const sy = e.clientY - pos.y
    const move = (ev: PointerEvent) =>
      setPos((p) => ({ ...p, x: Math.min(Math.max(0, ev.clientX - sx), window.innerWidth - 120), y: Math.min(Math.max(48, ev.clientY - sy), window.innerHeight - 40) }))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // reveal the selected element
  useEffect(() => {
    if (!ed.selectedId) return
    const path = findWithParent(ed.layout, ed.selectedId)
    if (!path) return
    setCollapsed((c) => {
      const next = { ...c }
      let changed = false
      let cur = path.parent
      while (cur) {
        if (next[cur.id]) {
          next[cur.id] = false
          changed = true
        }
        cur = findWithParent(ed.layout, cur.id)?.parent ?? null
      }
      return changed ? next : c
    })
    requestAnimationFrame(() => panelRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' }))
  }, [ed.selectedId, ed.layout])

  const describe = useCallback(
    (el: Element) => {
      const type = el.elType === 'widget' ? String((el as { widgetType?: string }).widgetType) : 'container'
      const def = ed.registry.get(type)
      const s = el.settings ?? {}
      const raw = [s.title, s.text, s.form_name, s.title_text, s.alert_title, s.html_tag !== 'div' ? s.html_tag : ''].find((v) => typeof v === 'string' && v)
      const hint = typeof raw === 'string' ? raw.replace(/<[^>]+>/g, '').slice(0, 32) : ''
      return { type, title: def?.title ?? type, hint }
    },
    [ed.registry],
  )

  const onDragOver = (e: React.DragEvent, el: Element) => {
    const from = dragId.current
    if (!from || from === el.id || isDescendant(ed.layout, from, el.id)) return
    e.preventDefault()
    e.stopPropagation()
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - r.top
    const frame = el.elType === 'container'
    const where: 'before' | 'after' | 'inside' = frame && y > r.height * 0.3 && y < r.height * 0.7 ? 'inside' : y < r.height / 2 ? 'before' : 'after'
    setSpot((s) => (s?.id === el.id && s.where === where ? s : { id: el.id, where }))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragId.current
    const target = spot
    dragId.current = null
    setSpot(null)
    if (!from || !target) return
    if (target.where === 'inside') {
      const t = findWithParent(ed.layout, target.id)
      ed.move(from, { parentId: target.id, index: t?.el.elements.length ?? 0 })
      setCollapsed((c) => ({ ...c, [target.id]: false }))
      return
    }
    const t = findWithParent(ed.layout, target.id)
    if (!t) return
    ed.move(from, { parentId: t.parent?.id ?? null, index: t.index + (target.where === 'after' ? 1 : 0) })
  }

  const allIds = useMemo(() => {
    const ids: string[] = []
    const walk = (list: Element[]) => list.forEach((el) => el.elements?.length && (ids.push(el.id), walk(el.elements)))
    walk(ed.layout)
    return ids
  }, [ed.layout])

  const render = (list: Element[], depth: number) => (
    <ul role={depth ? 'group' : 'tree'} aria-label={depth ? undefined : 'Page structure'}>
      {list.map((el) => {
        const { type, title, hint } = describe(el)
        const kids = el.elements?.length ?? 0
        const closed = !!collapsed[el.id]
        const mark = spot?.id === el.id ? spot.where : null
        return (
          <li key={el.id} role="treeitem" aria-expanded={kids ? !closed : undefined} aria-selected={ed.selectedId === el.id}>
            <div
              className={`bwe-tree-row${mark ? ` is-drop-${mark}` : ''}`}
              style={{ paddingLeft: 4 + depth * 16 }}
              aria-current={ed.selectedId === el.id}
              draggable
              onDragStart={(e) => {
                dragId.current = el.id
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', el.id)
              }}
              onDragEnd={() => {
                dragId.current = null
                setSpot(null)
              }}
              onDragOver={(e) => onDragOver(e, el)}
              onDrop={onDrop}
              onClick={() => ed.select(el.id)}
              onMouseEnter={() => ed.setHovered(el.id)}
              onMouseLeave={() => ed.setHovered(null)}
            >
              {kids ? (
                <button
                  type="button"
                  className="bwe-tree-toggle"
                  aria-label={closed ? 'Expand' : 'Collapse'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCollapsed((c) => ({ ...c, [el.id]: !closed }))
                  }}
                >
                  <span style={{ display: 'flex', transform: closed ? 'rotate(-90deg)' : undefined }}>{Icon.down()}</span>
                </button>
              ) : (
                <span className="bwe-tree-toggle" />
              )}
              <span className="bwe-tree-icon">{widgetIcon(type)}</span>
              <span className="bwe-tree-title">
                {title}
                {hint ? <em> {hint}</em> : null}
              </span>
              {kids ? <span className="bwe-tree-count">{kids}</span> : null}
            </div>
            {kids && !closed ? render(el.elements, depth + 1) : null}
          </li>
        )
      })}
    </ul>
  )

  return (
    <section
      ref={panelRef}
      className="bwe-structure"
      aria-label="Structure"
      style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setSpot(null)}
    >
      <header onPointerDown={startMove}>
        <span className="bwe-structure-grip">{Icon.move()}</span>
        <h2>Structure</h2>
        <span className="bwe-badge">{countElements(ed.layout)}</span>
        <button type="button" className="bwe-mini" title="Expand all" onClick={() => setCollapsed({})}>
          {Icon.down()}
        </button>
        <button type="button" className="bwe-mini" title="Collapse all" onClick={() => setCollapsed(Object.fromEntries(allIds.map((id) => [id, true])))}>
          {Icon.up()}
        </button>
        <button type="button" className="bwe-mini" title="Close (Ctrl+I)" onClick={onClose}>
          {Icon.close()}
        </button>
      </header>
      <div className="bwe-structure-body">
        {ed.layout.length ? render(ed.layout, 0) : <p className="bwe-empty">The page is empty. Drag widgets onto the canvas to start.</p>}
      </div>
      <footer>Drag rows to reorder. Drop on the middle of a frame to move inside it.</footer>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

const TYPE_FILTERS: Array<[string, string, string[] | null]> = [
  ['all', 'All', null],
  ['section', 'Sections', ['section', 'container']],
  ['page', 'Pages', ['page', 'single', 'single-page', 'single-post']],
  ['header', 'Headers', ['header']],
  ['footer', 'Footers', ['footer']],
  ['other', 'Other', ['archive', 'search-results', 'error-404', 'popup', 'pdf', 'email']],
]
const KNOWN_TYPES = ['header', 'footer', 'single', 'single-page', 'single-post', 'archive', 'search-results', 'error-404', 'section', 'page', 'popup', 'pdf']
const typeLabel = (t: string) => ({ 'error-404': '404', 'single-page': 'Single page', 'single-post': 'Single post', 'search-results': 'Search', pdf: 'PDF' })[t] ?? t.charAt(0).toUpperCase() + t.slice(1)

function useTemplateLayout(id: string | number | null) {
  const ed = useEditor()
  const [layout, setLayout] = useState<Element[] | null>(null)
  useEffect(() => {
    if (id === null) return
    let cancelled = false
    setLayout(null)
    getTemplate(ed.cfg, id)
      .then((d) => !cancelled && setLayout(Array.isArray(d.layout) ? (d.layout as Element[]) : []))
      .catch(() => !cancelled && setLayout([]))
    return () => {
      cancelled = true
    }
  }, [id, ed.cfg])
  return layout
}

function TemplateCard({ t, onPreview, onInsert, busy }: { t: TemplateSummary; onPreview: () => void; onInsert: () => void; busy: boolean }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: '100px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const layout = useTemplateLayout(visible ? t.id : null)
  return (
    <div className="bwe-card" ref={ref}>
      <button type="button" className="bwe-card-thumb" onClick={onPreview} aria-label={`Preview ${t.title}`}>
        {layout ? layout.length ? <LayoutPreview layout={layout} width={1200} fit height={760} /> : <span>Empty</span> : <span className="bwe-skeleton" />}
      </button>
      <div className="bwe-card-meta">
        <div>
          <strong title={t.title}>{t.title}</strong>
          <span>
            {typeLabel(t.type)}
            {t.updatedAt ? ` · ${new Date(t.updatedAt).toLocaleDateString()}` : ''}
          </span>
        </div>
        <button type="button" className="bwe-btn bwe-btn-sm bwe-btn-primary" disabled={busy} onClick={onInsert}>
          Insert
        </button>
      </div>
    </div>
  )
}

export function Library({ mode, saveElementId, onClose }: { mode: 'templates' | 'import' | 'export'; saveElementId?: string; onClose: () => void }) {
  const ed = useEditor()
  const [tab, setTab] = useState(mode)
  const [items, setItems] = useState<TemplateSummary[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [previewId, setPreviewId] = useState<TemplateSummary | null>(null)
  const [saving, setSaving] = useState<null | { scope: 'element' | 'page' }>(saveElementId ? { scope: 'element' } : null)
  const saveEl = saveElementId ? findElementById(ed.layout, saveElementId) : null
  const selectedEl = findElementById(ed.layout, ed.selectedId)
  const previewLayout = useTemplateLayout(previewId?.id ?? null)

  const reload = useCallback(() => {
    setItems(null)
    listTemplates(ed.cfg)
      .then((docs) => setItems(docs.filter((d) => !(ed.cfg.collection === ed.cfg.templatesSlug && String(d.id) === String(ed.cfg.id)))))
      .catch((e: Error) => {
        setItems([])
        ed.notify(e.message, 'error')
      })
  }, [ed])

  useEffect(() => {
    if (tab === 'templates' && items === null) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (previewId ? setPreviewId(null) : onClose())
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewId, onClose])

  const filtered = useMemo(() => {
    const types = TYPE_FILTERS.find((f) => f[0] === filter)?.[2]
    const term = q.trim().toLowerCase()
    return (items ?? []).filter((t) => (!types || types.includes(t.type)) && (!term || t.title.toLowerCase().includes(term)))
  }, [items, filter, q])

  const insertLayout = (layout: Element[], label: string) => {
    const copies = layout.map((el) => cloneWithNewIds(el))
    if (!copies.length) {
      ed.notify('This template is empty.', 'error')
      return
    }
    const sel = ed.selectedId ? findWithParent(ed.layout, ed.selectedId) : null
    // top-level sections go after the selected section, otherwise at the end
    const topId = sel ? (findWithParent(ed.layout, ed.selectedId!)?.parent ? null : sel.el.id) : null
    const index = topId ? ed.layout.findIndex((e) => e.id === topId) + 1 : ed.layout.length
    ed.insert({ parentId: null, index }, copies, copies[0]?.id)
    ed.notify(`Inserted “${label}”`, 'success')
    onClose()
  }

  const insertTemplate = async (t: TemplateSummary) => {
    setBusy(true)
    try {
      const doc = await getTemplate(ed.cfg, t.id)
      insertLayout(Array.isArray(doc.layout) ? (doc.layout as Element[]) : [], t.title)
    } catch (e) {
      ed.notify((e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const tabs: Array<[typeof tab, string, () => React.ReactNode]> = [
    ['templates', 'Templates', Icon.library],
    ['import', 'Import', Icon.upload],
    ['export', 'Export', Icon.download],
  ]

  return (
    <div className="bwe-modal-back" role="dialog" aria-modal="true" aria-label="Library" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bwe-modal bwe-library">
        <nav className="bwe-lib-nav" aria-label="Library sections">
          <div className="bwe-lib-brand">Library</div>
          {tabs.map(([id, label, icon]) => (
            <button key={id} type="button" aria-current={tab === id} onClick={() => setTab(id)}>
              {icon()} {label}
            </button>
          ))}
          <div className="bwe-lib-nav-foot">
            <button type="button" onClick={() => setSaving({ scope: 'page' })}>
              {Icon.save()} Save page as template
            </button>
          </div>
        </nav>
        <div className="bwe-lib-main">
          <header>
            {previewId ? (
              <>
                <button type="button" className="bwe-ibtn" onClick={() => setPreviewId(null)} aria-label="Back to templates">
                  {Icon.back()}
                </button>
                <h2>{previewId.title}</h2>
                <button type="button" className="bwe-btn bwe-btn-primary" disabled={busy || !previewLayout} onClick={() => previewLayout && insertLayout(previewLayout, previewId.title)}>
                  Insert template
                </button>
              </>
            ) : (
              <h2>{tabs.find((t) => t[0] === tab)?.[1]}</h2>
            )}
            <button type="button" className="bwe-ibtn" onClick={onClose} aria-label="Close library">
              {Icon.close()}
            </button>
          </header>

          {saving ? (
            <SaveTemplateForm
              element={saving.scope === 'element' ? (saveEl ?? selectedEl) : null}
              onCancel={() => setSaving(null)}
              onSaved={() => {
                setSaving(null)
                if (saveElementId) onClose()
                else {
                  setTab('templates')
                  reload()
                }
              }}
            />
          ) : null}

          <div className="bwe-lib-body">
            {previewId ? (
              <div className="bwe-lib-preview">
                {previewLayout ? <LayoutPreview layout={previewLayout} width={1280} scale={0.62} height={1400} interactive /> : <p className="bwe-desc">Loading preview…</p>}
              </div>
            ) : null}

            {!previewId && tab === 'templates' ? (
              <>
                <div className="bwe-lib-toolbar">
                  <label className="bwe-search" style={{ margin: 0, flex: 1 }}>
                    {Icon.search()}
                    <input type="search" placeholder="Search templates" value={q} onChange={(e) => setQ(e.target.value)} />
                  </label>
                  <div className="bwe-pills" role="group" aria-label="Filter by type">
                    {TYPE_FILTERS.map(([id, label]) => (
                      <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {items === null ? (
                  <div className="bwe-cards">
                    {[0, 1, 2].map((i) => (
                      <div className="bwe-card" key={i}>
                        <div className="bwe-card-thumb">
                          <span className="bwe-skeleton" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length ? (
                  <div className="bwe-cards">
                    {filtered.map((t) => (
                      <TemplateCard key={t.id} t={t} busy={busy} onPreview={() => setPreviewId(t)} onInsert={() => insertTemplate(t)} />
                    ))}
                  </div>
                ) : (
                  <div className="bwe-lib-empty">
                    <strong>{items.length ? 'No templates match' : 'No saved templates yet'}</strong>
                    <p>
                      {items.length
                        ? 'Try another search or type.'
                        : 'Select a frame and click the save icon in its toolbar, or save this whole page as a template.'}
                    </p>
                    {!items.length ? (
                      <button type="button" className="bwe-btn" onClick={() => setSaving({ scope: 'page' })}>
                        {Icon.save()} Save page as template
                      </button>
                    ) : null}
                  </div>
                )}
              </>
            ) : null}

            {!previewId && tab === 'import' ? <ImportPane onInsert={insertLayout} onSaved={() => { setTab('templates'); reload() }} /> : null}

            {!previewId && tab === 'export' ? (
              <div className="bwe-export">
                <ExportCard title="Whole page" description={`${countElements(ed.layout)} elements, ready to import on another Blockwright site.`} layout={ed.layout} name={ed.meta.title || 'page'} />
                {selectedEl ? (
                  <ExportCard
                    title="Selected element"
                    description={`Only the selected ${selectedEl.elType === 'container' ? 'frame' : 'widget'} and what it contains.`}
                    layout={[selectedEl]}
                    name={`${ed.meta.title || 'page'}-section`}
                  />
                ) : (
                  <div className="bwe-export-card is-muted">
                    <strong>Selected element</strong>
                    <p>Select a frame or widget on the page to export just that part.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function SaveTemplateForm({ element, onCancel, onSaved }: { element: Element | null; onCancel: () => void; onSaved: () => void }) {
  const ed = useEditor()
  const [name, setName] = useState(element ? '' : `${ed.meta.title || 'Page'} layout`)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      await createTemplate(ed.cfg, { title: name.trim(), type: element ? 'section' : 'page', layout: element ? [element] : ed.layout })
      ed.notify('Saved to your templates', 'success')
      onSaved()
    } catch (e) {
      ed.notify((e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="bwe-save-bar">
      <span>{element ? 'Save the selected frame as a section template' : 'Save this whole layout as a page template'}</span>
      <input className="bwe-input" autoFocus placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
      <button type="button" className="bwe-btn bwe-btn-primary" disabled={busy || !name.trim()} onClick={save}>
        {busy ? 'Saving…' : 'Save'}
      </button>
      <button type="button" className="bwe-btn bwe-btn-ghost" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}

function ImportPane({ onInsert, onSaved }: { onInsert: (layout: Element[], label: string) => void; onSaved: () => void }) {
  const ed = useEditor()
  const fileRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [file, setFile] = useState<{ name: string; title: string; type: string; content: Element[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const read = async (f: File) => {
    setError(null)
    setFile(null)
    if (f.size > 5_000_000) {
      setError('This file is larger than 5 MB.')
      return
    }
    const parsed = parseTemplateEnvelope(await f.text())
    if (!parsed.success) {
      setError(parsed.errors[0] ?? 'This is not a template file.')
      return
    }
    const env = parsed.data!
    setFile({ name: f.name, title: env.title, type: env.type, content: env.content })
  }

  const saveToLibrary = async () => {
    if (!file) return
    setBusy(true)
    try {
      await createTemplate(ed.cfg, { title: file.title, type: KNOWN_TYPES.includes(file.type) ? file.type : 'section', layout: file.content })
      ed.notify(`“${file.title}” added to your templates`, 'success')
      onSaved()
    } catch (e) {
      ed.notify((e as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bwe-import">
      <button
        type="button"
        className={`bwe-drop${over ? ' is-over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) void read(f)
        }}
      >
        {Icon.upload()}
        <strong>Drop a JSON file here, or click to choose</strong>
        <span>Blockwright exports and templates from popular WordPress page builders</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void read(f)
        }}
      />
      {error ? <p className="bwe-alert" role="alert">{error}</p> : null}
      {file ? (
        <div className="bwe-import-result">
          <div className="bwe-import-file">
            {Icon.file()}
            <div>
              <strong>{file.title}</strong>
              <span>
                {file.name} · {typeLabel(file.type)} · {countElements(file.content)} elements
              </span>
            </div>
          </div>
          {file.content.length ? <LayoutPreview layout={file.content} width={1200} scale={0.4} height={620} /> : null}
          <div className="bwe-inline" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="bwe-btn" disabled={busy} onClick={saveToLibrary}>
              Save to library
            </button>
            <button type="button" className="bwe-btn bwe-btn-primary" disabled={busy} onClick={() => onInsert(file.content, file.title)}>
              Insert into this page
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ExportCard({ title, description, layout, name }: { title: string; description: string; layout: Element[]; name: string }) {
  const ed = useEditor()
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'layout'
  const type = ed.cfg.collection === ed.cfg.templatesSlug ? (ed.meta.templateType ?? 'section') : layout === ed.layout ? 'page' : 'section'
  const envelope = { version: '0.4', title: name, type, page_settings: {}, content: layout }
  return (
    <div className="bwe-export-card">
      <strong>{title}</strong>
      <p>{description}</p>
      <code>blockwright-{slug}.json</code>
      <div className="bwe-inline">
        <button type="button" className="bwe-btn bwe-btn-primary" disabled={!layout.length} onClick={() => downloadJson(`blockwright-${slug}.json`, envelope)}>
          {Icon.download()} Download
        </button>
        <button
          type="button"
          className="bwe-btn"
          disabled={!layout.length}
          onClick={() =>
            navigator.clipboard
              .writeText(JSON.stringify(envelope, null, 2))
              .then(() => ed.notify('JSON copied to the clipboard', 'success'))
              .catch(() => ed.notify('The clipboard is not available here.', 'error'))
          }
        >
          {Icon.copy()} Copy JSON
        </button>
      </div>
    </div>
  )
}
