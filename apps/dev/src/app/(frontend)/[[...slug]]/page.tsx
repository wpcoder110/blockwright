import configPromise from '@payload-config'
import { BlockwrightDocument, BlockwrightLocation, documentMetadata, findDocumentBySlug, singularTheme } from '@blockwright/next'
import { getSiteInfo } from '@blockwright/payload-plugin'
import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

type Params = Promise<{ slug?: string[] }>
type Search = Promise<Record<string, string | string[] | undefined>>

// Rendered per request so form results, drafts and dynamic values stay correct.
export const dynamic = 'force-dynamic'

async function load(slugParts: string[] | undefined, preview: boolean) {
  const payload = await getPayload({ config: configPromise })
  const slug = slugParts?.length ? slugParts.join('/') : 'home'
  let user = null
  if (preview) {
    const auth = await payload.auth({ headers: await headers() })
    user = auth.user
  }
  const doc = await findDocumentBySlug({ payload, collection: 'pages', slug, draft: !!user })
  return { payload, slug, doc, user }
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const { payload, doc } = await load(slug, sp.preview === '1')
  const { site } = await getSiteInfo(payload)
  return documentMetadata(doc, site.name)
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const draft = await draftMode()
  const { payload, slug: path, doc, user } = await load(slug, sp.preview === '1' || draft.isEnabled)
  if (!doc) notFound()

  const request = { path: path === 'home' ? '/' : `/${path}`, searchParams: sp }
  const theme = singularTheme('pages', doc, { isFront: path === 'home' })
  const common = { payload, request, theme, user: user ? { id: user.id, email: user.email } : null }
  const document = { collection: 'pages', id: doc.id, data: doc }

  return (
    <>
      {user ? <div className="dev-preview-bar">Preview: you are seeing the latest draft.</div> : null}
      <BlockwrightLocation {...common} location="header" document={document} />
      <BlockwrightDocument payload={payload} request={request} collection="pages" doc={doc} user={common.user} mode={user ? 'preview' : 'live'} />
      <BlockwrightLocation {...common} location="footer" document={document} />
    </>
  )
}
