import type { Registry } from '@blockwright/core'
import { form } from './form'
import { ENTRY_TAGS, entryFields } from './entry'

export { form, readFields, DEFAULT_ENDPOINT } from './form'
export { FIELD_TYPES, DEFAULT_FIELDS, fieldControls } from './controls'
export { FORM_CSS } from './styles'
export * from './types'
export { replacePlaceholders, emailLayout, htmlToText, allFieldsHtml, buildNotification, DEFAULT_NOTIFICATION_HTML, type Notification } from './email'
export { evaluateLogic, parseOptions } from './validate'

export const formElements = [form, entryFields]
export { ENTRY_TAGS, SAMPLE_ENTRY, entryFields, type EntryData } from './entry'

export function registerFormElements(registry: Registry) {
  registry.register(form)
  registry.register(entryFields)
  ENTRY_TAGS.forEach((t) => registry.registerTag(t))
}
