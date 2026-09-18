import { BlockwrightEditor } from '@blockwright/editor'
import { redirect } from 'next/navigation'
import { compileCss, kitToCss, type RenderContext } from '@blockwright/core'
import { RenderElements, buildLayout } from '@blockwright/renderer'
import { findElement, type Element } from '@blockwright/schema'
import { PrintButton } from '@blockwright/payload-plugin/client'
import type { BasePayload } from 'payload'
import { getBlockwrightRuntime, getCustomWidgetSpecs, getRegistry, getSiteInfo, isCollectionPublic } from './runtime'

const card: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-m, 6px)',
  padding: '16px 20px',
  background: 'var(--theme-elevation-0)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

/** Dashboard panel that walks new users through setting up Blockwright. */
export async function BlockwrightWelcome({ payload, searchParams }: { payload?: BasePayload; searchParams?: Record<string, string | string[] | undefined> }) {
  if (!payload) return null
  let rt
  try {
    rt = getBlockwrightRuntime(payload)
  } catch {
    return null
  }
  const { options } = rt
  const admin = payload.config.routes?.admin ?? '/admin'
  const count = async (collection: string, where?: Record<string, unknown>) => {
    try {
      const res = await payload.count({ collection: collection as never, where: where as never, overrideAccess: true })
      return res.totalDocs
    } catch {
      return 0
    }
  }
  const [templates, entries, pages, mediaPublic] = await Promise.all([
    count(options.templatesSlug),
    count(options.submissionsSlug, { status: { equals: 'new' } }),
    options.collections[0] ? count(options.collections[0]) : Promise.resolve(0),
    options.mediaCollection ? isCollectionPublic(payload, options.mediaCollection) : Promise.resolve(true),
  ])
  const mediaWarning = options.mediaCollection && !mediaPublic ? options.mediaCollection : null
  const first = options.collections[0]
  const api = payload.config.routes?.api ?? '/api'
  const demo = searchParams?.bw_demo
  const demoMessage =
    demo === 'done'
      ? 'Demo content installed: a home page, a quote form, a header, a footer and a 404 page.'
      : demo === 'failed'
        ? 'The demo content could not be installed. Check the server log for details.'
        : demo === 'forbidden'
          ? 'Only administrators can install demo content.'
          : null
  const steps = [
    { done: true, title: 'Set your colors and fonts', text: 'Every page uses the site style, so start here.', href: `${admin}/globals/${options.kitSlug}`, action: 'Open site style' },
    first
      ? { done: pages > 0, title: 'Build a page', text: `${pages} ${pages === 1 ? 'document' : 'documents'} in ${first}.`, href: `${admin}/collections/${first}/create`, action: 'Create a page' }
      : null,
    { done: templates > 0, title: 'Add a header and footer', text: 'Create a template and set its display condition to include/general.', href: `${admin}/collections/${options.templatesSlug}/create`, action: 'Create a template' },
    { done: false, title: 'Check your form entries', text: entries ? `${entries} new ${entries === 1 ? 'entry' : 'entries'} waiting.` : 'No new entries yet.', href: `${admin}/collections/${options.submissionsSlug}`, action: 'View entries' },
  ].filter(Boolean) as Array<{ done: boolean; title: string; text: string; href: string; action: string }>

  return (
    <section aria-labelledby="bw-welcome-title" style={{ marginBottom: 'calc(var(--base, 20px) * 1.5)' }}>
      <h2 id="bw-welcome-title" style={{ margin: '0 0 4px' }}>
        Blockwright
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '0 0 16px' }}>
        <p style={{ margin: 0, color: 'var(--theme-elevation-600)' }}>Design pages, headers, footers and forms for this site.</p>
        {pages === 0 && templates === 0 ? (
          <form method="post" action={`${api}/bw/demo`}>
            <button type="submit" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }}>
              Install demo content
            </button>
          </form>
        ) : (
          <details style={{ fontSize: 13 }}>
            <summary style={{ cursor: 'pointer' }}>Install demo content</summary>
            <div style={{ ...card, marginTop: 8, maxWidth: 360 }}>
              <span>
                Adds a home page, a quote form page, and header, footer and 404 templates. Existing pages with the slugs
                <code> home</code> and <code>contact</code>, and templates with the same names, are replaced.
              </span>
              <form method="post" action={`${api}/bw/demo`}>
                <button type="submit" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
                  Install and replace
                </button>
              </form>
            </div>
          </details>
        )}
      </div>
      {mediaWarning ? (
        <p
          role="status"
          style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 4, background: 'var(--theme-warning-50, #fff9db)', border: '1px solid var(--theme-warning-200, #ffe066)' }}
        >
          Images will not show for visitors: the <code>{mediaWarning}</code> collection is only readable when logged in. Add{' '}
          <code>access: {'{'} read: () =&gt; true {'}'}</code> to it.
        </p>
      ) : null}
      {demoMessage ? (
        <p role="status" style={{ margin: '0 0 16px', padding: '8px 12px', borderRadius: 4, background: 'var(--theme-elevation-100)' }}>
          {demoMessage}
        </p>
      ) : null}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {steps.map((s, i) => (
          <li key={s.title} style={card}>
            <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
              Step {i + 1}
              {s.done && i > 0 ? ' · done' : ''}
            </span>
            <strong>{s.title}</strong>
            <span style={{ color: 'var(--theme-elevation-600)', fontSize: 13 }}>{s.text}</span>
            <a href={s.href} style={{ marginTop: 'auto', fontWeight: 600 }}>
              {s.action}
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* "Edit with Blockwright" sidebar button                              */
/* ------------------------------------------------------------------ */

export function EditWithBlockwright({
  id,
  collectionSlug,
  payload,
  data,
}: {
  id?: string | number
  collectionSlug?: string
  payload?: BasePayload
  data?: Record<string, unknown>
}) {
  const admin = payload?.config.routes?.admin ?? '/admin'
  if (!id || !collectionSlug) {
    return (
      <div style={{ ...card, marginBottom: 'var(--base, 20px)' }}>
        <strong>Visual editor</strong>
        <span style={{ color: 'var(--theme-elevation-600)', fontSize: 13 }}>Save this document first, then open it in the visual editor.</span>
      </div>
    )
  }
  let viewUrl: string | null = null
  if (payload) {
    try {
      const { options } = getBlockwrightRuntime(payload)
      const isPublic = options.collectionConfig[collectionSlug]?.public
      const published = !data?._status || data._status === 'published'
      if (isPublic && published && data) viewUrl = options.previewUrl?.({ collection: collectionSlug, doc: data }) ?? null
    } catch {
      viewUrl = null
    }
  }
  const btn: React.CSSProperties = { display: 'flex', justifyContent: 'center', margin: 0, width: '100%', textDecoration: 'none' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--base, 20px)' }}>
      <a href={`${admin}/blockwright/edit/${collectionSlug}/${id}`} className="btn btn--style-primary btn--size-medium" style={btn}>
        Edit with Blockwright
      </a>
      {viewUrl ? (
        <a href={viewUrl} target="_blank" rel="noopener" className="btn btn--style-secondary btn--size-medium" style={btn}>
          View page
        </a>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Readable form entry                                                 */
/* ------------------------------------------------------------------ */

export function FormEntryView({ data, id, payload }: { data?: Record<string, any>; id?: string | number; payload?: BasePayload }) {
  if (!data || !id) return null
  const api = payload?.config.routes?.api ?? '/api'
  const answers: Array<{ label?: string; value?: string; fieldId?: string }> = Array.isArray(data.answers) ? data.answers : []
  const date = data.createdAt ? new Date(data.createdAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }) : ''
  const log: Array<{ action: string; status: string; message?: string }> = Array.isArray(data.actionLog) ? data.actionLog : []
  const cell: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid var(--theme-elevation-100)', textAlign: 'left', verticalAlign: 'top' }
  const statusColor: Record<string, string> = { success: 'var(--theme-success-500, #2b8a3e)', failed: 'var(--theme-error-500, #c92a2a)', skipped: 'var(--theme-elevation-500)' }
  return (
    <section style={{ marginBottom: 'calc(var(--base, 20px) * 1.5)' }} aria-label="Entry">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>{data.formName || 'Form entry'}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--theme-elevation-600)' }}>
            {date}
            {data.source?.pageUrl ? (
              <>
                {' · from '}
                <a href={data.source.pageUrl} target="_blank" rel="noopener">
                  {data.source.pageUrl}
                </a>
              </>
            ) : null}
          </p>
        </div>
        <a className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} href={`${payload?.config.routes?.admin ?? '/admin'}/blockwright/print/${id}`} target="_blank" rel="noopener">
          Print or save as PDF
        </a>
      </div>
      <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 'var(--style-radius-m, 6px)', overflow: 'hidden', background: 'var(--theme-elevation-0)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {answers.length ? (
              answers.map((a, i) => (
                <tr key={`${a.fieldId}-${i}`}>
                  <th scope="row" style={{ ...cell, width: '32%', fontWeight: 600, background: 'var(--theme-elevation-50)' }}>
                    {a.label || a.fieldId}
                  </th>
                  <td style={{ ...cell, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.value || <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={cell}>No answers recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {log.length ? (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--theme-elevation-600)' }}>
          After sending:{' '}
          {log.map((l, i) => (
            <span key={i} title={l.message} style={{ marginRight: 12 }}>
              {l.action} <strong style={{ color: statusColor[l.status] }}>{l.status}</strong>
            </span>
          ))}
        </p>
      ) : null}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Full-screen visual editor view                                      */
/* ------------------------------------------------------------------ */

interface EditorViewProps {
  initPageResult?: { req?: { user?: unknown; payload?: BasePayload } }
  params?: { segments?: string[] | string }
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 560, margin: '12vh auto', padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <div>{children}</div>
    </div>
  )
}

export async function BlockwrightEditorView({ initPageResult, params }: EditorViewProps) {
  const req = initPageResult?.req
  const payload = req?.payload
  if (!payload) return null
  const admin = payload.config.routes?.admin ?? '/admin'
  const api = payload.config.routes?.api ?? '/api'
  const segments = Array.isArray(params?.segments) ? params.segments : []
  const collection = segments[2] ?? ''
  const id = segments[3] ?? ''
  if (!req?.user) {
    redirect(`${admin}/login?redirect=${encodeURIComponent(`${admin}/blockwright/edit/${collection}/${id}`)}`)
  }
  const { options } = getBlockwrightRuntime(payload)
  const allowed = [...options.collections, options.templatesSlug]
  if (!allowed.includes(collection)) {
    return (
      <Notice title="This collection has no Blockwright layout">
        Add <code>{collection}</code> to the <code>collections</code> option of <code>blockwrightPlugin()</code>.
      </Notice>
    )
  }
  const doc = (await payload
    .findByID({ collection: collection as never, id, depth: 1, draft: true, overrideAccess: false, user: req!.user as never, disableErrors: true })
    .catch(() => null)) as Record<string, any> | null
  if (!doc) {
    return (
      <Notice title="Document not found">
        It may have been deleted, or you may not have access. <a href={`${admin}/collections/${collection}`}>Back to the list</a>
      </Notice>
    )
  }
  const collectionConfig = (payload.collections as Record<string, { config: { versions?: { drafts?: unknown } } }>)[collection]?.config
  const [{ kit, site }, customWidgets] = await Promise.all([getSiteInfo(payload), getCustomWidgetSpecs(payload)])
  const { layout, ...data } = doc
  const isTemplate = collection === options.templatesSlug
  const slug = typeof doc.slug === 'string' ? doc.slug : null
  const previewUrl = options.previewUrl
    ? options.previewUrl({ collection, doc })
    : isTemplate
      ? '/'
      : slug
        ? slug === 'home'
          ? '/'
          : `/${slug}`
        : null
  return (
    <BlockwrightEditor
      config={{
        apiRoute: api,
        adminRoute: admin,
        collection,
        id,
        drafts: !!collectionConfig?.versions?.drafts,
        templatesSlug: options.templatesSlug,
        mediaCollection: options.mediaCollection,
        collections: options.collections,
        previewUrl,
      }}
      initial={{
        layout: layout ?? [],
        title: String(doc.title ?? doc.name ?? ''),
        status: doc._status,
        templateType: isTemplate ? doc.type : undefined,
        conditions: isTemplate && Array.isArray(doc.conditions) ? doc.conditions : undefined,
        data: JSON.parse(JSON.stringify(data)),
      }}
      kit={kit}
      site={{ name: site.name, url: site.url, description: site.description }}
      customWidgets={customWidgets}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Printable entry (PDF)                                               */
/* ------------------------------------------------------------------ */

const PRINT_CSS =
  '.bw-print{position:fixed;inset:0;z-index:1000;overflow:auto;background:#e9ecef;color:#212529;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
  '.bw-print-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;padding:10px 20px;background:#fff;border-bottom:1px solid #dee2e6}' +
  '.bw-print-bar strong{flex:1}' +
  '.bw-print-bar a,.bw-print-bar button{font:inherit;font-size:14px;padding:7px 14px;border-radius:6px;border:1px solid #ced4da;background:#fff;color:#212529;text-decoration:none;cursor:pointer}' +
  '.bw-print-bar button{background:#212529;border-color:#212529;color:#fff}' +
  '.bw-print-page{box-sizing:border-box;width:210mm;min-height:297mm;margin:24px auto;padding:16mm;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);line-height:1.55}' +
  '.bw-print-page .bw-content{font-family:var(--bw-t-text-font-family,inherit);color:var(--bw-c-text)}' +
  '.bw-print-default h1{margin:0 0 4px;font-size:22px}.bw-print-default .meta{color:#6c757d;margin:0 0 20px;padding-bottom:14px;border-bottom:2px solid #212529}' +
  '@media print{@page{size:A4;margin:14mm}body *{visibility:hidden!important}.bw-print,.bw-print *{visibility:visible!important}' +
  '.bw-print{position:absolute;inset:0;overflow:visible;background:#fff}.bw-print-bar{display:none}' +
  '.bw-print-page{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}}'

export async function BlockwrightPrintView({ initPageResult, params, searchParams }: EditorViewProps & { searchParams?: Record<string, string | string[] | undefined> }) {
  const req = initPageResult?.req
  const payload = req?.payload
  if (!payload) return null
  const admin = payload.config.routes?.admin ?? '/admin'
  const segments = Array.isArray(params?.segments) ? params.segments : []
  const id = segments[2] ?? ''
  if (!req?.user) redirect(`${admin}/login?redirect=${encodeURIComponent(`${admin}/blockwright/print/${id}`)}`)
  const { options } = getBlockwrightRuntime(payload)
  const entry = (await payload
    .findByID({ collection: options.submissionsSlug as never, id, depth: 0, overrideAccess: false, user: req!.user as never, disableErrors: true })
    .catch(() => null)) as Record<string, any> | null
  if (!entry) return <Notice title="Entry not found">It may have been deleted, or you may not have access.</Notice>

  // which PDF template: ?template=, the form's setting, or the newest PDF template
  let templateId = typeof searchParams?.template === 'string' ? searchParams.template : undefined
  if (!templateId && entry.source?.collection && entry.source?.docId && entry.elementId) {
    const owner = (await payload
      .findByID({ collection: entry.source.collection as never, id: entry.source.docId, depth: 0, overrideAccess: true, disableErrors: true })
      .catch(() => null)) as Record<string, any> | null
    const el = owner ? findElement((owner.layout as Element[]) ?? [], String(entry.elementId)) : undefined
    const chosen = el?.settings?.bw_pdf_template
    if (typeof chosen === 'string' && chosen) templateId = chosen
  }
  let template: Record<string, any> | null = null
  if (templateId) {
    template = (await payload.findByID({ collection: options.templatesSlug as never, id: templateId, depth: 0, overrideAccess: true, disableErrors: true }).catch(() => null)) as Record<string, any> | null
  }
  if (!template) {
    const res = await payload
      .find({ collection: options.templatesSlug as never, where: { and: [{ type: { equals: 'pdf' } }, { _status: { equals: 'published' } }] }, sort: '-updatedAt', limit: 1, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] }))
    template = (res.docs[0] as Record<string, any> | undefined) ?? null
  }

  const [registry, { kit, site }] = await Promise.all([getRegistry(payload), getSiteInfo(payload)])
  const entryData = {
    id: entry.id,
    formName: entry.formName,
    createdAt: entry.createdAt,
    status: entry.status,
    pageUrl: entry.source?.pageUrl,
    answers: Array.isArray(entry.answers) ? entry.answers.map((a: Record<string, any>) => ({ fieldId: a.fieldId, label: a.label, value: a.value })) : [],
  }
  const ctx: RenderContext = { registry, kit, mode: 'live', site, request: { path: '/' }, extra: { entry: entryData }, components: {} }
  const title = `${entry.formName || 'Form entry'} #${entry.id}`

  let body: React.ReactNode
  let css = ''
  if (template && Array.isArray(template.layout) && template.layout.length) {
    const built = await buildLayout(template.layout as Element[], ctx)
    css = kitToCss(kit) + Object.values(built.compiled.base).join('') + built.compiled.css
    body = (
      <div className="bw-content">
        <RenderElements items={built.prepared} ctx={ctx} />
      </div>
    )
  } else {
    const built = await buildLayout([{ id: 'bwprint', elType: 'widget', widgetType: 'entry-fields', settings: {}, elements: [] } as unknown as Element], ctx)
    css = Object.values(built.compiled.base).join('')
    const date = entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }) : ''
    body = (
      <div className="bw-print-default">
        <h1>{entry.formName || 'Form entry'}</h1>
        <p className="meta">
          {site.name ? `${site.name} · ` : ''}Entry #{entry.id}
          {date ? ` · ${date}` : ''}
        </p>
        <RenderElements items={built.prepared} ctx={ctx} />
      </div>
    )
  }
  void compileCss

  return (
    <div className="bw-print">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS + css }} />
      <div className="bw-print-bar">
        <strong>{title}</strong>
        <span style={{ color: '#6c757d', fontSize: 13 }}>{template ? `Template: ${template.title}` : 'Default layout'}</span>
        <a href={`${admin}/collections/${options.submissionsSlug}/${entry.id}`}>Back to entry</a>
        {template ? <a href={`${admin}/blockwright/edit/${options.templatesSlug}/${template.id}`}>Edit template</a> : <a href={`${admin}/collections/${options.templatesSlug}/create`}>Create a PDF template</a>}
        <PrintButton />
      </div>
      <article className="bw-print-page" aria-label={title}>
        {body}
      </article>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Nav link and overview page                                          */
/* ------------------------------------------------------------------ */

export function BlockwrightNavLink({ payload }: { payload?: BasePayload }) {
  const admin = payload?.config.routes?.admin ?? '/admin'
  return (
    <a href={`${admin}/blockwright`} className="nav__link" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M12 4v16M3 12h9" />
      </svg>
      Blockwright
    </a>
  )
}

const PKG_VERSION = '0.1.0-alpha.0'

export async function BlockwrightOverviewView({ initPageResult }: EditorViewProps) {
  const req = initPageResult?.req
  const payload = req?.payload
  if (!payload) return null
  const admin = payload.config.routes?.admin ?? '/admin'
  if (!req?.user) redirect(`${admin}/login?redirect=${encodeURIComponent(`${admin}/blockwright`)}`)
  const { options } = getBlockwrightRuntime(payload)
  const registry = await getRegistry(payload).catch(() => getBlockwrightRuntime(payload).registry)
  const count = async (collection: string) => {
    try {
      return (await payload.count({ collection: collection as never, overrideAccess: true })).totalDocs
    } catch {
      return 0
    }
  }
  const [templates, entries, menus, widgets, mediaPublic] = await Promise.all([
    count(options.templatesSlug),
    count(options.submissionsSlug),
    count(options.menusSlug),
    count(options.widgetsSlug),
    options.mediaCollection ? isCollectionPublic(payload, options.mediaCollection) : Promise.resolve(true),
  ])
  const layouts = await Promise.all(options.collections.map(async (slug) => ({ slug, total: await count(slug), public: !!options.collectionConfig[slug]?.public })))

  const section: React.CSSProperties = { marginBottom: 'calc(var(--base, 20px) * 1.6)' }
  const grid: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', listStyle: 'none', padding: 0, margin: 0 }
  const box: React.CSSProperties = { ...card, gap: 4 }
  const link = (href: string, label: string) => (
    <a href={href} style={{ fontWeight: 600 }}>
      {label}
    </a>
  )

  return (
    <div className="gutter--left gutter--right" style={{ padding: 'var(--base, 20px)', maxWidth: 1080, margin: '0 auto' }}>
      <header style={{ ...section, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
        <h1 style={{ margin: 0 }}>Blockwright</h1>
        <span style={{ color: 'var(--theme-elevation-500)' }}>version {PKG_VERSION}</span>
        <span style={{ flex: 1 }} />
        <a className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} href="https://github.com/wpcoder110/blockwright-alpha" target="_blank" rel="noopener">
          Documentation
        </a>
      </header>

      {options.mediaCollection && !mediaPublic ? (
        <section style={{ ...section, padding: '14px 18px', borderRadius: 'var(--style-radius-m, 6px)', background: 'var(--theme-warning-50, #fff9db)', border: '1px solid var(--theme-warning-200, #ffe066)' }}>
          <strong>Images will not show on the public site</strong>
          <p style={{ margin: '6px 0 0' }}>
            The <code>{options.mediaCollection}</code> collection is only readable by logged-in users, which is Payload&apos;s default. Visitors, and
            the Next.js image optimiser, get an error instead of the file. Add public read access to that collection:
          </p>
          <pre style={{ margin: '10px 0 0', padding: 12, borderRadius: 4, background: 'var(--theme-elevation-100)', overflowX: 'auto' }}>
            {`export const Media: CollectionConfig = {\n  slug: '${options.mediaCollection}',\n  access: { read: () => true },\n  upload: true,\n  fields: [{ name: 'alt', type: 'text' }],\n}`}
          </pre>
        </section>
      ) : null}

      <section style={section}>
        <h2 style={{ fontSize: 16 }}>Where things live</h2>
        <ul style={grid}>
          <li style={box}>
            <strong>Pages and layouts</strong>
            {layouts.length ? (
              layouts.map((c) => (
                <span key={c.slug}>
                  {link(`${admin}/collections/${c.slug}`, c.slug)} · {c.total} {c.total === 1 ? 'document' : 'documents'}
                  {c.public ? ' · public' : ''}
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--theme-elevation-600)' }}>No collections enabled yet. Add them to the plugin options.</span>
            )}
          </li>
          <li style={box}>
            <strong>Templates</strong>
            <span>{link(`${admin}/collections/${options.templatesSlug}`, `${templates} templates`)}</span>
            <span style={{ color: 'var(--theme-elevation-600)', fontSize: 13 }}>Headers, footers, 404 and PDF templates.</span>
          </li>
          <li style={box}>
            <strong>Menus</strong>
            <span>{link(`${admin}/collections/${options.menusSlug}`, `${menus} menus`)}</span>
            <span style={{ color: 'var(--theme-elevation-600)', fontSize: 13 }}>Used by the Nav menu widget.</span>
          </li>
          <li style={box}>
            <strong>Form entries</strong>
            <span>{link(`${admin}/collections/${options.submissionsSlug}`, `${entries} entries`)}</span>
          </li>
          <li style={box}>
            <strong>Custom widgets</strong>
            <span>{link(`${admin}/collections/${options.widgetsSlug}`, `${widgets} custom widgets`)}</span>
          </li>
          <li style={box}>
            <strong>Site style</strong>
            <span>{link(`${admin}/globals/${options.kitSlug}`, 'Colors, fonts and layout')}</span>
          </li>
        </ul>
      </section>

      <section style={section}>
        <h2 style={{ fontSize: 16 }}>Widgets available in the editor</h2>
        <p style={{ margin: '0 0 10px', color: 'var(--theme-elevation-600)' }}>
          {registry.all().length} widgets, including {widgets} built in the admin.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {registry
            .all()
            .map((d) => d.title)
            .sort()
            .map((title) => (
              <span key={title} style={{ padding: '2px 10px', borderRadius: 12, background: 'var(--theme-elevation-100)', fontSize: 12 }}>
                {title}
              </span>
            ))}
        </div>
      </section>

      <section style={section}>
        <h2 style={{ fontSize: 16 }}>Turning it off or removing it</h2>
        <p style={{ margin: '0 0 8px', color: 'var(--theme-elevation-600)' }}>
          Payload has no plugin screen: plugins are npm packages listed in <code>payload.config.ts</code>, so they are added and removed in code.
        </p>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
          <li>
            Pause it: <code>blockwrightPlugin(&#123; disabled: true &#125;)</code> keeps your content and the collections, but turns off the editor,
            the endpoints and the admin additions.
          </li>
          <li>
            Remove it: delete the <code>blockwrightPlugin(...)</code> line, run <code>npm uninstall blockwright</code>, then{' '}
            <code>payload generate:importmap</code>. Its collections stay in the database until you drop them.
          </li>
        </ol>
      </section>
    </div>
  )
}
