import type { ReactNode } from 'react'
import './styles.css'

export const metadata = {
  title: 'Blockwright dev site',
  description: 'Local test site for Blockwright, the visual page builder for Payload CMS.',
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
