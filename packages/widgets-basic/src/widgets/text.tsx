import { type RenderProps, ALIGN_OPTIONS, choose, color, defineWidget, section, slider, typography, wysiwyg, textShadow } from '@blockwright/core'

const W = '{{WRAPPER}}'

function Text({ settings, ctx }: RenderProps) {
  const html = String(settings.editor ?? '')
  if (!html && ctx.mode === 'live') return null
  // HTML is sanitised when the document is saved
  return <div className="bw-text" dangerouslySetInnerHTML={{ __html: html }} />
}

export const textEditor = defineWidget({
  type: 'text-editor',
  title: 'Text',
  description: 'Rich text with paragraphs, lists and links.',
  icon: 'text',
  category: 'essentials',
  keywords: ['text', 'paragraph', 'editor', 'content', 'wysiwyg'],
  aliases: ['text'],
  render: Text as never,
  sections: [
    section('section_editor', 'Text', [
      wysiwyg('editor', {
        label: 'Content',
        default: '<p>Add your text here. Select it to start writing.</p>',
        dynamic: ['text', 'html'],
      }),
    ]),
    section(
      'section_style',
      'Text',
      [
        choose('align', { label: 'Alignment', responsive: true, options: ALIGN_OPTIONS, selectors: { [W]: 'text-align: {{VALUE}};' } }),
        color('text_color', { label: 'Text color', global: 'colors', selectors: { [W]: 'color: {{VALUE}};' } }),
        ...typography('typography', { selector: W }),
        ...textShadow('text_shadow', { selector: W }),
        slider('paragraph_spacing', {
          label: 'Paragraph spacing',
          responsive: true,
          units: ['px', 'em', 'rem', 'vh', 'custom'],
          selectors: { [`${W} p`]: 'margin-block-end: {{SIZE}}{{UNIT}};' },
        }),
        color('link_color', { label: 'Link color', global: 'colors', selectors: { [`${W} a`]: 'color: {{VALUE}};' } }),
        color('link_hover_color', { label: 'Link hover color', global: 'colors', selectors: { [`${W} a:hover, ${W} a:focus-visible`]: 'color: {{VALUE}};' } }),
      ],
      { tab: 'style' },
    ),
  ],
  baseCss:
    '.bw-w-text-editor{color:var(--bw-c-text);font-family:var(--bw-t-text-font-family,inherit);font-weight:var(--bw-t-text-font-weight,400);' +
    'line-height:var(--bw-t-text-line-height,1.6)}.bw-text>:first-child{margin-top:0}.bw-text>:last-child{margin-bottom:0}',
})
