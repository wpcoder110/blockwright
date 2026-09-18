import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_KIT, createRegistry, type RenderContext } from '@blockwright/core'
import { validateLayout } from '@blockwright/schema'
import { RenderElements, buildLayout } from '@blockwright/renderer'
import { form } from '../src'
import { createReplacer, processSubmission, type FormServices } from '../src/server'
import { normaliseValues, parseOptions, splitSteps, validateForm, visibleFields } from '../src/validate'
import type { FormField } from '../src/types'

const fields: FormField[] = [
  { custom_id: 'name', field_type: 'text', field_label: 'Name', required: 'true' },
  { custom_id: 'email', field_type: 'email', field_label: 'Email', required: 'true' },
  { custom_id: 'topic', field_type: 'select', field_label: 'Topic', field_options: 'Sales|sales\nSupport|support' },
  {
    custom_id: 'order',
    field_type: 'text',
    field_label: 'Order number',
    required: 'true',
    bw_logic: { action: 'show', match: 'all', rules: [{ field: 'topic', operator: 'is', value: 'support' }] },
  },
  { custom_id: 'phone', field_type: 'tel', field_label: 'Phone', bw_pattern: '03[0-9]{9}', bw_error: 'Use the format 03XXXXXXXXX' },
  { custom_id: 'hp', field_type: 'honeypot' },
]

describe('validation', () => {
  it('parses options', () => {
    expect(parseOptions('A\nB|b')).toEqual([
      { label: 'A', value: 'A' },
      { label: 'B', value: 'b' },
    ])
  })

  it('reports required, invalid and pattern errors', () => {
    const r = validateForm(fields, { name: '', email: 'nope', phone: '12345' })
    expect(r.valid).toBe(false)
    expect(r.errors).toEqual({
      name: 'This field is required.',
      email: 'Please enter a valid value.',
      phone: 'Use the format 03XXXXXXXXX',
    })
  })

  it('skips hidden fields and applies conditional logic', () => {
    expect(visibleFields(fields, { topic: 'sales' }).has('order')).toBe(false)
    expect(visibleFields(fields, { topic: 'support' }).has('order')).toBe(true)
    const ok = validateForm(fields, { name: 'Ali', email: 'ali@example.pk', topic: 'sales', order: 'ignored' })
    expect(ok.valid).toBe(true)
    expect(ok.data.order).toBeUndefined()
    const missing = validateForm(fields, { name: 'Ali', email: 'ali@example.pk', topic: 'support' })
    expect(missing.errors.order).toBeDefined()
  })

  it('rejects option values that were not offered', () => {
    const r = validateForm(fields, { name: 'A', email: 'a@b.co', topic: 'hacked' })
    expect(r.errors.topic).toBeDefined()
  })

  it('flags honeypot spam', () => {
    expect(validateForm(fields, { name: 'A', email: 'a@b.co', hp: 'bot' }).spam).toBe(true)
  })

  it('normalises form-encoded input', () => {
    expect(normaliseValues({ 'form_fields[name]': 'Ali', 'form_fields[tags][]': ['a', 'b'], _bw_ref: 'x' })).toEqual({
      name: 'Ali',
      tags: ['a', 'b'],
    })
  })

  it('splits steps', () => {
    const steps = splitSteps([
      { custom_id: 's1', field_type: 'step', field_label: 'About you' },
      { custom_id: 'a', field_type: 'text' },
      { custom_id: 's2', field_type: 'step', field_label: 'Details' },
      { custom_id: 'b', field_type: 'text' },
    ])
    expect(steps.map((s) => s.fields.map((f) => f.custom_id))).toEqual([['a'], ['b']])
  })
})

describe('processing', () => {
  const settings = {
    form_name: 'Contact',
    form_fields: fields,
    submit_actions: ['save', 'email', 'email2', 'redirect'],
    email_to: 'owner@bechify.pk, not-an-email',
    email_subject: 'New lead: [field id="name"]',
    email_to_2: '[field id="email"]',
    redirect_to: { url: '/thanks?who=[field id="name"]' },
  }
  const meta = { formName: 'Contact', elementId: 'f1', owner: { collection: 'pages', id: 1 } }

  it('saves, emails and redirects', async () => {
    const sent: unknown[] = []
    const services: FormServices = {
      siteName: 'Bechify',
      sendEmail: async (m) => void sent.push(m),
      saveSubmission: vi.fn(async () => ({ id: 7 })),
      updateSubmission: vi.fn(async () => undefined),
    }
    const res = await processSubmission({ settings, input: { fields: { name: 'Ali <b>', email: 'ali@example.pk' } }, meta, services })
    expect(res.success).toBe(true)
    expect(res.submissionId).toBe(7)
    expect(res.redirect).toBe('/thanks?who=Ali%20%3Cb%3E')
    expect(sent).toHaveLength(2)
    const admin = sent[0] as { to: string[]; subject: string; html: string; replyTo?: string }
    expect(admin.to).toEqual(['owner@bechify.pk'])
    expect(admin.subject).toBe('New lead: Ali <b>')
    expect(admin.html).toContain('Ali &lt;b&gt;')
    expect((sent[1] as { to: string[] }).to).toEqual(['ali@example.pk'])
    expect(services.updateSubmission).toHaveBeenCalledWith(7, { actionLog: expect.any(Array) })
    expect(res.actionLog.map((a) => a.status)).toEqual(['success', 'success', 'success', 'success'])
  })

  it('returns field errors without running actions', async () => {
    const save = vi.fn()
    const res = await processSubmission({ settings, input: { fields: { name: '' } }, meta, services: { saveSubmission: save } })
    expect(res.status).toBe(400)
    expect(res.errors.name).toBeDefined()
    expect(save).not.toHaveBeenCalled()
  })

  it('silently drops spam', async () => {
    const save = vi.fn()
    const res = await processSubmission({ settings, input: { fields: { name: 'x', email: 'x@y.co', hp: 'spam' } }, meta, services: { saveSubmission: save } })
    expect(res.success).toBe(true)
    expect(res.spam).toBe(true)
    expect(save).not.toHaveBeenCalled()
  })

  it('reports failed actions but keeps the submission', async () => {
    const res = await processSubmission({
      settings: { ...settings, submit_actions: ['save', 'email'] },
      input: { fields: { name: 'A', email: 'a@b.co' } },
      meta,
      services: { saveSubmission: async () => ({ id: 1 }) },
    })
    expect(res.success).toBe(false)
    expect(res.status).toBe(500)
    expect(res.actionLog).toEqual([
      { action: 'save', status: 'success' },
      { action: 'email', status: 'failed', message: 'Email is not configured' },
    ])
  })

  it('replaces shortcodes', () => {
    const replace = createReplacer({ form_name: 'Contact' }, { meta, values: {}, fields: [{ id: 'name', label: 'Name', type: 'text', value: 'Sara' }] }, {})
    expect(replace('{form_name}: [field id="name"] / [all-fields]')).toBe('Contact: Sara / Name: Sara')
  })
})

describe('form widget', () => {
  const registry = createRegistry([form])
  const ctx: RenderContext = {
    registry,
    kit: DEFAULT_KIT,
    mode: 'live',
    document: { collection: 'pages', id: 42, data: {} },
    request: { path: '/contact', searchParams: {} },
  }

  it('renders an accessible, progressively enhanced form', async () => {
    const layout = validateLayout([{ id: 'frm0001', elType: 'widget', widgetType: 'form', settings: { form_fields: fields, button_text: 'Send message' } }]).data!
    const built = await buildLayout(layout, ctx)
    const html = renderToStaticMarkup(<RenderElements items={built.prepared} ctx={ctx} />)
    expect(html).toContain('action="/api/bw/forms/submit" method="post"')
    expect(html).toContain('name="_bw_ref" value="pages:42:frm0001"')
    expect(html).toContain('<label for="bw-form-frm0001-name" class="bw-field-label">Name</label>')
    expect(html).toContain('name="form_fields[email]"')
    expect(html).toContain('type="email"')
    expect(html).toContain('aria-describedby="bw-form-frm0001-email-error"')
    // conditional field starts hidden
    expect(html).toMatch(/data-field="order" hidden=""/)
    expect(html).toContain('class="bw-hp" aria-hidden="true"')
    expect(html).toContain('Send message')
    expect(built.compiled.base.form).toContain('.bw-form-fields')
  })

  it('renders steps and style CSS', async () => {
    const layout = validateLayout([
      {
        id: 'frm0002',
        elType: 'widget',
        widgetType: 'form',
        settings: {
          form_fields: [
            { custom_id: 's1', field_type: 'step', field_label: 'You' },
            { custom_id: 'name', field_type: 'text', field_label: 'Name' },
            { custom_id: 's2', field_type: 'step', field_label: 'Project' },
            { custom_id: 'budget', field_type: 'rating', field_label: 'Budget' },
          ],
          step_type: 'number_text',
          field_border_color: '#ff0000',
          label_typography_typography: 'custom',
          label_typography_font_size: { unit: 'px', size: 13 },
          button_align_mobile: 'center',
        },
      },
    ]).data!
    const built = await buildLayout(layout, ctx)
    const html = renderToStaticMarkup(<RenderElements items={built.prepared} ctx={ctx} />)
    expect(html).toContain('<ol class="bw-steps">')
    expect(html).toContain('class="bw-step is-active" data-step="0"')
    expect(html).toContain('bw-step-next')
    expect(html).toContain('<legend class="bw-field-label">Budget</legend>')
    expect(built.compiled.css).toContain('.bw-el-frm0002 .bw-field{border-color:#ff0000}')
    expect(built.compiled.css).toContain('.bw-el-frm0002 .bw-field-label,.bw-el-frm0002 .bw-option label{font-size:13px}')
    expect(built.compiled.css).toContain('@media (max-width:767px){.bw-el-frm0002{--bw-btn-justify:center;--bw-btn-w:auto}}')
  })

  it('shows the no-JavaScript result message', async () => {
    const layout = validateLayout([{ id: 'frm0003', elType: 'widget', widgetType: 'form', settings: {} }]).data!
    const c = { ...ctx, request: { path: '/contact', searchParams: { bw_form: 'frm0003', bw_status: 'success' } } }
    const built = await buildLayout(layout, c)
    const html = renderToStaticMarkup(<RenderElements items={built.prepared} ctx={c} />)
    expect(html).toContain('data-state="success">Thanks! Your message has been sent.</div>')
    // default fields are applied
    expect(html).toContain('name="form_fields[message]"')
  })
})

describe('email notifications', () => {
  const fields2: FormField[] = [
    { custom_id: 'name', field_type: 'text', field_label: 'Name' },
    { custom_id: 'email', field_type: 'email', field_label: 'Email' },
    { custom_id: 'topic', field_type: 'select', field_label: 'Topic', field_options: 'Sales|sales\nSupport|support' },
  ]
  const meta = { formName: 'Contact', elementId: 'f1', owner: { collection: 'pages', id: 1 } }

  it('sends each active notification to several recipients, honouring routing rules', async () => {
    const sent: Array<{ to: string[]; cc?: string[]; subject: string; html: string; text: string; replyTo?: string }> = []
    const res = await processSubmission({
      settings: {
        form_name: 'Contact',
        form_fields: fields2,
        submit_actions: ['save', 'notifications'],
        bw_notifications: [
          { name: 'Team', to: 'a@bechify.pk, b@bechify.pk', cc: 'c@bechify.pk', subject: 'Lead #{entry_id} from [field id="name"]', message_html: '<p>Hi team</p><p>[all-fields]</p><p><a href="{entry_url}">Open</a></p>', reply_to: '[field id="email"]' },
          { name: 'Sales only', to: 'sales@bechify.pk', bw_route: { action: 'show', match: 'all', rules: [{ field: 'topic', operator: 'is', value: 'sales' }] } },
          { name: 'Disabled', enabled: '', to: 'x@bechify.pk' },
          { name: 'Visitor', to: '[field id="email"]', format: 'plain', message_text: 'Thanks [field id="name"]!\n\n[all-fields]', wrap: '' },
        ],
      },
      input: { fields: { name: 'Ali <script>', email: 'ali@example.pk', topic: 'support' } },
      meta,
      services: {
        siteName: 'Bechify',
        saveSubmission: async () => ({ id: 42 }),
        entryUrl: (id) => `https://bechify.pk/admin/entries/${id}`,
        sendEmail: async (m) => void sent.push(m as never),
      },
    })
    expect(res.success).toBe(true)
    expect(sent.map((m) => m.to)).toEqual([['a@bechify.pk', 'b@bechify.pk'], ['ali@example.pk']])
    const team = sent[0]!
    expect(team.cc).toEqual(['c@bechify.pk'])
    expect(team.replyTo).toBe('ali@example.pk')
    expect(team.subject).toBe('Lead #42 from Ali <script>')
    expect(team.html).toContain('<!doctype html>')
    expect(team.html).toContain('Bechify')
    expect(team.html).toContain('Ali &lt;script&gt;')
    expect(team.html).not.toContain('<script>')
    expect(team.html).toContain('href="https://bechify.pk/admin/entries/42"')
    expect(team.text).toContain('Hi team')
    const visitor = sent[1]!
    expect(visitor.text).toBe('Thanks Ali <script>!\n\nName: Ali <script>\nEmail: ali@example.pk\nTopic: support')
    expect(visitor.html.startsWith('<!doctype')).toBe(false)
    expect(res.actionLog.find((a) => a.action === 'notifications')?.message).toBe('2 sent')
  })

  it('reports notifications without a recipient', async () => {
    const res = await processSubmission({
      settings: { form_fields: fields2, submit_actions: ['notifications'], bw_notifications: [{ name: 'Broken', to: 'not an email' }] },
      input: { fields: { name: 'A' } },
      meta,
      services: { sendEmail: async () => undefined },
    })
    expect(res.success).toBe(false)
    expect(res.actionLog[0]!.message).toBe('Broken: no valid recipient')
  })
})

describe('multi-step first paint', () => {
  it('collapses steps before JavaScript runs and reveals them without it', async () => {
    const registry2 = createRegistry([form])
    const c: RenderContext = { registry: registry2, kit: DEFAULT_KIT, mode: 'live', request: { path: '/contact', searchParams: {} } }
    const layout = validateLayout([
      {
        id: 'stp0001',
        elType: 'widget',
        widgetType: 'form',
        settings: {
          form_fields: [
            { custom_id: 's1', field_type: 'step', field_label: 'One' },
            { custom_id: 'a', field_type: 'text', field_label: 'A' },
            { custom_id: 's2', field_type: 'step', field_label: 'Two' },
            { custom_id: 'b', field_type: 'text', field_label: 'B' },
          ],
        },
      },
    ]).data!
    const built = await buildLayout(layout, c)
    const html = renderToStaticMarkup(<RenderElements items={built.prepared} ctx={c} />)
    // only the first step carries is-active, and the base CSS hides the rest immediately
    expect(html).toContain('class="bw-step is-active" data-step="0"')
    expect(html).toContain('class="bw-step" data-step="1"')
    expect(built.compiled.base.form).toContain('.bw-form .bw-step:not(.is-active){display:none}')
    // visitors without JavaScript see every step instead of a dead end
    expect(html).toContain('<noscript>')
    expect(html).toContain('.bw-step{display:block!important}')
  })
})
