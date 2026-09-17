import { useMemo, useState } from 'react'
import { type Control, type FlatControl, advancedSections, containerAdvancedSections, evaluateCondition, getDefinitionDefaults } from '@blockwright/core'
import { useEditor } from './context'
import { ControlField, FormFieldsContext } from './controls'
import { Icon, widgetIcon } from './icons'
import { ConditionsEditor } from './extras'
import { findElementById, findWithParent, newFrame, newWidget } from './tree'

export function Panel() {
  const { panel, selectedId } = useEditor()
  if (panel === 'document') return <DocumentPanel />
  if (panel === 'settings' && selectedId) return <SettingsPanel key={selectedId} />
  return <WidgetsPanel />
}

function WidgetsPanel() {
  const ed = useEditor()
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const byCat = useMemo(() => {
    const defs = ed.registry.all().filter((d) => {
      if (!term) return true
      return [d.title, d.type, ...(d.keywords ?? [])].some((s) => s.toLowerCase().includes(term))
    })
    return ed.registry
      .categories()
      .map((c) => ({ ...c, items: defs.filter((d) => d.category === c.id) }))
      .filter((c) => c.items.length)
  }, [ed.registry, term])

  const addByClick = (type: string) => {
    const def = ed.registry.get(type)
    if (!def) return
    const sel = ed.selectedId ? findWithParent(ed.layout, ed.selectedId) : null
    // add inside the selected frame, next to the selected widget, or at the end of the page
    let parentId: string | null = null
    let index = ed.layout.length
    if (sel?.el.elType === 'container') {
      parentId = sel.el.id
      index = sel.el.elements.length
    } else if (sel) {
      parentId = sel.parent?.id ?? null
      index = sel.index + 1
    }
    if (def.elType === 'container') {
      const f = newFrame({}, [], parentId !== null)
      ed.insert({ parentId, index }, [f], f.id)
    } else {
      const w = newWidget(type)
      if (parentId === null) {
        const wrap = newFrame({}, [w])
        ed.insert({ parentId, index }, [wrap], w.id)
      } else ed.insert({ parentId, index }, [w], w.id)
    }
  }

  return (
    <aside className="bwe-panel" aria-label="Widgets">
      <div className="bwe-panel-head">
        <h2>Widgets</h2>
      </div>
      <div className="bwe-panel-body">
        <label className="bwe-search">
          {Icon.search()}
          <input type="search" placeholder="Search widgets" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search widgets" />
        </label>
        {byCat.map((c) => (
          <div className="bwe-cat" key={c.id}>
            <h3>{c.title}</h3>
            <div className="bwe-tiles">
              {c.items.map((d) => (
                <button
                  key={d.type}
                  type="button"
                  className="bwe-tile"
                  draggable
                  title={d.description ?? d.title}
                  onDragStart={(e) => {
                    ed.drag.current = { kind: 'new', type: d.type }
                    e.dataTransfer.effectAllowed = 'copy'
                    e.dataTransfer.setData('text/plain', d.type)
                  }}
                  onDragEnd={() => {
                    ed.drag.current = null
                  }}
                  onClick={() => addByClick(d.type)}
                >
                  {widgetIcon(d.type, d.icon)}
                  {d.title}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!byCat.length ? <p className="bwe-empty">No widgets match “{q}”.</p> : null}
        <p className="bwe-desc" style={{ padding: '0 12px 16px' }}>
          Drag a widget onto the page, or click it to add it after the selected element.
        </p>
      </div>
    </aside>
  )
}

const TABS = [
  { id: 'content', label: 'Content' },
  { id: 'style', label: 'Style' },
  { id: 'advanced', label: 'Advanced' },
] as const

function SettingsPanel() {
  const ed = useEditor()
  const el = findElementById(ed.layout, ed.selectedId)
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('content')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  if (!el) return <WidgetsPanel />
  const type = el.elType === 'widget' ? String((el as { widgetType?: string }).widgetType) : 'container'
  const def = ed.registry.get(type)
  if (!def) {
    return (
      <aside className="bwe-panel">
        <div className="bwe-panel-head">
          <button type="button" className="bwe-ibtn" onClick={() => ed.setPanel('widgets')} aria-label="Back to widgets">
            {Icon.back()}
          </button>
          <h2>Unknown element</h2>
        </div>
        <p className="bwe-empty">“{type}” is not installed on this site. You can still move or delete it.</p>
      </aside>
    )
  }
  const controls = ed.registry.controls(def)
  // show defaults in the fields (they are what the canvas renders)
  const settings = { ...getDefinitionDefaults(def, controls), ...(el.settings ?? {}) }
  const popovers = new Set(controls.filter((c) => c.type === 'popover-toggle').map((c) => c.name))
  const groups = new Map<string, Control[]>()
  for (const c of controls) if (c.group && popovers.has(c.group)) groups.set(c.group, [...(groups.get(c.group) ?? []), c])

  const sections: Array<{ id: string; label: string; controls: FlatControl[] }> = []
  const labelOf = (id: string) => [...def.sections, ...advancedSections, ...containerAdvancedSections].find((s) => s.id === id)?.label ?? id
  for (const c of controls) {
    if (c.tab !== tab) continue
    if (c.group && popovers.has(c.group)) continue
    if (!evaluateCondition(c.sectionCondition, settings)) continue
    let s = sections.find((x) => x.id === c.section)
    if (!s) {
      s = { id: c.section, label: labelOf(c.section), controls: [] }
      sections.push(s)
    }
    s.controls.push(c)
  }

  const formFields = Array.isArray(settings.form_fields)
    ? (settings.form_fields as Array<Record<string, unknown>>)
        .filter((f) => typeof f.custom_id === 'string' && f.custom_id && !['html', 'step', 'honeypot'].includes(String(f.field_type)))
        .map((f) => ({ id: String(f.custom_id), label: String(f.field_label || f.custom_id), type: String(f.field_type || 'text'), options: typeof f.field_options === 'string' ? f.field_options : undefined }))
    : []

  const bags = {
    get: (bag: '__dynamic__' | '__globals__', key: string) => ((settings[bag] as Record<string, string> | undefined) ?? {})[key],
    set: (bag: '__dynamic__' | '__globals__', key: string, value: string | undefined) => ed.setBag(el.id, bag, key, value),
  }

  return (
    <FormFieldsContext.Provider value={formFields}>
    <aside className="bwe-panel" aria-label={`${def.title} settings`}>
      <div className="bwe-panel-head">
        <button type="button" className="bwe-ibtn" onClick={() => ed.setPanel('widgets')} aria-label="Back to widgets" title="Widgets">
          {Icon.grid()}
        </button>
        <h2>Edit {def.title}</h2>
      </div>
      <div className="bwe-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="bwe-tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bwe-panel-body">
        {sections.map((s, i) => {
          const open = openSections[`${tab}:${s.id}`] ?? i === 0
          return (
            <div className="bwe-section" key={s.id}>
              <button type="button" aria-expanded={open} onClick={() => setOpenSections((o) => ({ ...o, [`${tab}:${s.id}`]: !open }))}>
                {s.label}
                {Icon.down()}
              </button>
              {open ? (
                <div className="bwe-section-body">
                  {s.controls.map((c) => (
                    <ControlField
                      key={c.name}
                      control={c}
                      values={settings}
                      setValue={(k, v) => ed.setSetting(el.id, k, v)}
                      bags={bags}
                      groups={groups}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
        {!sections.length ? <p className="bwe-empty">Nothing to set here.</p> : null}
      </div>
    </aside>
    </FormFieldsContext.Provider>
  )
}

function DocumentPanel() {
  const ed = useEditor()
  const isTemplate = ed.cfg.collection === ed.cfg.templatesSlug
  return (
    <aside className="bwe-panel" aria-label={isTemplate ? 'Template settings' : 'Page settings'}>
      <div className="bwe-panel-head">
        <button type="button" className="bwe-ibtn" onClick={() => ed.setPanel('widgets')} aria-label="Back to widgets" title="Widgets">
          {Icon.grid()}
        </button>
        <h2>{isTemplate ? 'Template settings' : 'Page settings'}</h2>
      </div>
      <div className="bwe-panel-body">
        <div className="bwe-section-body" style={{ paddingTop: 14 }}>
          <label className="bwe-field">
            <span className="bwe-label">Title</span>
            <input className="bwe-input" value={ed.meta.title} onChange={(e) => ed.setMeta({ title: e.target.value })} />
          </label>
          {isTemplate ? (
            <>
              <label className="bwe-field">
                <span className="bwe-label">Template type</span>
                <select className="bwe-select" value={ed.meta.templateType ?? 'section'} onChange={(e) => ed.setMeta({ templateType: e.target.value })}>
                  {[
                    ['header', 'Header'],
                    ['footer', 'Footer'],
                    ['single-page', 'Single page'],
                    ['single-post', 'Single post'],
                    ['single', 'Single (any document)'],
                    ['archive', 'Archive'],
                    ['search-results', 'Search results'],
                    ['error-404', '404 page'],
                    ['section', 'Section (reusable block)'],
                    ['page', 'Page template'],
                    ['popup', 'Popup'],
                    ['pdf', 'PDF for form entries'],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              {ed.meta.templateType === 'pdf' ? (
                <p className="bwe-desc">
                  Design how a form entry looks when printed or saved as PDF. Add the <strong>Entry answers</strong> widget, and use the
                  dynamic-value button for single answers, the entry number or the date. The canvas shows an example entry.
                </p>
              ) : (
                <ConditionsEditor />
              )}
            </>
          ) : null}
          <div className="bwe-heading">Data</div>
          <div className="bwe-inline">
            <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => ed.openLibrary('export')}>
              Export JSON
            </button>
            <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => ed.openLibrary('import')}>
              Import JSON
            </button>
          </div>
          <p className="bwe-desc">Export this layout as a file, or import one exported from Blockwright or an Elementor-compatible builder.</p>
        </div>
      </div>
    </aside>
  )
}
