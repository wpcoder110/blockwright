'use client'
import { FieldLabel, useField, useRowLabel } from '@payloadcms/ui'
import { useId, useState } from 'react'

export function PrintButton({ label = 'Print or save as PDF' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()}>
      {label}
    </button>
  )
}

interface FieldProps {
  path: string
  field?: { label?: unknown; admin?: { description?: unknown } }
  readOnly?: boolean
}

const SWATCHES = ['#1d3557', '#457b9d', '#0f766e', '#2b8a3e', '#e63946', '#f08c00', '#7048e8', '#212529', '#6c757d', '#ffffff']
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** Colour field: swatch, native picker, hex input and a small palette. */
export function ColorField({ path, field, readOnly }: FieldProps) {
  const { value, setValue } = useField<string>({ path })
  const id = useId()
  const [open, setOpen] = useState(false)
  const current = typeof value === 'string' ? value : ''
  const picker = HEX.test(current) ? (current.length === 4 ? `#${current.slice(1).replace(/./g, '$&$&')}` : current.slice(0, 7)) : '#000000'
  return (
    <div className="field-type text" style={{ marginBottom: 'var(--base, 20px)' }}>
      <FieldLabel htmlFor={id} label={(field?.label as string) ?? 'Color'} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <label
          style={{
            width: 38,
            height: 38,
            flex: 'none',
            borderRadius: 6,
            border: '1px solid var(--theme-elevation-200)',
            background: current || 'transparent',
            cursor: readOnly ? 'default' : 'pointer',
            backgroundImage: current ? undefined : 'linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%),linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%)',
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 5px 5px',
          }}
        >
          <input
            type="color"
            value={picker}
            disabled={readOnly}
            onChange={(e) => setValue(e.target.value)}
            style={{ opacity: 0, width: '100%', height: '100%', cursor: 'inherit' }}
            aria-label={`${(field?.label as string) ?? 'Color'} picker`}
          />
        </label>
        <input
          id={id}
          className="field-type__input"
          value={current}
          disabled={readOnly}
          placeholder="#1d3557"
          onChange={(e) => setValue(e.target.value)}
          style={{ flex: 1, minWidth: 0, height: 38, padding: '0 10px', borderRadius: 4, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-input-bg)', color: 'inherit', fontFamily: 'monospace' }}
        />
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          style={{ margin: 0 }}
          disabled={readOnly}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          Presets
        </button>
        {open ? (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              zIndex: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 28px)',
              gap: 6,
              padding: 10,
              borderRadius: 6,
              background: 'var(--theme-elevation-0)',
              border: '1px solid var(--theme-elevation-150)',
              boxShadow: '0 8px 24px rgba(0,0,0,.14)',
            }}
          >
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={c}
                onClick={() => {
                  setValue(c)
                  setOpen(false)
                }}
                style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid var(--theme-elevation-200)', background: c, cursor: 'pointer' }}
              />
            ))}
          </div>
        ) : null}
      </div>
      {current && !HEX.test(current) && !/^(rgb|hsl|var|color)\(/i.test(current) ? (
        <p className="field-description" style={{ color: 'var(--theme-error-500)' }}>
          Use a hex value like #1d3557, or rgb()/hsl().
        </p>
      ) : (
        <p className="field-description">{(field?.admin?.description as string) ?? ''}</p>
      )}
    </div>
  )
}

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Manrope', 'Sora', 'DM Sans', 'Nunito', 'Work Sans',
  'Raleway', 'Rubik', 'Outfit', 'Plus Jakarta Sans', 'Figtree', 'Space Grotesk', 'IBM Plex Sans', 'Playfair Display',
  'Merriweather', 'Lora', 'Fraunces', 'JetBrains Mono', 'Noto Sans', 'Noto Nastaliq Urdu', 'Cairo', 'Tajawal',
]

/** Font family field with a list of common Google Fonts and a live sample. */
export function FontField({ path, field, readOnly }: FieldProps) {
  const { value, setValue } = useField<string>({ path })
  const id = useId()
  const current = typeof value === 'string' ? value : ''
  return (
    <div className="field-type text" style={{ marginBottom: 'var(--base, 20px)' }}>
      <FieldLabel htmlFor={id} label={(field?.label as string) ?? 'Font family'} />
      <input
        id={id}
        list={`${id}-fonts`}
        value={current}
        disabled={readOnly}
        placeholder="Inter"
        onChange={(e) => setValue(e.target.value)}
        style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 4, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-input-bg)', color: 'inherit' }}
      />
      <datalist id={`${id}-fonts`}>
        {FONTS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      {current ? (
        <>
          <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(current).replace(/%20/g, '+')}:wght@400;600&display=swap`} />
          <p style={{ margin: '6px 0 0', fontFamily: `"${current}", system-ui, sans-serif`, fontSize: 18 }}>
            The quick brown fox · 0123
          </p>
        </>
      ) : null}
      <p className="field-description">{(field?.admin?.description as string) ?? ''}</p>
    </div>
  )
}

/** Row label for the colour list: swatch, name and id. */
export function ColorRowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string; colorId?: string; color?: string }>()
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden="true"
        style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--theme-elevation-200)', background: data?.color || 'transparent' }}
      />
      {data?.title || `Color ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}
      {data?.colorId ? <code style={{ opacity: 0.6 }}>{data.colorId}</code> : null}
    </span>
  )
}

/** Row label for the font list: name, family and weight. */
export function TypographyRowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string; typoId?: string; fontFamily?: string; fontWeight?: string }>()
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {data?.title || `Font ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}
      {data?.fontFamily ? (
        <span style={{ opacity: 0.7, fontFamily: `"${data.fontFamily}", system-ui`, fontWeight: (data.fontWeight as never) ?? 400 }}>{data.fontFamily}</span>
      ) : null}
    </span>
  )
}
