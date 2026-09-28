# blockwright — an Elementor-class visual builder for Payload CMS

[![Payload CMS plugin](https://img.shields.io/badge/Payload%20CMS-plugin-000000)](https://payloadcms.com)

**An open-source visual website and theme builder for [Payload CMS](https://payloadcms.com), inspired by the Elementor editing experience.** Build complete responsive pages *and* the theme around them — headers, footers, single and archive layouts, 404s — from widgets, with a structure navigator, reusable templates, a template library, global styling, dynamic Payload data, forms, menus and commerce, while your content stays in your own collections and pages render as React Server Components.

```
Blockwright
├── Visual canvas, structure navigator, 32 widgets, layout frames
├── Six responsive breakpoints and style controls on every element
├── Theme builder: header, footer, single, archive, search, 404, popup
├── Template library, reusable sections, import and export
├── Global styling, dynamic Payload data, display conditions
├── Forms with logic, notifications, entries and PDF templates
├── Menus, commerce (products, cart, checkout) and live preview
└── Publishing with Payload drafts and versions
```

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
