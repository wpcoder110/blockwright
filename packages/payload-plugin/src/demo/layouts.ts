import { buildTagString, generateId, type Element } from '@blockwright/schema'

type S = Record<string, unknown>

const px = (size: number, unit = 'px') => ({ unit, size, sizes: [] })
const box = (t: number, r = t, b = t, l = r, unit = 'px') => ({ unit, top: t, right: r, bottom: b, left: l, isLinked: false })
const gap = (n: number) => ({ unit: 'px', column: n, row: n, isLinked: true })
const tag = (name: string, settings: S = {}) => buildTagString({ id: generateId(), name, settings })
const color = (id: string) => `globals/colors?id=${id}`
const typo = (id: string) => `globals/typography?id=${id}`

export const frame = (settings: S, elements: Element[], isInner = true): Element => ({
  id: generateId(),
  elType: 'container',
  isInner,
  settings,
  elements,
})

export const widget = (widgetType: string, settings: S): Element =>
  ({ id: generateId(), elType: 'widget', widgetType, settings, elements: [] }) as Element

const heading = (title: string, size: string, extra: S = {}) => widget('heading', { title, header_size: size, ...extra })
const text = (html: string, extra: S = {}) => widget('text-editor', { editor: html, ...extra })
const button = (label: string, url: string, extra: S = {}) => widget('button', { text: label, link: { url }, ...extra })

/* ------------------------------------------------------------------ */

export function headerLayout(menuId?: string | number): Element[] {
  return [
    frame(
      {
        html_tag: 'div',
        content_width: 'boxed',
        flex_direction: 'row',
        flex_justify_content: 'space-between',
        flex_align_items: 'center',
        flex_wrap: 'nowrap',
        flex_gap: gap(16),
        padding: box(10, 20),
        background_background: 'classic',
        background_color: '#ffffff',
        border_border: 'solid',
        border_width: box(0, 0, 1, 0),
        border_color: '#e6e8ee',
        _position: 'sticky',
        _offset_y: px(0),
        _z_index: 50,
      },
      [
        heading('Site name', 'p', {
          __dynamic__: { title: tag('site-title') },
          link: { url: '/' },
          typography_typography: 'custom',
          typography_font_size: px(20),
          typography_font_weight: '700',
          typography_letter_spacing: px(-0.3),
          _element_width: 'auto',
          _flex_size: 'none',
        }),
        widget('nav-menu', {
          menu: menuId ? String(menuId) : '',
          align_items: 'end',
          align_items_mobile: 'end',
          pointer: 'underline',
          dropdown: 'tablet',
          full_width: 'yes',
          bw_label: 'Main menu',
          padding_horizontal_menu_item: px(14),
          __globals__: { color_menu_item: color('primary'), color_menu_item_hover: color('accent'), color_menu_item_active: color('accent'), pointer_color_menu_item_hover: color('accent') },
          _flex_size: 'grow',
        }),
        button('Request a quote', '/contact', { size: 'xs', _flex_size: 'none', hide_mobile: 'hidden-mobile' }),
      ],
      false,
    ),
  ]
}

export function footerLayout(): Element[] {
  return [
    frame(
      {
        html_tag: 'div',
        content_width: 'boxed',
        flex_direction: 'row',
        flex_direction_mobile: 'column',
        flex_justify_content: 'space-between',
        flex_gap: gap(24),
        padding: box(48, 20),
        background_background: 'classic',
        __globals__: { background_color: color('primary') },
      },
      [
        frame({ padding: box(0), flex_gap: gap(8), content_width: 'full' }, [
          heading('Site name', 'p', {
            __dynamic__: { title: tag('site-title') },
            title_color: '#ffffff',
            typography_typography: 'custom',
            typography_font_size: px(18),
          }),
          text('<p>Hand block-printed textiles from a small studio in Lahore.</p>', { text_color: '#c9d1e3' }),
        ]),
        frame({ padding: box(0), flex_gap: gap(8), content_width: 'full', flex_align_items: 'flex-end', flex_align_items_mobile: 'flex-start' }, [
          text('<p><a href="/contact">Request a quote</a></p>', { link_color: '#ffffff', link_hover_color: '#9ee3d9' }),
          text('<p>Built with Blockwright by Ahmer Hassan, CEO at <a href="https://redlionstech.com" target="_blank" rel="noopener">redlionstech.com</a></p>', {
            text_color: '#8f9bb8',
            link_color: '#ffffff',
            link_hover_color: '#9ee3d9',
            typography_typography: 'custom',
            typography_font_size: px(13),
          }),
        ]),
      ],
      false,
    ),
  ]
}

export function notFoundLayout(): Element[] {
  return [
    frame({ content_width: 'boxed', min_height: px(60, 'vh'), flex_justify_content: 'center', flex_align_items: 'flex-start', padding: box(80, 20), flex_gap: gap(16) }, [
      heading('This page wandered off', 'h1', { typography_typography: 'custom', typography_font_size: px(48), typography_font_size_mobile: px(32) }),
      text('<p>The address may be mistyped, or the page was moved. Try the home page instead.</p>'),
      button('Go to the home page', '/', { size: 'md' }),
    ], false),
  ]
}

const featureCard = (title: string, body: string) =>
  frame(
    {
      padding: box(28),
      flex_gap: gap(10),
      background_background: 'classic',
      background_color: '#ffffff',
      border_border: 'solid',
      border_width: box(1),
      border_color: '#e3e6ee',
      border_radius: box(10),
      _animation: 'fadeInUp',
    },
    [
      heading(title, 'h3', { typography_typography: 'custom', typography_font_size: px(20) }),
      text(`<p>${body}</p>`),
    ],
  )

export function homeLayout(): Element[] {
  return [
    frame(
      {
        html_tag: 'section',
        content_width: 'boxed',
        boxed_width: px(960),
        min_height: px(70, 'vh'),
        flex_justify_content: 'center',
        flex_align_items: 'flex-start',
        flex_gap: gap(20),
        padding: box(96, 20),
        padding_mobile: box(56, 20),
        background_background: 'gradient',
        background_color: '#1e2a4a',
        background_color_b: '#0f766e',
        background_gradient_angle: { unit: 'deg', size: 135 },
      },
      [
        heading('Hand block-printed textiles, made in Lahore', 'h1', {
          title_color: '#ffffff',
          typography_typography: 'custom',
          typography_font_size: px(60),
          typography_font_size_tablet: px(46),
          typography_font_size_mobile: px(34),
          typography_line_height: px(1.05, 'em'),
          typography_letter_spacing: px(-1),
          _element_width: 'initial',
          _element_custom_width: px(760),
        }),
        text('<p>Every piece is carved, dyed and stamped by hand in batches of fifty or fewer. Tell us what you need and we will send a quote within two working days.</p>', {
          text_color: '#dbe4f3',
          typography_typography: 'custom',
          typography_font_size: px(19),
          _element_width: 'initial',
          _element_custom_width: px(620),
        }),
        frame({ flex_direction: 'row', flex_gap: gap(12), padding: box(8, 0, 0, 0), content_width: 'full', flex_wrap: 'wrap' }, [
          button('Request a quote', '/contact', { size: 'md', background_background: 'classic', background_color: '#ffffff', button_text_color: '#1e2a4a', button_background_hover_color: '#e6f4f1' }),
          button('See how we work', '#process', {
            size: 'md',
            background_background: 'classic',
            background_color: 'transparent',
            border_border: 'solid',
            border_width: box(1),
            border_color: '#ffffff',
            button_hover_border_color: '#9ee3d9',
            hover_color: '#9ee3d9',
          }),
        ]),
      ],
      false,
    ),
    frame(
      { html_tag: 'section', _element_id: 'process', content_width: 'boxed', padding: box(80, 20), flex_gap: gap(32), background_background: 'classic', background_color: '#f5f6fa' },
      [
        frame({ padding: box(0), flex_gap: gap(8), content_width: 'full' }, [
          heading('How an order comes together', 'h2', { typography_typography: 'custom', typography_font_size: px(36), typography_font_size_mobile: px(28) }),
          text('<p>Three steps, from your first message to a parcel at your door.</p>'),
        ]),
        frame(
          {
            container_type: 'grid',
            content_width: 'full',
            padding: box(0),
            grid_columns_grid: { unit: 'fr', size: 3 },
            grid_columns_grid_tablet: { unit: 'fr', size: 2 },
            grid_columns_grid_mobile: { unit: 'fr', size: 1 },
            grid_gaps: gap(20),
          },
          [
            featureCard('You describe the piece', 'Fabric, size, motif and colours. Photos of references help, but a few sentences are enough.'),
            featureCard('We carve and sample', 'Blocks are cut from sheesham wood. You approve a printed swatch before the full run starts.'),
            featureCard('Printed, washed, shipped', 'Natural dyes are fixed and washed twice. Orders ship across Pakistan within three weeks.'),
          ],
        ),
      ],
      false,
    ),
    frame(
      {
        html_tag: 'section',
        content_width: 'boxed',
        boxed_width: px(720),
        padding: box(80, 20),
        flex_gap: gap(16),
      },
      [
        heading('Have a question first?', 'h2', { typography_typography: 'custom', typography_font_size: px(32), align: 'center' }),
        text('<p>Send us a short message and we will reply by email.</p>', { align: 'center' }),
        widget('form', {
          form_name: 'Home contact',
          form_fields: [
            { _id: 'name', custom_id: 'name', field_type: 'text', field_label: 'Name', placeholder: 'Your name', required: 'true', width: '50', width_mobile: '100', autocomplete: 'name' },
            { _id: 'email', custom_id: 'email', field_type: 'email', field_label: 'Email', placeholder: 'you@example.com', required: 'true', width: '50', width_mobile: '100' },
            { _id: 'message', custom_id: 'message', field_type: 'textarea', field_label: 'Message', required: 'true', rows: 5 },
            { _id: 'hp', custom_id: 'hp', field_type: 'honeypot' },
          ],
          button_text: 'Send message',
          submit_actions: ['save', 'email'],
          email_subject: 'New question from [field id="name"]',
          field_border_radius: box(6),
          button_border_radius: box(6),
          __globals__: { button_background_color: color('accent') },
          button_typography_typography: 'custom',
          __dynamic__: {},
          label_typography_typography: 'custom',
          label_typography_font_weight: '600',
        }),
      ],
      false,
    ),
  ]
}

export function contactLayout(): Element[] {
  return [
    frame(
      { html_tag: 'section', content_width: 'boxed', boxed_width: px(760), padding: box(72, 20), flex_gap: gap(16) },
      [
        heading('Request a quote', 'h1', { typography_typography: 'custom', typography_font_size: px(44), typography_font_size_mobile: px(32) }),
        text('<p>Two short steps. Fields marked with * are required.</p>'),
        widget('form', {
          form_name: 'Quote request',
          step_type: 'number_text',
          form_fields: [
            { _id: 's1', custom_id: 'step_you', field_type: 'step', field_label: 'About you' },
            { _id: 'name', custom_id: 'name', field_type: 'text', field_label: 'Full name', required: 'true', width: '50', width_mobile: '100', autocomplete: 'name' },
            { _id: 'email', custom_id: 'email', field_type: 'email', field_label: 'Email', required: 'true', width: '50', width_mobile: '100' },
            {
              _id: 'phone',
              custom_id: 'phone',
              field_type: 'tel',
              field_label: 'Mobile number',
              placeholder: '03XXXXXXXXX',
              bw_pattern: '03[0-9]{9}',
              bw_error: 'Enter an 11-digit number starting with 03.',
              width: '50',
              width_mobile: '100',
            },
            { _id: 'city', custom_id: 'city', field_type: 'select', field_label: 'City', placeholder: 'Choose a city', field_options: 'Lahore\nKarachi\nIslamabad\nOther', width: '50', width_mobile: '100' },
            { _id: 'city_other', custom_id: 'city_other', field_type: 'text', field_label: 'Which city?', required: 'true', bw_logic: { action: 'show', match: 'all', rules: [{ field: 'city', operator: 'is', value: 'Other' }] } },
            { _id: 's2', custom_id: 'step_order', field_type: 'step', field_label: 'Your order' },
            { _id: 'product', custom_id: 'product', field_type: 'radio', field_label: 'What would you like?', required: 'true', inline_list: 'true', field_options: 'Bedsheets|bedsheets\nCushion covers|cushions\nTable linen|table\nSomething custom|custom' },
            { _id: 'size', custom_id: 'size', field_type: 'textarea', field_label: 'Describe the custom piece', required: 'true', rows: 3, bw_logic: { action: 'show', match: 'all', rules: [{ field: 'product', operator: 'is', value: 'custom' }] } },
            { _id: 'qty', custom_id: 'qty', field_type: 'number', field_label: 'Quantity', required: 'true', field_min: 1, field_max: 500, field_value: '10', width: '50' },
            { _id: 'deadline', custom_id: 'deadline', field_type: 'date', field_label: 'Needed by', width: '50' },
            { _id: 'colours', custom_id: 'colours', field_type: 'checkbox', field_label: 'Colours', inline_list: 'true', field_options: 'Indigo\nMadder red\nTurmeric yellow\nIron black' },
            { _id: 'budget', custom_id: 'budget', field_type: 'range', field_label: 'Budget (thousand PKR)', field_min: 5, field_max: 500, field_step: 5, field_value: '50' },
            { _id: 'terms', custom_id: 'terms', field_type: 'acceptance', acceptance_text: 'I agree to be contacted about this quote.', required: 'true' },
            { _id: 'hp', custom_id: 'hp', field_type: 'honeypot' },
          ],
          button_text: 'Send request',
          submit_actions: ['save', 'notifications'],
          bw_notifications: [
            {
              _id: 'n-team',
              name: 'Team notification',
              enabled: 'yes',
              to: '',
              subject: 'Quote request from [field id="name"]',
              format: 'html',
              message_html: '<p><strong>[field id="name"]</strong> asked for a quote.</p><p>[all-fields]</p><p><a href="{entry_url}">Open the entry</a></p>',
              wrap: 'yes',
              reply_to: '[field id="email"]',
            },
            {
              _id: 'n-custom',
              name: 'Custom orders',
              enabled: 'yes',
              to: '',
              subject: 'Custom piece requested by [field id="name"]',
              format: 'html',
              message_html: '<p>A custom piece was requested:</p><p>[field id="size"]</p>',
              wrap: 'yes',
              bw_route: { action: 'show', match: 'all', rules: [{ field: 'product', operator: 'is', value: 'custom' }] },
            },
            {
              _id: 'n-visitor',
              name: 'Reply to the visitor',
              enabled: 'yes',
              to: '[field id="email"]',
              subject: 'We received your quote request',
              format: 'html',
              message_html: '<p>Hi [field id="name"],</p><p>Thanks for your request. We will reply within two working days.</p><p>[all-fields]</p>',
              wrap: 'yes',
            },
          ],
          custom_messages: 'true',
          success_message: 'Thanks! We will send your quote within two working days.',
          input_size: 'md',
          button_size: 'md',
          field_border_radius: box(6),
          button_border_radius: box(6),
          column_gap: px(16),
          row_gap: px(16),
          __globals__: { step_active_primary_color: color('accent'), button_background_color: color('accent'), label_typography_typography: typo('secondary') },
        }),
      ],
      false,
    ),
  ]
}

export function pdfLayout(): Element[] {
  return [
    frame({ content_width: 'full', padding: box(0), flex_gap: gap(18) }, [
      frame({ content_width: 'full', padding: box(0, 0, 14, 0), flex_direction: 'row', flex_justify_content: 'space-between', flex_align_items: 'flex-end', border_border: 'solid', border_width: box(0, 0, 2, 0), __globals__: { border_color: color('primary') } }, [
        heading('Site name', 'p', {
          __dynamic__: { title: tag('site-title') },
          typography_typography: 'custom',
          typography_font_size: px(22),
          typography_font_weight: '700',
        }),
        text('<p>Entry</p>', {
          __dynamic__: { editor: tag('entry-id', { before: 'Entry #' }) },
          align: 'right',
          text_color: '#5b6b8c',
        }),
      ]),
      heading('Form name', 'h1', {
        __dynamic__: { title: tag('entry-form') },
        typography_typography: 'custom',
        typography_font_size: px(26),
      }),
      text('<p>Date</p>', { __dynamic__: { editor: tag('entry-date', { format: 'long', before: 'Received on ' }) }, text_color: '#5b6b8c' }),
      widget('entry-fields', { label_background: '#f3f5f9', bw_exclude: 'hp, terms' }),
      text('<p>Printed from Blockwright. Built by Ahmer Hassan, CEO at redlionstech.com</p>', {
        text_color: '#8f9bb8',
        typography_typography: 'custom',
        typography_font_size: px(11),
        align: 'center',
      }),
    ], false),
  ]
}
