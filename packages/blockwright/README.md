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

Then:

```bash
npx payload generate:types      # so the plugin options typecheck against your collections
npx payload generate:importmap  # so the admin can load Blockwright's components
```

Open a document in the admin and click **Edit with Blockwright**.

Two things that catch people out on a first run:

- **Images don't show on the site?** Payload's default access is logged-in only. Add `access: { read: () => true }` to your `media` collection.
- **Building?** On the Payload blank template use `next build`; older `payload build` scripts no longer exist in Payload 3.9x.

[Watch the walkthrough](https://www.youtube.com/watch?v=pImsxnkGxXs)

Render pages in Next.js:

```tsx
import { BlockwrightDocument, BlockwrightLocation, findDocumentBySlug, singularTheme } from 'blockwright/next'
```

Full documentation: https://github.com/wpcoder110/blockwright

MIT © Ahmer Hassan
