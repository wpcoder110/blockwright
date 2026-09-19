/** Product pages, rendered from the Blockwright "Single product" template. */
import configPromise from '@payload-config'
import { BlockwrightDocument, BlockwrightLocation, findDocumentBySlug, singularTheme } from 'blockwright/next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const doc = await findDocumentBySlug({ payload, collection: 'products', slug })
  if (!doc) notFound()

  const request = { path: `/products/${slug}` }
  const theme = singularTheme('products', doc)
  const common = { payload, request, theme, user: null }
  const document = { collection: 'products', id: doc.id, data: doc }

  return (
    <>
      <BlockwrightLocation {...common} location="header" document={document} />
      <BlockwrightLocation {...common} location="single" document={document} />
      <BlockwrightLocation {...common} location="footer" document={document} />
    </>
  )
}
