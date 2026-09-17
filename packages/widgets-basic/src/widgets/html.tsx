import { type RenderProps, code, defineWidget, section } from '@blockwright/core'

function Html({ settings }: RenderProps) {
  const html = String(settings.html ?? '')
  if (!html) return null
  // Only users allowed to post unfiltered HTML can save this widget
  return <div className="bw-html" dangerouslySetInnerHTML={{ __html: html }} />
}

export const html = defineWidget({
  type: 'html',
  title: 'Custom HTML',
  description: 'Paste your own HTML. Only administrators can edit it.',
  icon: 'code',
  category: 'advanced',
  keywords: ['html', 'code', 'embed', 'script'],
  render: Html as never,
  sections: [
    section('section_title', 'HTML', [code('html', { label: 'HTML code', language: 'html', restricted: true, rows: 20 })]),
  ],
})
