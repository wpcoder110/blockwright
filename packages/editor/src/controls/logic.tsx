import { Icon } from '../icons'

type Values = Record<string, unknown>
interface Rule {
  field: string
  operator: string
  value?: string
}
interface Logic {
  action: 'show' | 'hide'
  match: 'all' | 'any'
  rules: Rule[]
}

const OPERATORS: Array<[string, string]> = [
  ['is', 'is'],
  ['is_not', 'is not'],
  ['contains', 'contains'],
  ['not_contains', 'does not contain'],
  ['is_empty', 'is empty'],
  ['not_empty', 'is not empty'],
  ['gt', 'is greater than'],
  ['lt', 'is less than'],
]

const DATA_TYPES = new Set(['html', 'step', 'honeypot'])

/** Visual editor for a form field's show/hide rules. */
export function LogicEditor({ value, onChange, siblings, actionLabels }: { value: Logic | null | undefined; onChange: (v: unknown) => void; siblings: Values[]; self: Values; actionLabels?: { show: string; hide: string } }) {
  const fields = siblings.filter((s) => typeof s.custom_id === 'string' && !DATA_TYPES.has(String(s.field_type)))
  const logic: Logic | null = value && typeof value === 'object' && Array.isArray(value.rules) ? value : null
  if (!logic) {
    return (
      <div className="bwe-field">
        <button
          type="button"
          className="bwe-btn bwe-btn-sm"
          disabled={!fields.length}
          onClick={() => onChange({ action: 'show', match: 'all', rules: [{ field: String(fields[0]?.custom_id ?? ''), operator: 'is', value: '' }] })}
        >
          {Icon.plus()} Add a rule
        </button>
        {!fields.length ? <p className="bwe-desc">{actionLabels ? 'Add form fields first.' : 'Rules can use fields placed above this one.'}</p> : null}
      </div>
    )
  }
  const put = (patch: Partial<Logic>) => onChange({ ...logic, ...patch })
  const setRule = (i: number, patch: Partial<Rule>) => put({ rules: logic.rules.map((r, n) => (n === i ? { ...r, ...patch } : r)) })
  return (
    <div className="bwe-group">
      <div style={{ display: 'grid', gap: 4 }}>
        <select className="bwe-select" value={logic.action} onChange={(e) => put({ action: e.target.value as Logic['action'] })}>
          <option value="show">{actionLabels?.show ?? 'Show this field'}</option>
          <option value="hide">{actionLabels?.hide ?? 'Hide this field'}</option>
        </select>
        <select className="bwe-select" value={logic.match} onChange={(e) => put({ match: e.target.value as Logic['match'] })}>
          <option value="all">if all rules match</option>
          <option value="any">if any rule matches</option>
        </select>
      </div>
      {logic.rules.map((r, i) => {
        const target = fields.find((f) => f.custom_id === r.field)
        const options = typeof target?.field_options === 'string' ? target.field_options.split(/\r?\n/).filter(Boolean).map((l) => (l.includes('|') ? l.split('|')[1]!.trim() : l.trim())) : []
        const needsValue = !['is_empty', 'not_empty'].includes(r.operator)
        return (
          <div className="bwe-rule" key={i}>
            <select className="bwe-select" value={r.field} onChange={(e) => setRule(i, { field: e.target.value })} aria-label="Field">
              {fields.map((f) => (
                <option key={String(f.custom_id)} value={String(f.custom_id)}>
                  {String(f.field_label || f.custom_id)}
                </option>
              ))}
            </select>
            <select className="bwe-select" value={r.operator} onChange={(e) => setRule(i, { operator: e.target.value })} aria-label="Condition">
              {OPERATORS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <div className="bwe-wide">
              {needsValue ? (
                options.length && (r.operator === 'is' || r.operator === 'is_not') ? (
                  <select className="bwe-select" value={r.value ?? ''} onChange={(e) => setRule(i, { value: e.target.value })} aria-label="Value">
                    <option value="">Choose…</option>
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="bwe-input" placeholder="Value" value={r.value ?? ''} onChange={(e) => setRule(i, { value: e.target.value })} />
                )
              ) : (
                <span style={{ flex: 1 }} />
              )}
              <button type="button" className="bwe-mini" title="Remove rule" onClick={() => {
                const rules = logic.rules.filter((_, n) => n !== i)
                onChange(rules.length ? { ...logic, rules } : undefined)
              }}>
                {Icon.trash()}
              </button>
            </div>
          </div>
        )
      })}
      <button type="button" className="bwe-btn bwe-btn-sm" onClick={() => put({ rules: [...logic.rules, { field: String(fields[0]?.custom_id ?? ''), operator: 'is', value: '' }] })}>
        {Icon.plus()} Add rule
      </button>
    </div>
  )
}
