import type { ReactNode } from 'react'

export const metadata = { title: 'My site' }

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
