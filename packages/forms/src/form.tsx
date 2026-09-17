import type { ReactNode } from 'react'
import { type RenderProps, defineWidget } from '@blockwright/core'
import { FormEnhancer } from '@blockwright/forms/client'
import { formSections } from './controls'
import { Field, type FieldRenderOptions } from './fields'
import { FORM_CSS } from './styles'
import type { FieldValue, FormField } from './types'
import { fieldKey, isDataField, readMessages, splitSteps, truthy } from './validate'

export const DEFAULT_ENDPOINT = '/api/bw/forms/submit'

export function readFields(settings: Record<string, unknown>): FormField[] {
  const raw = settings.form_fields
  if (!Array.isArray(raw)) return []
  return raw
    .filter((f): f is FormField => !!f && typeof f === 'object')
    .map((f) => ({ ...f, custom_id: fieldKey(f), field_type: (f.field_type || 'text') as FormField['field_type'] }))
    .filter((f) => f.custom_id)
}

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']
const WIDTHS = ['100', '80', '75', '66', '60', '50', '40', '33', '25', '20']

function Form({ settings, element, ctx }: RenderProps) {
  const fields = readFields(settings)
  const formDomId = `bw-form-${element.id}`
  const owner = ctx.owner ?? (ctx.document ? { collection: ctx.document.collection, id: ctx.document.id } : null)
  const ref = owner ? `${owner.collection}:${owner.id}:${element.id}` : ''
  const endpoint = ctx.formEndpoint ?? DEFAULT_ENDPOINT
  const messages = readMessages(settings)
  const sp = ctx.request?.searchParams ?? {}
  const status = first(sp.bw_form) === element.id ? first(sp.bw_status) : undefined
  const statusText = status === 'success' ? messages.success : status === 'error' ? messages.error : ''
  const size = SIZES.includes(settings.input_size) ? settings.input_size : 'sm'
  const btnSize = SIZES.includes(settings.button_size) ? settings.button_size : 'sm'
  const values: Record<string, FieldValue> = {}
  for (const f of fields) if (isDataField(f) && f.field_value) values[f.custom_id] = String(f.field_value)

  const opts: FieldRenderOptions = {
    formId: formDomId,
    size,
    showLabels: truthy(settings.show_labels),
    markRequired: truthy(settings.mark_required),
    values,
  }
  const steps = splitSteps(fields)
  const multi = steps.length > 1
  const stepType: string = settings.step_type ?? 'number_text'
  const buttonText = String(settings.button_text || 'Send')
  const btnId = typeof settings.button_css_id === 'string' && /^[A-Za-z][\w-]*$/.test(settings.button_css_id) ? settings.button_css_id : undefined
  const submitWidth = (w: unknown) => (WIDTHS.includes(String(w)) ? String(w) : '100')
  const submitGroupClass = [
    'bw-field-group bw-submit-group',
    `bw-col-${submitWidth(settings.button_width)}`,
    settings.button_width_tablet ? `bw-md-col-${submitWidth(settings.button_width_tablet)}` : '',
    settings.button_width_mobile ? `bw-sm-col-${submitWidth(settings.button_width_mobile)}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const submit = (
    <button type="submit" className={`bw-btn bw-btn-${btnSize} bw-form-submit`} id={btnId}>
      <span className="bw-btn-text">{buttonText}</span>
    </button>
  )

  let body: ReactNode
  if (!multi) {
    body = (
      <div className="bw-form-fields">
        {fields.map((f) => (
          <Field key={f.custom_id} field={f} opts={opts} />
        ))}
        <div className={submitGroupClass}>{submit}</div>
      </div>
    )
  } else {
    const nextLabel = String(settings.step_next_label || 'Next')
    const prevLabel = String(settings.step_previous_label || 'Previous')
    body = steps.map((s, i) => {
      const last = i === steps.length - 1
      return (
        <div key={s.step?.custom_id ?? `step-${i}`} className={`bw-step${i === 0 ? ' is-active' : ''}`} data-step={i} aria-label={s.step?.field_label || `Step ${i + 1}`} role="group">
          <div className="bw-form-fields">
            {s.fields.map((f) => (
              <Field key={f.custom_id} field={f} opts={opts} />
            ))}
          </div>
          <div className="bw-step-nav">
            {i > 0 ? (
              <button type="button" className={`bw-btn bw-btn-${btnSize} bw-step-prev`}>
                {s.step?.previous_button || prevLabel}
              </button>
            ) : null}
            {last ? (
              submit
            ) : (
              <button type="button" className={`bw-btn bw-btn-${btnSize} bw-step-next`}>
                {s.step?.next_button || nextLabel}
              </button>
            )}
          </div>
        </div>
      )
    })
  }

  const indicator =
    multi && stepType !== 'none' ? (
      stepType === 'progress_bar' ? (
        <div className="bw-steps-progress">
          <div className="bw-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(100 / steps.length)}>
            <div className="bw-progress-bar" style={{ ['--bw-progress' as string]: `${Math.round(100 / steps.length)}%` }} />
          </div>
          <span className="bw-progress-label">
            Step <span data-bw-step-current>1</span> of {steps.length}
          </span>
        </div>
      ) : (
        <ol className="bw-steps">
          {steps.map((s, i) => (
            <li key={i} className={`bw-step-indicator${i === 0 ? ' is-active' : ''}`} data-step={i} aria-current={i === 0 ? 'step' : undefined}>
              {stepType !== 'text' ? <span className="bw-step-number">{i + 1}</span> : null}
              {stepType !== 'number' ? <span className="bw-step-label">{s.step?.field_label || `Step ${i + 1}`}</span> : null}
            </li>
          ))}
        </ol>
      )
    ) : null

  const anchor = typeof settings.form_id === 'string' && /^[A-Za-z][\w-]*$/.test(settings.form_id) ? settings.form_id : formDomId
  const clientFields = fields.map((f) => ({
    custom_id: f.custom_id,
    field_type: f.field_type,
    field_label: f.field_label,
    required: f.required,
    field_options: f.field_options,
    allow_multiple: f.allow_multiple,
    field_min: f.field_min,
    field_max: f.field_max,
    bw_logic: f.bw_logic,
    bw_pattern: f.bw_pattern,
    bw_error: f.bw_error,
  }))

  return (
    <form
      id={anchor}
      className="bw-form"
      action={endpoint}
      method="post"
      name={String(settings.form_name || 'form')}
      aria-label={String(settings.form_name || 'Form')}
      data-bw-form={element.id}
    >
      <input type="hidden" name="_bw_ref" value={ref} />
      <input type="hidden" name="_bw_return" value={ctx.request?.path ?? ''} />
      {indicator}
      {body}
      <div className="bw-form-message" role="status" aria-live="polite" data-state={status || undefined}>
        {statusText}
      </div>
      {ctx.mode !== 'edit' ? (
        <FormEnhancer formId={anchor} endpoint={endpoint} fields={clientFields} messages={messages} multi={multi} />
      ) : null}
    </form>
  )
}

export const form = defineWidget({
  type: 'form',
  title: 'Form',
  description: 'Contact, lead and multi-step forms with validation, conditional logic, emails and webhooks.',
  icon: 'form',
  category: 'forms',
  keywords: ['form', 'contact', 'lead', 'newsletter', 'subscribe', 'input', 'multi step', 'survey'],
  interactive: true,
  render: Form as never,
  sections: formSections,
  baseCss: FORM_CSS,
})
