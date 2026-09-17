import { useEffect, useRef, useState } from 'react'
import { type MediaItem, listMedia, uploadMedia } from '../api'
import { useEditor } from '../context'
import { Icon } from '../icons'

export function MediaPicker({ onPick, onClose }: { onPick: (m: MediaItem) => void; onClose: () => void }) {
  const { cfg, notify } = useEditor()
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [alt, setAlt] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listMedia(cfg, page)
      .then((res) => {
        if (cancelled) return
        const images = res.docs.filter((d) => !d.mimeType || d.mimeType.startsWith('image/'))
        setItems((prev) => (page === 1 ? images : [...prev, ...images]))
        setMore(res.hasNextPage)
      })
      .catch((err: Error) => notify(err.message, 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [cfg, page, notify])

  const upload = async (file: File) => {
    setBusy(true)
    try {
      const doc = await uploadMedia(cfg, file, alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
      notify('Image uploaded', 'success')
      onPick(doc)
    } catch (err) {
      notify((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bwe-modal-back" role="dialog" aria-modal="true" aria-label="Media library" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bwe-modal">
        <header>
          <h2>Media library</h2>
          <button type="button" className="bwe-ibtn" onClick={onClose} aria-label="Close">
            {Icon.close()}
          </button>
        </header>
        <div className="bwe-modal-body">
          {cfg.mediaCollection ? (
            <div className="bwe-group">
              <strong>Upload a new image</strong>
              <div className="bwe-inline">
                <input className="bwe-input" placeholder="Alt text (describe the image)" value={alt} onChange={(e) => setAlt(e.target.value)} />
                <button type="button" className="bwe-btn bwe-btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>
                  {busy ? 'Uploading…' : 'Choose file'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </div>
            </div>
          ) : (
            <p className="bwe-desc">No upload collection is configured, so paste an image URL into the field instead.</p>
          )}
          {loading && page === 1 ? <p className="bwe-desc">Loading images…</p> : null}
          {!loading && !items.length && cfg.mediaCollection ? <p className="bwe-desc">No images yet. Upload one above.</p> : null}
          <div className="bwe-media-grid">
            {items.map((m) => (
              <button key={m.id} type="button" title={m.alt || m.filename} style={{ backgroundImage: `url("${m.url}")` }} onClick={() => onPick(m)}>
                <span className="bwe-sr" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
                  {m.alt || m.filename}
                </span>
              </button>
            ))}
          </div>
          {more ? (
            <button type="button" className="bwe-btn" disabled={loading} onClick={() => setPage((p) => p + 1)}>
              Load more
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
