import configPromise from '@payload-config'
import { BlockwrightDocument, BlockwrightLocation, documentMetadata, findDocumentBySlug, singularTheme } from '@blockwright/next'
import { getSiteInfo } from '@blockwright/payload-plugin'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

type Params = Promise<{ slug?: string[] }>
type Search = Promise<Record<string, string | string[] | undefined>>

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const slug = (await params).slug?.join('/') || 'home'
  const doc = await findDocumentBySlug({ payload, collection: 'pages', slug })
  const { site } = await getSiteInfo(payload)
  return documentMetadata(doc, site.name)
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: Search }) {
  const payload = await getPayload({ config: configPromise })
  const slug = (await params).slug?.join('/') || 'home'
  const doc = await findDocumentBySlug({ payload, collection: 'pages', slug })
  if (!doc) notFound()

  const request = { path: slug === 'home' ? '/' : `/${slug}`, searchParams: await searchParams }
  const theme = singularTheme('pages', doc, { isFront: slug === 'home' })
  const document = { collection: 'pages', id: doc.id, data: doc }

  return (
    <>
      <BlockwrightLocation payload={payload} request={request} theme={theme} document={document} location="header" />
      <BlockwrightDocument payload={payload} request={request} collection="pages" doc={doc} />
      <BlockwrightLocation payload={payload} request={request} theme={theme} document={document} location="footer" />
    </>
  )
}
