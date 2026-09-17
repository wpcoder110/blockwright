import configPromise from '@payload-config'
import { BlockwrightLocation, notFoundTheme } from 'blockwright/next'
import { connection } from 'next/server'
import { getPayload } from 'payload'

export default async function NotFound() {
  // render per request so template changes show up immediately
  await connection()
  const payload = await getPayload({ config: configPromise })
  const common = { payload, request: { path: '/404' }, theme: notFoundTheme }
  return (
    <>
      <BlockwrightLocation {...common} location="header" />
      <BlockwrightLocation
        {...common}
        location="error-404"
        fallback={
          <main className="dev-empty">
            <h1>Page not found</h1>
            <p>
              There is no published page at this address. Create one in the <a href="/admin/collections/pages">admin</a>, or run{' '}
              <code>pnpm seed</code> to add demo content.
            </p>
          </main>
        }
      />
      <BlockwrightLocation {...common} location="footer" />
    </>
  )
}
