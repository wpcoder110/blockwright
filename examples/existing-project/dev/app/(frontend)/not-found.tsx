import configPromise from '@payload-config'
import { BlockwrightLocation, notFoundTheme } from 'blockwright/next'
import { connection } from 'next/server'
import { getPayload } from 'payload'

export default async function NotFound() {
  await connection()
  const payload = await getPayload({ config: configPromise })
  const common = { payload, request: { path: '/404' }, theme: notFoundTheme }
  return (
    <>
      <BlockwrightLocation {...common} location="header" />
      <BlockwrightLocation {...common} location="error-404" fallback={<main style={{ padding: 40 }}><h1>Page not found</h1></main>} />
      <BlockwrightLocation {...common} location="footer" />
    </>
  )
}
