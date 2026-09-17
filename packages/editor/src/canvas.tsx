import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type PreparedElement, type RenderContext, compileCss, kitFonts, kitToCss, prepareLayout } from '@blockwright/core'
import { RenderElements, googleFontsHref } from '@blockwright/renderer'
import type { Element } from '@blockwright/schema'
import { useEditor } from './context'
import { fetchMenu } from './api'
import { SAMPLE_ENTRY } from '@blockwright/forms'
import { type DropTarget, type Rect, computeDrop } from './dnd'
import { Icon } from './icons'
import { CANVAS_CSS } from './styles'
import { STRUCTURES, findWithParent, frameFromStructure, newFrame, newWidget } from './tree'

const DEVICE_WIDTH: Record<string, string> = { desktop: '100%', tablet: '768px', mobile: '360px' }
const SRC_DOC = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'

export function Canvas() {
  const ed = useEditor()
  const { layout, registry, kit, device, cfg, docData, site, selectedId, hoveredId, drag } = ed
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [frameDoc, setFrameDoc] = useState<Document | null>(null)
  const [prepared, setPrepared] = useState<PreparedElement[]>([])
  const [css, setCss] = useState('')
  const [fontsHref, setFontsHref] = useState<string | null>(null)
  const [drop, setDrop] = useState<DropTarget | null>(null)
  const [tick, setTick] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const edRef = useRef(ed)
  edRef.current = ed

  const ctx = useMemo<RenderContext>(
    () => ({
      registry,
      kit,
      mode: 'edit',
      document: { collection: cfg.collection, id: cfg.id, data: docData },
      owner: { collection: cfg.collection, id: cfg.id },
      site,
      request: { path: '/', searchParams: {} },
      components: {},
      extra: { entry: SAMPLE_ENTRY },
      services: { menu: (id) => fetchMenu(cfg, id) },
    }),
    [registry, kit, cfg, docData, site],
  )
  const isPdf = cfg.collection === cfg.templatesSlug && ed.meta.templateType === 'pdf'

  // resolve dynamic values and compile CSS whenever the layout changes
  useEffect(() => {
    let cancelled = false
    prepareLayout(layout, ctx).then((p) => {
      if (cancelled) return
      const compiled = compileCss(p, { registry, kit })
      setPrepared(p)
      setCss(kitToCss(kit) + Object.values(compiled.base).join('') + compiled.css)
      setFontsHref(kit.fontProvider === 'google' ? googleFontsHref([...kitFonts(kit), ...compiled.fonts]) : null)
    })
    return () => {
      cancelled = true
    }
  }, [layout, ctx, registry, kit])

  useEffect(() => {
    if (!frameDoc) return
    const head = frameDoc.head
    let base = head.querySelector<HTMLStyleElement>('#bwe-canvas')
    if (!base) {
      base = frameDoc.createElement('style')
      base.id = 'bwe-canvas'
      base.textContent = CANVAS_CSS
      head.appendChild(base)
    }
    let st = head.querySelector<HTMLStyleElement>('#bwe-layout')
    if (!st) {
      st = frameDoc.createElement('style')
      st.id = 'bwe-layout'
      head.appendChild(st)
    }
    st.textContent = css
    let link = head.querySelector<HTMLLinkElement>('#bwe-fonts')
    if (fontsHref) {
      if (!link) {
        link = frameDoc.createElement('link')
        link.id = 'bwe-fonts'
        link.rel = 'stylesheet'
        head.appendChild(link)
      }
      if (link.href !== fontsHref) link.href = fontsHref
    } else link?.remove()
  }, [css, fontsHref, frameDoc])

  const onLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (doc && doc.body && doc.URL === 'about:srcdoc') setFrameDoc(doc)
  }, [])

  // the iframe can finish loading before React attaches onLoad (server-rendered pages)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const check = () => {
      const doc = iframe.contentDocument
      if (doc && doc.readyState === 'complete' && doc.URL === 'about:srcdoc' && doc.body) setFrameDoc((prev) => (prev === doc ? prev : doc))
    }
    check()
    iframe.addEventListener('load', check)
    const timer = setInterval(check, 150)
    const stop = setTimeout(() => clearInterval(timer), 5000)
    return () => {
      iframe.removeEventListener('load', check)
      clearInterval(timer)
      clearTimeout(stop)
    }
  }, [])

  // canvas interactions (native listeners inside the iframe)
  useEffect(() => {
    if (!frameDoc) return
    const win = frameDoc.defaultView!
    const ed = new Proxy({} as typeof edRef.current, { get: (_t, k) => (edRef.current as never)[k] })
    const idAt = (t: EventTarget | null) => ((t as HTMLElement | null)?.closest?.('[data-bw-id]') as HTMLElement | null)?.dataset.bwId ?? null
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.bwe-add')) return
      e.preventDefault()
      const id = idAt(target)
      const field = target.closest<HTMLElement>('[data-field]')?.dataset.field ?? null
      ed.select(id, field)
    }
    const onSubmit = (e: Event) => e.preventDefault()
    const onOver = (e: MouseEvent) => ed.setHovered(idAt(e.target))
    const onLeave = () => ed.setHovered(null)
    const onDragOver = (e: DragEvent) => {
      if (!drag.current) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = drag.current.kind === 'move' ? 'move' : 'copy'
      setDrop(computeDrop(frameDoc, e.clientX, e.clientY, ed.layout, drag.current))
    }
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) setDrop(null)
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const payload = drag.current
      const target = payload ? computeDrop(frameDoc, e.clientX, e.clientY, ed.layout, payload) : null
      setDrop(null)
      drag.current = null
      if (!payload || !target) return
      if (payload.kind === 'move') {
        ed.move(payload.id, target.pos)
        return
      }
      const def = registry.get(payload.type)
      if (!def) return
      if (def.elType === 'container') {
        const frame = newFrame({}, [], target.pos.parentId !== null)
        ed.insert(target.pos, [frame], frame.id)
        return
      }
      const w = newWidget(def.type)
      if (target.pos.parentId === null) {
        const wrap = newFrame({}, [w], false)
        ed.insert(target.pos, [wrap], w.id)
      } else ed.insert(target.pos, [w], w.id)
    }
    const onScroll = () => setTick((t) => t + 1)
    const onKey = (e: KeyboardEvent) => window.dispatchEvent(new KeyboardEvent('keydown', e))
    frameDoc.addEventListener('click', onClick, true)
    frameDoc.addEventListener('submit', onSubmit, true)
    frameDoc.addEventListener('mouseover', onOver)
    frameDoc.addEventListener('mouseleave', onLeave)
    frameDoc.addEventListener('dragover', onDragOver)
    frameDoc.addEventListener('dragleave', onDragLeave)
    frameDoc.addEventListener('drop', onDrop)
    frameDoc.addEventListener('keydown', onKey)
    win.addEventListener('scroll', onScroll, { passive: true })
    win.addEventListener('resize', onScroll)
    const ro = new ResizeObserver(onScroll)
    ro.observe(frameDoc.body)
    return () => {
      frameDoc.removeEventListener('click', onClick, true)
      frameDoc.removeEventListener('submit', onSubmit, true)
      frameDoc.removeEventListener('mouseover', onOver)
      frameDoc.removeEventListener('mouseleave', onLeave)
      frameDoc.removeEventListener('dragover', onDragOver)
      frameDoc.removeEventListener('dragleave', onDragLeave)
      frameDoc.removeEventListener('drop', onDrop)
      frameDoc.removeEventListener('keydown', onKey)
      win.removeEventListener('scroll', onScroll)
      win.removeEventListener('resize', onScroll)
      ro.disconnect()
    }
  }, [frameDoc, drag, registry])

  // scroll the selected element into view when it changes
  useEffect(() => {
    if (!frameDoc || !selectedId) return
    const el = frameDoc.querySelector(`[data-bw-id="${selectedId}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const vh = frameDoc.defaultView?.innerHeight ?? 0
    if (r.bottom < 0 || r.top > vh) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selectedId, frameDoc, prepared])

  // show the real desktop layout on small screens by scaling a wider canvas down
  const minDesktop = (kit.breakpoints?.tablet?.enabled === false ? 0 : (kit.breakpoints?.tablet?.value ?? 1024)) + 176
  const scale = !isPdf && device === 'desktop' && stage.w > 0 && stage.w < minDesktop ? stage.w / minDesktop : 1
  const deviceStyle: React.CSSProperties = isPdf
    ? { width: '794px' }
    : scale < 1
      ? { width: minDesktop, height: stage.h / scale, transform: `scale(${scale})`, transformOrigin: 'top left', flex: 'none', alignSelf: 'flex-start', marginRight: stage.w - minDesktop }
      : { width: DEVICE_WIDTH[device] ?? '100%' }

  return (
    <div className="bwe-stage" ref={stageRef} onDragLeave={(e) => !e.relatedTarget && setDrop(null)}>
      {scale < 1 ? <span className="bwe-zoom" title="The desktop view is scaled to fit your screen">{Math.round(scale * 100)}%</span> : null}
      <div className={`bwe-device${isPdf ? ' is-paper' : ''}`} style={deviceStyle}>
        <iframe ref={iframeRef} title="Page canvas" srcDoc={SRC_DOC} onLoad={onLoad} />
        {frameDoc
          ? createPortal(
              <>
                <div className={`bw-content${isPdf ? ' bwe-paper' : ''}`}>
                  <RenderElements items={prepared} ctx={ctx} />
                </div>
                <AddSection empty={!layout.length} />
              </>,
              frameDoc.body,
            )
          : null}
        <Overlay doc={frameDoc} hoveredId={hoveredId} selectedId={selectedId} drop={drop} tick={`${tick}-${prepared.length}-${device}`} prepared={prepared} />
      </div>
    </div>
  )
}

function AddSection({ empty }: { empty: boolean }) {
  const ed = useEditor()
  return (
    <div className={`bwe-add${empty ? ' is-empty' : ''}`}>
      <strong>{empty ? 'Start building this page' : 'Add a section'}</strong>
      Drag a widget here, or pick a layout:
      <div className="bwe-structs">
        {STRUCTURES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="bwe-struct"
            title={s.label}
            aria-label={s.label}
            onClick={() => {
              const frame = frameFromStructure(s.columns)
              ed.insert({ parentId: null, index: ed.layout.length }, [frame], frame.elements[0]?.id ?? frame.id)
            }}
          >
            {s.columns.map((w, i) => (
              <span key={i} style={{ flex: `${w} 1 0` }} />
            ))}
          </button>
        ))}
      </div>
    </div>
  )
}

function Overlay({ doc, hoveredId, selectedId, drop, tick, prepared }: { doc: Document | null; hoveredId: string | null; selectedId: string | null; drop: DropTarget | null; tick: string; prepared: unknown }) {
  const ed = useEditor()
  const [rects, setRects] = useState<{ hover: Rect | null; selected: Rect | null }>({ hover: null, selected: null })

  useLayoutEffect(() => {
    if (!doc) return
    const measure = (id: string | null): Rect | null => {
      if (!id) return null
      const el = doc.querySelector(`[data-bw-id="${id}"]`)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    }
    setRects({ hover: hoveredId && hoveredId !== selectedId ? measure(hoveredId) : null, selected: measure(selectedId) })
  }, [doc, hoveredId, selectedId, tick, prepared, ed.layout])

  const selected = ed.selectedId ? findWithParent(ed.layout, ed.selectedId) : null
  const selType = selected ? (selected.el.elType === 'widget' ? String((selected.el as Element & { widgetType?: string }).widgetType) : 'container') : null
  const def = selType ? ed.registry.get(selType) : undefined
  const hoverEl = hoveredId ? findWithParent(ed.layout, hoveredId) : null
  const hoverIsFrame = hoverEl?.el.elType === 'container'

  const box = (r: Rect, cls: string, children?: ReactNode) => (
    <div className={`bwe-box ${cls}`} style={{ top: r.top, left: r.left, width: r.width, height: r.height }}>
      {children}
    </div>
  )

  let toolbar: ReactNode = null
  if (rects.selected && selected && def) {
    const r = rects.selected
    const pos = r.top < 26 ? (r.height > 60 ? 'is-inside' : 'is-below') : ''
    const style = pos === 'is-inside' ? { top: 0, left: 0 } : pos === 'is-below' ? { top: r.height } : { top: -24 }
    toolbar = (
      <div className={`bwe-tag ${pos}`} style={style}>
        <span style={{ marginRight: 4 }}>{def.title}</span>
        <button
          type="button"
          className="bwe-drag"
          draggable
          title="Drag to move"
          onDragStart={(e) => {
            ed.drag.current = { kind: 'move', id: selected.el.id }
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', selected.el.id)
          }}
          onDragEnd={() => {
            ed.drag.current = null
          }}
        >
          {Icon.move()}
        </button>
        {selected.parent ? (
          <button type="button" title="Select parent" onClick={() => ed.select(selected.parent!.id)}>
            {Icon.parent()}
          </button>
        ) : null}
        <button type="button" title="Duplicate (Ctrl+D)" onClick={() => ed.duplicate(selected.el.id)}>
          {Icon.copy()}
        </button>
        {def.elType === 'container' ? (
          <button type="button" title="Save as template" onClick={() => ed.openLibrary('templates', selected.el.id)}>
            {Icon.save()}
          </button>
        ) : null}
        <button type="button" title="Delete (Del)" onClick={() => ed.remove(selected.el.id)}>
          {Icon.trash()}
        </button>
      </div>
    )
  }

  return (
    <div className="bwe-overlay">
      {rects.hover
        ? box(rects.hover, `is-hover${hoverIsFrame ? ' is-frame' : ''}`, hoverIsFrame ? <span className="bwe-hover-label">Frame</span> : null)
        : null}
      {rects.selected ? box(rects.selected, 'is-selected', toolbar) : null}
      {drop ? (
        <div
          className={drop.kind === 'inside' ? 'bwe-drop-inside' : 'bwe-drop-line'}
          style={{ top: drop.indicator.top, left: drop.indicator.left, width: drop.indicator.width, height: drop.indicator.height }}
        />
      ) : null}
    </div>
  )
}
