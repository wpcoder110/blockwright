# blockwright — visual page builder plugin for Payload CMS

[![Payload CMS plugin](https://img.shields.io/badge/Payload%20CMS-plugin-000000)](https://payloadcms.com)

**A Payload CMS plugin.** Visual page and theme builder for [Payload CMS](https://payloadcms.com): a drag-and-drop editor in the admin, widgets, a form builder, menus, theme templates and PDF templates. Pages render as React Server Components, so the site stays fast.

```bash
pnpm add blockwright
```

```ts
// payload.config.ts
import { blockwrightPlugin } from 'blockwright'

export default buildConfig({
  collections: [Pages, Media, Users],
  plugins: [
    blockwrightPlugin({
      collections: { pages: { public: true } },
    }),
  ],
})
```

Then run `payload generate:importmap`, open a document in the admin and click **Edit with Blockwright**.

Render pages in Next.js:

```tsx
import { BlockwrightDocument, BlockwrightLocation, findDocumentBySlug, singularTheme } from 'blockwright/next'
```

Full documentation: https://github.com/wpcoder110/blockwright

MIT © Ahmer Hassan
