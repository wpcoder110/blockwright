import type { Endpoint } from 'payload'
import type { BlockwrightRuntime } from '../types'

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Printable form entry. Use the browser's "Save as PDF" to create a PDF. */
export function printEntryEndpoint(rt: BlockwrightRuntime): Endpoint {
  return {
    path: '/bw/entries/:id/print',
    method: 'get',
    handler: async (req) => {
      if (!req.user) return new Response('You must be logged in.', { status: 401 })
      const id = String(req.routeParams?.id ?? '')
      const entry = (await req.payload
        .findByID({ collection: rt.options.submissionsSlug as never, id, depth: 0, overrideAccess: false, user: req.user, disableErrors: true })
        .catch(() => null)) as Record<string, any> | null
      if (!entry) return new Response('Entry not found.', { status: 404 })
      const site = (await req.payload.findGlobal({ slug: rt.options.kitSlug as never, depth: 0 }).catch(() => null)) as Record<string, any> | null
      const answers: Array<{ label?: string; value?: string }> = Array.isArray(entry.answers) ? entry.answers : []
      const date = entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }) : ''
      const rows = answers
        .map((a) => `<tr><th scope="row">${esc(a.label)}</th><td>${esc(a.value).replace(/\n/g, '<br>') || '<span class="muted">—</span>'}</td></tr>`)
        .join('')
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(entry.formName)} entry ${esc(id)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@page{size:A4;margin:18mm}
*{box-sizing:border-box}
body{margin:0;padding:32px;font:14px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d2129;background:#f4f5f7}
.sheet{max-width:760px;margin:0 auto;background:#fff;padding:36px 40px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid #1d2129;margin-bottom:22px}
h1{margin:0 0 4px;font-size:22px}
.site{font-weight:600;text-align:right}
.muted{color:#687080}
table{width:100%;border-collapse:collapse}
th,td{padding:10px 12px;border-bottom:1px solid #e2e5ea;text-align:left;vertical-align:top}
th{width:34%;font-weight:600;color:#3a404b;background:#fafbfc}
footer{margin-top:24px;font-size:12px}
.actions{max-width:760px;margin:0 auto 16px;display:flex;gap:8px;justify-content:flex-end}
button{font:inherit;padding:8px 16px;border-radius:6px;border:1px solid #c9ced6;background:#fff;cursor:pointer}
button.primary{background:#1d2129;color:#fff;border-color:#1d2129}
@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;padding:0;max-width:none}.actions{display:none}}
</style></head><body>
<div class="actions"><button type="button" onclick="history.length>1?history.back():window.close()">Close</button><button type="button" class="primary" onclick="window.print()">Print or save as PDF</button></div>
<article class="sheet">
<header><div><h1>${esc(entry.formName || 'Form entry')}</h1><div class="muted">Entry #${esc(id)}${date ? ` · ${esc(date)}` : ''}</div></div>
<div class="site">${esc(site?.siteName ?? '')}<div class="muted" style="font-weight:400">${esc(site?.siteUrl ?? '')}</div></div></header>
<table><tbody>${rows || '<tr><td class="muted">No answers recorded.</td></tr>'}</tbody></table>
<footer class="muted">${entry.source?.pageUrl ? `Sent from ${esc(entry.source.pageUrl)}` : ''}</footer>
</article>
<script>if(location.hash==='#print')window.addEventListener('load',function(){window.print()})</script>
</body></html>`
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
    },
  }
}
