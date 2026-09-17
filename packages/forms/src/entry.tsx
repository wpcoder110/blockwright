import { type DynamicTagDefinition, type RenderContext, type RenderProps, choose, color, defineTag, defineWidget, formatDate, opts, section, select, text, typography, dimensions } from '@blockwright/core'

export interface EntryData {
  id?: string | number
  formName?: string
  createdAt?: string
  status?: string
  pageUrl?: string
  answers: Array<{ fieldId?: string; label?: string; value?: string }>
}

/** Example entry shown while designing a PDF template. */
export const SAMPLE_ENTRY: EntryData = {
  id: 1024,
  formName: 'Quote request',
  createdAt: new Date('2026-09-17T10:30:00Z').toISOString(),
  status: 'new',
  pageUrl: 'https://example.com/contact',
  answers: [
    { fieldId: 'name', label: 'Full name', value: 'Sara Khan' },
    { fieldId: 'email', label: 'Email', value: 'sara@example.com' },
    { fieldId: 'phone', label: 'Mobile number', value: '03001234567' },
    { fieldId: 'message', label: 'Message', value: 'Two indigo tablecloths, 2 by 3 metres.\nNeeded before the end of the month.' },
  ],
}

export const entryOf = (ctx: RenderContext): EntryData | undefined => {
  const e = ctx.extra?.entry as EntryData | undefined
  if (e) return e
  return ctx.mode === 'edit' || ctx.mode === 'preview' ? SAMPLE_ENTRY : undefined
}

export const ENTRY_TAGS: DynamicTagDefinition[] = [
  defineTag({
    name: 'entry-field',
    title: 'Entry: answer',
    group: 'forms',
    returns: ['text'],
    settings: [{ name: 'field', label: 'Field ID', type: 'text' }],
    resolve: (ctx, s) => entryOf(ctx)?.answers.find((a) => a.fieldId === s.field)?.value ?? '',
  }),
  defineTag({ name: 'entry-id', title: 'Entry: number', group: 'forms', returns: ['text'], resolve: (ctx) => String(entryOf(ctx)?.id ?? '') }),
  defineTag({ name: 'entry-form', title: 'Entry: form name', group: 'forms', returns: ['text'], resolve: (ctx) => entryOf(ctx)?.formName ?? '' }),
  defineTag({
    name: 'entry-date',
    title: 'Entry: date',
    group: 'forms',
    returns: ['text'],
    settings: [{ name: 'format', label: 'Format', type: 'select', options: ['short', 'medium', 'long', 'full', 'iso'], default: 'long' }],
    resolve: (ctx, s) => formatDate(entryOf(ctx)?.createdAt, String(s.format ?? 'long'), ctx.request?.locale),
  }),
  defineTag({ name: 'entry-page', title: 'Entry: page URL', group: 'forms', returns: ['text', 'url'], resolve: (ctx) => entryOf(ctx)?.pageUrl ?? '' }),
]

const W = '{{WRAPPER}}'

function EntryFields({ settings, ctx }: RenderProps) {
  const entry = entryOf(ctx)
  if (!entry) return null
  const hidden = new Set(String(settings.bw_exclude ?? '').split(',').map((s) => s.trim()).filter(Boolean))
  const rows = entry.answers.filter((a) => !hidden.has(String(a.fieldId)))
  if (settings.layout === 'list') {
    return (
      <dl className="bw-entry bw-entry-list">
        {rows.map((a, i) => (
          <div key={`${a.fieldId}-${i}`} className="bw-entry-row">
            <dt className="bw-entry-label">{a.label || a.fieldId}</dt>
            <dd className="bw-entry-value">{a.value || '—'}</dd>
          </div>
        ))}
      </dl>
    )
  }
  return (
    <table className="bw-entry bw-entry-table">
      <tbody>
        {rows.map((a, i) => (
          <tr key={`${a.fieldId}-${i}`} className="bw-entry-row">
            <th scope="row" className="bw-entry-label">
              {a.label || a.fieldId}
            </th>
            <td className="bw-entry-value">{a.value || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const entryFields = defineWidget({
  type: 'entry-fields',
  title: 'Entry answers',
  description: 'All answers of a form entry. Use it in PDF templates.',
  icon: 'form',
  category: 'forms',
  keywords: ['pdf', 'entry', 'answers', 'submission', 'table'],
  render: EntryFields as never,
  sections: [
    section('section_entry', 'Entry answers', [
      select('layout', { label: 'Layout', options: opts({ table: 'Table', list: 'Stacked' }), default: 'table' }),
      text('bw_exclude', { label: 'Hide fields', placeholder: 'honeypot, terms', description: 'Field IDs to leave out, separated by commas.' }),
    ]),
    section(
      'section_entry_style',
      'Answers',
      [
        choose('bw_label_width', { label: 'Label width', options: opts({ '25%': '25%', '35%': '35%', '50%': '50%' }), selectors: { [`${W} .bw-entry-label`]: 'width: {{VALUE}};' } }),
        color('label_color', { label: 'Label color', global: 'colors', selectors: { [`${W} .bw-entry-label`]: 'color: {{VALUE}};' } }),
        color('label_background', { label: 'Label background', selectors: { [`${W} .bw-entry-label`]: 'background-color: {{VALUE}};' } }),
        ...typography('label_typography', { selector: `${W} .bw-entry-label` }),
        color('value_color', { label: 'Answer color', global: 'colors', selectors: { [`${W} .bw-entry-value`]: 'color: {{VALUE}};' } }),
        ...typography('value_typography', { selector: `${W} .bw-entry-value` }),
        color('row_border_color', { label: 'Border color', selectors: { [W]: '--bw-entry-border: {{VALUE}};' } }),
        dimensions('cell_padding', { label: 'Cell padding', selectors: { [`${W} .bw-entry-label, ${W} .bw-entry-value`]: 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-entry{--bw-entry-border:#dee2e6;width:100%;border-collapse:collapse;margin:0}' +
    '.bw-entry-label,.bw-entry-value{padding:9px 12px;border-bottom:1px solid var(--bw-entry-border);text-align:left;vertical-align:top;white-space:pre-wrap;word-break:break-word}' +
    '.bw-entry-label{width:35%;font-weight:600;background:#f8f9fa}' +
    '.bw-entry-list .bw-entry-row{padding:8px 0;border-bottom:1px solid var(--bw-entry-border)}.bw-entry-list dt,.bw-entry-list dd{margin:0;padding:0;border:0;background:none;width:auto}' +
    '.bw-entry-list dt{font-size:.85em}' +
    '.bw-entry-row{break-inside:avoid}',
})
