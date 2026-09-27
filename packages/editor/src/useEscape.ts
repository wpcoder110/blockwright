import { useEffect } from 'react'

/**
 * Close-on-Escape for dialogs.
 *
 * The canvas and the template previews are iframes, so when focus sits inside
 * one of them the parent window never sees the key. This listens in the parent
 * and in every same-origin iframe on the page.
 */
export function useEscapeKey(onEscape: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    const targets: Array<Document | Window> = [window]
    const attach = () => {
      for (const frame of Array.from(document.querySelectorAll('iframe'))) {
        try {
          const doc = frame.contentDocument
          if (doc && !targets.includes(doc)) {
            doc.addEventListener('keydown', onKey)
            targets.push(doc)
          }
        } catch {
          // a cross-origin frame: nothing to listen to
        }
      }
    }
    window.addEventListener('keydown', onKey)
    attach()
    // iframes created while the dialog is open (template previews)
    const timer = window.setInterval(attach, 500)
    return () => {
      window.clearInterval(timer)
      for (const t of targets) t.removeEventListener('keydown', onKey as EventListener)
    }
  }, [onEscape, active])
}
