import { useMemo, useState } from 'react'
import { BwIcon, ICONS } from '@blockwright/renderer'
import { Icon } from '../icons'
import { MediaPicker } from './media'

type Value = { value?: string | { url?: string; id?: string | number }; library?: string } | undefined

export function IconPicker({ value, onChange }: { value: Value; onChange: (v: unknown) => void }) {
  const [open, setOpen] = useState(false)
  const [upload, setUpload] = useState(false)
  const [q, setQ] = useState('')
  const names = useMemo(() => Object.keys(ICONS).filter((n) => n.includes(q.trim().toLowerCase())), [q])
  const has = !!value?.value
  return (
    <>
      <div className="bwe-inline">
        <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => setOpen(true)} style={{ gap: 8 }}>
          {has ? <BwIcon icon={value} style={{ fontSize: 16 }} /> : null}
          {has ? 'Change' : 'Choose icon'}
        </button>
        {has ? (
          <button type="button" className="bwe-mini" title="Remove icon" onClick={() => onChange(undefined)}>
            {Icon.close()}
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="bwe-modal-back" role="dialog" aria-modal="true" aria-label="Icons" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bwe-modal" style={{ width: 'min(620px, 100%)' }}>
            <header>
              <h2>Choose an icon</h2>
              <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => setUpload(true)}>
                {Icon.upload()} Upload SVG
              </button>
              <button type="button" className="bwe-ibtn" onClick={() => setOpen(false)} aria-label="Close">
                {Icon.close()}
              </button>
            </header>
            <div className="bwe-modal-body">
              <label className="bwe-search" style={{ margin: 0 }}>
                {Icon.search()}
                <input type="search" placeholder="Search icons" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
              </label>
              <div className="bwe-icon-grid">
                {names.map((n) => (
                  <button
                    key={n}
                    type="button"
                    title={n}
                    aria-pressed={value?.value === `bw-${n}`}
                    onClick={() => {
                      onChange({ value: `bw-${n}`, library: 'bw' })
                      setOpen(false)
                    }}
                  >
                    <BwIcon icon={{ value: `bw-${n}`, library: 'bw' }} />
                    <span>{n.replace(/-/g, ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {upload ? (
        <MediaPicker
          onClose={() => setUpload(false)}
          onPick={(m) => {
            onChange({ value: { url: m.url, id: m.id }, library: 'svg' })
            setUpload(false)
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}
