import { useEffect, useRef, useState } from 'react'

const BUTTONS: Array<{ label: string; title: string; run: () => void }> = [
  { label: 'B', title: 'Bold', run: () => document.execCommand('bold') },
  { label: 'I', title: 'Italic', run: () => document.execCommand('italic') },
  { label: 'U', title: 'Underline', run: () => document.execCommand('underline') },
  { label: 'H2', title: 'Heading 2', run: () => document.execCommand('formatBlock', false, 'h2') },
  { label: 'H3', title: 'Heading 3', run: () => document.execCommand('formatBlock', false, 'h3') },
  { label: 'P', title: 'Paragraph', run: () => document.execCommand('formatBlock', false, 'p') },
  { label: '•', title: 'Bulleted list', run: () => document.execCommand('insertUnorderedList') },
  { label: '1.', title: 'Numbered list', run: () => document.execCommand('insertOrderedList') },
  {
    label: 'Link',
    title: 'Add link',
    run: () => {
      const url = window.prompt('Link URL', 'https://')
      if (url) document.execCommand('createLink', false, url)
    },
  },
  { label: 'Unlink', title: 'Remove link', run: () => document.execCommand('unlink') },
  { label: 'Clear', title: 'Clear formatting', run: () => document.execCommand('removeFormat') },
]

/** Lightweight rich-text editor producing HTML (cleaned on save by the server). */
export function RichText({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [source, setSource] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el && el.innerHTML !== value && document.activeElement !== el) el.innerHTML = value
  }, [value, source])

  const emit = () => {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  return (
    <div className="bwe-rte">
      <div className="bwe-rte-bar" role="toolbar" aria-label="Formatting">
        {!source
          ? BUTTONS.map((b) => (
              <button
                key={b.title}
                type="button"
                title={b.title}
                onMouseDown={(e) => {
                  e.preventDefault()
                  b.run()
                  emit()
                }}
              >
                {b.label}
              </button>
            ))
          : null}
        <button type="button" style={{ marginLeft: 'auto' }} aria-pressed={source} onClick={() => setSource((s) => !s)}>
          {source ? 'Visual' : 'HTML'}
        </button>
      </div>
      {source ? (
        <textarea className="bwe-textarea bwe-mono bwe-rte-html" value={value} spellCheck={false} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div ref={ref} className="bwe-rte-area" contentEditable suppressContentEditableWarning onInput={emit} onBlur={emit} role="textbox" aria-multiline="true" />
      )}
    </div>
  )
}
