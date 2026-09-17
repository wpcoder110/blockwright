import { useEffect } from 'react'
import type { FieldValue, FormField, FormMessages } from './types'
import { fieldKey, normaliseValues, validateForm, visibleFields } from './validate'

export interface FormEnhancerProps {
  formId: string
  endpoint: string
  fields: FormField[]
  messages: FormMessages
  multi: boolean
}

function readValues(form: HTMLFormElement): Record<string, FieldValue> {
  const fd = new FormData(form)
  const raw: Record<string, unknown> = {}
  for (const key of new Set(fd.keys())) {
    if (key.startsWith('_bw')) continue
    const all = fd.getAll(key).filter((v): v is string => typeof v === 'string')
    raw[key] = key.endsWith('[]') ? all : (all[0] ?? '')
  }
  return normaliseValues(raw)
}

function enhance(form: HTMLFormElement, props: FormEnhancerProps): () => void {
  const { fields, messages, endpoint, multi } = props
  const startedAt = Date.now()
  const message = form.querySelector<HTMLElement>('.bw-form-message')
  const steps = Array.from(form.querySelectorAll<HTMLElement>('.bw-step'))
  const indicators = Array.from(form.querySelectorAll<HTMLElement>('.bw-step-indicator'))
  const progress = form.querySelector<HTMLElement>('.bw-progress')
  const progressCurrent = form.querySelector<HTMLElement>('[data-bw-step-current]')
  let current = 0
  const cleanups: Array<() => void> = []
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn as EventListener)
    cleanups.push(() => el.removeEventListener(type, fn as EventListener))
  }

  form.noValidate = true
  form.setAttribute('data-enhanced', '')

  const groups = () => Array.from(form.querySelectorAll<HTMLElement>('[data-field]'))

  const setMessage = (text: string, state: 'success' | 'error' | '') => {
    if (!message) return
    message.textContent = text
    if (state) message.setAttribute('data-state', state)
    else message.removeAttribute('data-state')
    message.setAttribute('role', state === 'error' ? 'alert' : 'status')
  }

  const applyLogic = () => {
    const visible = visibleFields(fields, readValues(form))
    for (const g of groups()) {
      const key = g.getAttribute('data-field') ?? ''
      const hide = !visible.has(key)
      if (g.hidden !== hide) g.hidden = hide
      g.querySelectorAll<HTMLInputElement>('input,select,textarea').forEach((i) => {
        i.disabled = hide
      })
    }
  }

  const showErrors = (errors: Record<string, string>, scope?: Set<string>) => {
    let firstInvalid: HTMLElement | null = null
    for (const g of groups()) {
      const key = g.getAttribute('data-field') ?? ''
      if (scope && !scope.has(key)) continue
      const err = g.querySelector<HTMLElement>('.bw-field-error')
      const text = errors[key]
      const inputs = g.querySelectorAll<HTMLElement>('input,select,textarea')
      inputs.forEach((i) => (text ? i.setAttribute('aria-invalid', 'true') : i.removeAttribute('aria-invalid')))
      if (err) {
        err.textContent = text ?? ''
        err.hidden = !text
      }
      if (text && !firstInvalid) firstInvalid = inputs[0] ?? null
    }
    return firstInvalid as HTMLElement | null
  }

  const stepKeys = (i: number) =>
    new Set(Array.from(steps[i]?.querySelectorAll<HTMLElement>('[data-field]') ?? []).map((g) => g.getAttribute('data-field') ?? ''))

  const showStep = (i: number) => {
    current = Math.max(0, Math.min(i, steps.length - 1))
    steps.forEach((s, n) => s.classList.toggle('is-active', n === current))
    indicators.forEach((el, n) => {
      el.classList.toggle('is-active', n === current)
      el.classList.toggle('is-done', n < current)
      if (n === current) el.setAttribute('aria-current', 'step')
      else el.removeAttribute('aria-current')
    })
    if (progress) {
      const pct = Math.round(((current + 1) / steps.length) * 100)
      progress.setAttribute('aria-valuenow', String(pct))
      progress.querySelector<HTMLElement>('.bw-progress-bar')?.style.setProperty('--bw-progress', `${pct}%`)
    }
    if (progressCurrent) progressCurrent.textContent = String(current + 1)
  }

  const validateStep = (i: number) => {
    const scope = stepKeys(i)
    const res = validateForm(fields, readValues(form), { messages, only: scope })
    const firstInvalid = showErrors(res.errors, scope)
    firstInvalid?.focus()
    return Object.keys(res.errors).length === 0
  }

  if (multi && steps.length) {
    showStep(0)
    steps.forEach((s, i) => {
      s.querySelectorAll<HTMLElement>('.bw-step-next').forEach((b) =>
        on(b, 'click', () => {
          if (validateStep(i)) {
            showStep(i + 1)
            steps[i + 1]?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea')?.focus()
          }
        }),
      )
      s.querySelectorAll<HTMLElement>('.bw-step-prev').forEach((b) => on(b, 'click', () => showStep(i - 1)))
    })
  }

  const onChange = (e: Event) => {
    const t = e.target as HTMLInputElement
    if (t?.type === 'range') {
      const out = t.parentElement?.querySelector('output')
      if (out) out.textContent = t.value
    }
    applyLogic()
    const group = t?.closest<HTMLElement>('[data-field]')
    if (group?.querySelector('[aria-invalid]')) {
      const key = group.getAttribute('data-field') ?? ''
      const res = validateForm(fields, readValues(form), { messages, only: new Set([key]) })
      showErrors(res.errors, new Set([key]))
    }
  }
  on(form, 'input', onChange)
  on(form, 'change', onChange)

  on(form, 'submit', async (e) => {
    e.preventDefault()
    if (form.getAttribute('aria-busy') === 'true') return
    if (multi && current < steps.length - 1) {
      if (validateStep(current)) showStep(current + 1)
      return
    }
    const values = readValues(form)
    const res = validateForm(fields, values, { messages })
    const firstInvalid = showErrors(res.errors)
    if (Object.keys(res.errors).length) {
      if (multi) {
        const key = Object.keys(res.errors)[0]!
        const idx = steps.findIndex((s) => s.querySelector(`[data-field="${CSS.escape(key)}"]`))
        if (idx >= 0) showStep(idx)
      }
      setMessage(messages.error, 'error')
      firstInvalid?.focus()
      return
    }
    form.setAttribute('aria-busy', 'true')
    setMessage('', '')
    try {
      const ref = (form.elements.namedItem('_bw_ref') as HTMLInputElement | null)?.value ?? ''
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ _bw_ref: ref, _bw_elapsed: Date.now() - startedAt, _bw_page: location.href, fields: values }),
      })
      const data = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string; errors?: Record<string, string>; redirect?: string }
      if (data.success) {
        setMessage(data.message || messages.success, 'success')
        form.reset()
        applyLogic()
        if (multi) showStep(0)
        if (data.redirect) window.location.assign(data.redirect)
      } else {
        const inv = showErrors(data.errors ?? {})
        setMessage(data.message || messages.error, 'error')
        inv?.focus()
      }
    } catch {
      setMessage(messages.server, 'error')
    } finally {
      form.removeAttribute('aria-busy')
    }
  })

  applyLogic()
  return () => {
    cleanups.forEach((c) => c())
    form.removeAttribute('data-enhanced')
  }
}

/**
 * Progressive enhancement for server-rendered forms: inline validation,
 * conditional logic, steps and background submission. Renders nothing.
 */
export function FormEnhancer(props: FormEnhancerProps) {
  const { formId } = props
  useEffect(() => {
    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) return
    return enhance(form, props)
    // props come from the server and do not change during the page's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId])
  return null
}

export { fieldKey }
