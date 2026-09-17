# blockwright

Visual page and theme builder for [Payload CMS](https://payloadcms.com): a drag-and-drop editor in the admin, widgets, a form builder, menus, theme templates and PDF templates. Pages render as React Server Components, so the site stays fast.

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

Full documentation: https://github.com/wpcoder110/blockwright-alpha

MIT © Ahmer Hassan
