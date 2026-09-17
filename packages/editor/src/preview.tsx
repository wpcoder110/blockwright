import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type PreparedElement, type RenderContext, compileCss, kitFonts, kitToCss, prepareLayout } from '@blockwright/core'
import { RenderElements, googleFontsHref } from '@blockwright/renderer'
import type { Element } from '@blockwright/schema'
import { useEditor } from './context'

const DOC = '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>'

/** Read-only, scaled render of a layout (template thumbnails and previews). */
export function LayoutPreview({ layout, width = 1200, scale: fixedScale = 0.2, height, interactive = false, fit = false }: { layout: Element[]; width?: number; scale?: number; height?: number; interactive?: boolean; fit?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(fixedScale)
  useEffect(() => {
    if (!fit || !boxRef.current?.parentElement) return
    const parent = boxRef.current.parentElement
    const ro = new ResizeObserver(() => setFitScale(parent.clientWidth / width))
    ro.observe(parent)
    return () => ro.disconnect()
  }, [fit, width])
  const scale = fit ? fitScale : fixedScale
  const { registry, kit, site, cfg } = useEditor()
  const ref = useRef<HTMLIFrameElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const [prepared, setPrepared] = useState<PreparedElement[]>([])
  const ctx = useMemo<RenderContext>(
    () => ({ registry, kit, mode: 'preview', site, request: { path: '/' }, document: { collection: cfg.collection, id: cfg.id, data: {} }, components: {} }),
    [registry, kit, site, cfg],
  )

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return
    const check = () => {
      const d = iframe.contentDocument
      if (d && d.readyState === 'complete' && d.URL === 'about:srcdoc' && d.body) setDoc((p) => (p === d ? p : d))
    }
    check()
    iframe.addEventListener('load', check)
    const t = setInterval(check, 150)
    const stop = setTimeout(() => clearInterval(t), 4000)
    return () => {
      iframe.removeEventListener('load', check)
      clearInterval(t)
      clearTimeout(stop)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    prepareLayout(layout, ctx).then((p) => {
      if (cancelled || !doc) return
      const compiled = compileCss(p, { registry, kit })
      let st = doc.getElementById('bw-css')
      if (!st) {
        st = doc.createElement('style')
        st.id = 'bw-css'
        doc.head.appendChild(st)
      }
      st.textContent =
        'body{font-family:var(--bw-t-text-font-family,system-ui,sans-serif);color:var(--bw-c-text);line-height:1.6}[class*="bw-anim-"]{animation:none!important}' +
        kitToCss(kit) +
        Object.values(compiled.base).join('') +
        compiled.css
      const href = kit.fontProvider === 'google' ? googleFontsHref([...kitFonts(kit), ...compiled.fonts]) : null
      if (href && !doc.getElementById('bw-fonts')) {
        const l = doc.createElement('link')
        l.id = 'bw-fonts'
        l.rel = 'stylesheet'
        l.href = href
        doc.head.appendChild(l)
      }
      setPrepared(p)
    })
    return () => {
      cancelled = true
    }
  }, [layout, ctx, doc, registry, kit])

  const h = height ?? Math.round(width * 0.66)
  return (
    <div ref={boxRef} className="bwe-thumb" style={{ width: width * scale, height: h * scale }}>
      <iframe
        ref={ref}
        title="Preview"
        srcDoc={DOC}
        tabIndex={interactive ? 0 : -1}
        aria-hidden={!interactive}
        style={{ width, height: h, transform: `scale(${scale})`, pointerEvents: interactive ? 'auto' : 'none' }}
      />
      {doc
        ? createPortal(
            <div className="bw-content">
              <RenderElements items={prepared} ctx={ctx} />
            </div>,
            doc.body,
          )
        : null}
    </div>
  )
}
