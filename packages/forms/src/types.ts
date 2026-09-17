export type FieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'url'
  | 'tel'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'acceptance'
  | 'hidden'
  | 'password'
  | 'html'
  | 'step'
  | 'honeypot'
  | 'rating'
  | 'range'

export type LogicOperator = 'is' | 'is_not' | 'contains' | 'not_contains' | 'is_empty' | 'not_empty' | 'gt' | 'lt'

export interface LogicRule {
  field: string
  operator: LogicOperator
  value?: string
}

/** Conditional logic for a field. Blockwright extension. */
export interface FieldLogic {
  action: 'show' | 'hide'
  match: 'all' | 'any'
  rules: LogicRule[]
}

/** A form field, stored as an item of the `form_fields` repeater. */
export interface FormField {
  _id?: string
  custom_id: string
  field_type: FieldType
  field_label?: string
  placeholder?: string
  required?: 'true' | '' | boolean
  width?: string
  width_tablet?: string
  width_mobile?: string
  field_options?: string
  allow_multiple?: 'true' | '' | boolean
  inline_list?: string
  select_size?: number | string
  rows?: number | string
  field_value?: string
  field_html?: string
  field_min?: number | string
  field_max?: number | string
  field_step?: number | string
  acceptance_text?: string
  checked_by_default?: 'true' | '' | boolean
  css_classes?: string
  previous_button?: string
  next_button?: string
  autocomplete?: string
  bw_logic?: FieldLogic | null
  bw_pattern?: string
  bw_error?: string
  bw_icon?: string
  [key: string]: unknown
}

export interface FormMessages {
  success: string
  error: string
  required: string
  invalid: string
  server: string
}

export type FieldValue = string | string[]

export interface FieldResult {
  id: string
  label: string
  type: FieldType
  value: FieldValue
}

export interface ValidationOutput {
  valid: boolean
  errors: Record<string, string>
  /** Clean values of visible, data-carrying fields. */
  data: Record<string, FieldValue>
  fields: FieldResult[]
  spam: boolean
}
