# Blockwright

Visual page and theme builder for [Payload CMS](https://payloadcms.com). Build pages, headers, footers and forms from widgets, style them without writing CSS, and render them as fast, SEO-friendly React Server Components.

> **Status: 0.1.0, early but working.** The visual editor, widgets, form builder, theme templates, site style and the Payload plugin work today. More widgets, commerce widgets and inline text editing are next. See [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) for the roadmap.

## What you get

| Area | Included in this release |
| --- | --- |
| Visual editor | Full-screen drag-and-drop editor in the admin: widget panel, Content/Style/Advanced settings, live canvas, desktop/tablet/mobile preview, navigator, undo/redo, keyboard shortcuts, save draft and publish |
| Library | Saved templates with live previews, "save as template" for any section or page, drag-and-drop JSON import (Blockwright and Elementor-compatible) with a preview, export of the page or the selected element |
| Structure | Floating, movable page tree (Ctrl+I) with drag-to-reorder |
| Layout | **Frame**: flexbox or grid, boxed or full width, responsive direction, gaps, wrapping, columns, semantic tags (`section`, `header`, `nav`…) |
| Navigation | **Menus** collection (links to pages follow slug changes, up to three levels) and a **Nav menu** widget: dropdowns, current-page highlighting, hover effects, and a mobile menu that works without JavaScript |
| Widgets | Nav menu, Heading, Text, Button, Image, Spacer, Divider, Icon, Icon box, Image box, Icon list, Social icons, Alert, Video (lightweight YouTube/Vimeo/self-hosted), Gallery, Google Maps, Tabs, Accordion (with FAQ schema), Testimonial, Counter, Progress bar, Star rating, Custom HTML |
| Custom widgets | Build widgets in the admin from fields (or JSON) and an HTML template, see [`docs/CUSTOM_WIDGETS.md`](docs/CUSTOM_WIDGETS.md) |
| Forms | Visual field builder with drag-to-reorder and show/hide rules. 19 field types, multi-step with progress indicator, conditional logic, inline validation, spam protection (honeypot, time trap, rate limit), works without JavaScript. Actions: save entry, email notifications (any number, several recipients, HTML or plain-text templates with field placeholders, send-only-when rules, preview), redirect, signed webhook, create a document |
| Form entries | Readable entry view; **PDF templates** designed in the visual editor (Entry answers widget and entry placeholders) for print or save as PDF |
| Styling | Typography, colors, backgrounds and gradients, borders, radius, shadows, spacing — per device (desktop, tablet, mobile, plus optional laptop, widescreen and extra breakpoints) |
| Site style | Global colors and fonts that every widget can reference, container width, breakpoints, custom CSS |
| Theme templates | Header, footer, 404 and more, shown by display conditions (entire site, front page, specific pages, exclusions) |
| Dynamic values | Site name, page title, excerpt, date, any document field, featured image, URL parameters, current user, current date |
| Import | Layouts and templates exported from Elementor-style JSON (containers and legacy sections/columns) |

### Accessibility

Rendered pages target **WCAG 2.1 level AA**, the standard US ADA guidance points at.

- Semantic markup: landmarks, one `h1`, real lists, `figure`/`figcaption`, `fieldset`/`legend`, and labelled form fields.
- Form errors are linked to their field with `aria-describedby`, marked `aria-invalid`, and announced politely.
- Menus work with the keyboard, mark the current page with `aria-current`, and the mobile menu needs no JavaScript.
- Colour and contrast: the default palette and widget styles meet the 4.5:1 text contrast rule.
- Motion: entrance animations and transitions are switched off for visitors who prefer reduced motion.
- Every release runs [axe](https://github.com/dequelabs/axe-core) against the demo pages, the form and the 404 page in CI, on desktop and mobile, and fails on any violation.

Your own content still matters: write meaningful alt text, keep heading levels in order, and use the accessible-name fields on icons, menus and videos.

### Built for speed and SEO

- **Server-rendered.** Pages render as React Server Components; the only browser JavaScript Blockwright adds is a small enhancer for forms.
- **Minimal CSS.** Each page ships only the CSS for widgets it uses, and default values aren't repeated per element.
- **No duplicated or blocking styles.** Styles are hoisted into `<head>` once, even when header, page and footer render separately.
- **Fast images.** Images are lazy by default; the **Load first** switch prioritises the main image for Largest Contentful Paint. `next/image` is used automatically.
- **Animations without JavaScript.** Entrance animations use CSS scroll-driven animations and respect reduced-motion settings.
- **Semantic, safe markup.** Headings, landmarks, labelled fields, fieldsets and ARIA error messages throughout. Unsafe links are removed, and rich text is cleaned when saved.

Measured on the demo home page (production build): about 30 ms server render once warm, 15 KB of gzipped HTML, and 16 KB of CSS for the whole page.

## Requirements

- **Node.js 22** (20.9 or newer works)
- **pnpm 9**: run `corepack enable` once and pnpm is available
- **Docker Desktop**, for Postgres and the Mailpit test inbox. You can use your own Postgres 14+ instead.
- **Git**

> **Windows:** use PowerShell or Git Bash, and enable the WSL 2 backend in Docker Desktop. Wherever this guide says `cp`, use `copy` in PowerShell.

## Quick start (local testing)

```bash
# 1. Get the code and install
git clone https://github.com/wpcoder110/blockwright-alpha.git
cd blockwright-alpha
corepack enable
pnpm install

# 2. Start Postgres (port 5432) and Mailpit (http://localhost:8025)
pnpm db:up

# 3. Configure the dev app
cp apps/dev/.env.example apps/dev/.env
#    then set PAYLOAD_SECRET in apps/dev/.env to any long random string

# 4. Build the packages and add demo content
pnpm build
pnpm seed

# 5. Run it
pnpm dev
```

Now open:

| URL | What it is |
| --- | --- |
| http://localhost:3000 | Demo home page (header, hero, grid, contact form, footer) |
| http://localhost:3000/contact | Multi-step quote form with conditional fields |
| http://localhost:3000/anything | 404 page, rendered from a template |
| http://localhost:3000/admin | Payload admin. The first visit asks you to create your admin user |
| http://localhost:8025 | Mailpit inbox with every email the forms send |

The first request to each page compiles it, so give it a few seconds. After that, pages render in milliseconds.

`pnpm seed` can be run again at any time; it replaces the demo pages and templates.

### First steps in the admin

After you log in, the dashboard shows a **Blockwright** panel. If the site is empty, click **Install demo content**.

1. **Site style** (*Blockwright → Site style*): change the colors or fonts. Every widget that uses a global color or font updates.
2. **Pages**: open *Home* and click **Edit with Blockwright** in the sidebar. Click any element to edit it, drag widgets from the left panel, switch devices at the top, then **Save draft** or **Publish**.
3. **Blockwright** in the sidebar: an overview of where everything lives, which widgets are available, and how to pause or remove the plugin.
4. **Templates**: open *Site header* → **Edit with Blockwright** → the gear icon to set where it appears (entire site, front page, specific pages, exclusions).
5. **Forms**: open **Request a quote** in the editor, select the form, and open **Email notifications** to change recipients, the HTML message and the send-only-when rules. **Preview email** shows the result.
6. **Form entries**: every submission appears as a readable table. **Print or save as PDF** uses the *Entry PDF* template, which you can redesign under **Templates**.
7. **Menus**: edit *Main menu* under **Blockwright → Menus** (links to pages, custom URLs, dropdown items). The header's Nav menu widget shows it; choose another menu in the widget's settings.
8. **Custom widgets**: create one under **Blockwright → Custom widgets**; it appears in the editor's widget panel.

### Editor shortcuts

| Keys | Action |
| --- | --- |
| Ctrl+S | Save draft |
| Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) | Undo / redo |
| Ctrl+D | Duplicate the selected element |
| Ctrl+I | Show or hide the structure panel |
| Delete | Delete the selected element |
| Esc | Leave a field, then deselect |

A full manual test checklist is in [`docs/TESTING.md`](docs/TESTING.md).

### Without Docker

Create a Postgres database called `blockwright` and put its connection string in `DATABASE_URL` in `apps/dev/.env`. Comment out `SMTP_HOST` to print emails to the terminal instead of sending them to Mailpit.

### Common problems

| Problem | Fix |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:5432` | Postgres is not running. Run `pnpm db:up` and check `docker ps`. |
| `Error: missing secret key` | Set `PAYLOAD_SECRET` in `apps/dev/.env`. |
| Port 5432 already in use | Another Postgres is running. Stop it, or change the port in `docker-compose.yml` and `DATABASE_URL`. |
| Changes in `packages/*` not showing | `pnpm dev` rebuilds packages on save; if it was stopped, run `pnpm build` again. |
| Admin shows an import map error | Run `pnpm --filter dev generate:importmap`. |
| Images show in the admin but not on the site ("The requested resource isn't a valid image") | Your upload collection is readable only by logged-in users, which is Payload's default. Add `access: { read: () => true }` to it. Blockwright warns about this on the dashboard. |
| Images do not load in Next.js | Payload adds a `?<updatedAt>` cache tag to upload URLs; Blockwright strips it for the image optimiser. If you use a storage adapter with a different domain, add it to `images.remotePatterns` in `next.config.ts`. |
| No **Create new** button on Custom widgets, or no Products button with the ecommerce plugin | Your account needs the `admin` role. See [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md). |
| Home page shows "Page not found" | Run `pnpm seed`, or create a page with the slug `home` and publish it. |
| "Too many submissions" while testing forms | Raise `FORMS_RATE_LIMIT` in `apps/dev/.env` (default 10 per minute). |

## Scripts

Run from the repository root.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Watches all packages and runs the dev site on port 3000 |
| `pnpm build` | Builds all `@blockwright/*` packages |
| `pnpm build:all` | Builds the packages and the dev site |
| `pnpm test` | Unit tests for every package |
| `pnpm typecheck` | TypeScript checks for every package and the dev site |
| `pnpm seed` | Adds or refreshes the demo content (also available as a button on the admin dashboard) |
| `pnpm pack:local` | Builds and packs every package into `release/` for installing in another project |
| `pnpm db:up` / `pnpm db:down` | Starts or stops Postgres and Mailpit |
| `pnpm --filter dev test:e2e` | Browser tests with Playwright (editor tests need `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` set when seeding and testing). Run `pnpm --filter dev build` first, and `pnpm --filter dev exec playwright install chromium` once |

## Add Blockwright to your own Payload project

**Step-by-step for Windows and the Payload plugin template: [`docs/INSTALL-EXISTING-PROJECT.md`](docs/INSTALL-EXISTING-PROJECT.md).** It is tested end to end with npm.

Blockwright ships as **one package**, like the official Payload plugins:

```bash
pnpm add blockwright
```

To try unreleased work from this repository instead, run `pnpm pack:local` and install the files from `release/` (see [`docs/RELEASING.md`](docs/RELEASING.md)).

**1. Register the plugin** in `payload.config.ts`:

```ts
import { blockwrightPlugin } from 'blockwright'

export default buildConfig({
  // ...
  plugins: [
    blockwrightPlugin({
      // a list of slugs, or options per collection
      collections: {
        pages: { public: true }, // adds "View page" and Payload's preview button
        posts: { public: true, url: (doc) => `/blog/${doc.slug}` },
        banners: true, // no public URL, so no View button
      },
      forms: {
        defaultToEmail: 'owner@example.com',
        defaultFromEmail: 'website@example.com',
        allowedCollections: ['leads'], // for the "Create document" action
      },
    }),
  ],
})
```

The plugin adds:

- a `layout` field to those collections;
- the **Templates** and **Form entries** collections, and the **Site style** global;
- the `POST /api/bw/forms/submit` endpoint;
- the visual editor at `/admin/blockwright/edit/<collection>/<id>`, with an **Edit with Blockwright** button on each document;
- the dashboard panel.

Then run `payload generate:importmap`. Forms send email through the email adapter configured in Payload.

**2. Render pages** in your Next.js route:

```tsx
import { BlockwrightDocument, BlockwrightLocation, findDocumentBySlug, singularTheme } from 'blockwright/next'

export default async function Page({ params, searchParams }) {
  const payload = await getPayload({ config })
  const slug = (await params).slug?.join('/') ?? 'home'
  const doc = await findDocumentBySlug({ payload, collection: 'pages', slug })
  if (!doc) notFound()

  const request = { path: `/${slug}`, searchParams: await searchParams }
  const theme = singularTheme('pages', doc, { isFront: slug === 'home' })

  return (
    <>
      <BlockwrightLocation payload={payload} request={request} theme={theme} location="header" />
      <BlockwrightDocument payload={payload} request={request} collection="pages" doc={doc} />
      <BlockwrightLocation payload={payload} request={request} theme={theme} location="footer" />
    </>
  )
}
```

`apps/dev/src/app/(frontend)` is a complete, working example, including drafts, preview and the 404 page.

### Plugin options

Options follow the conventions of the official Payload plugins: `disabled`, per-collection settings, and `…Overrides` to change any generated collection.

| Option | Default | Purpose |
| --- | --- | --- |
| `collections` | `['pages']` | Collections that get the layout field. Per collection: `public`, `url(doc)`, `field` |
| `disabled` | `false` | Keeps the schema but skips hooks, endpoints and admin components |
| `templatesOverrides`, `formEntriesOverrides`, `menusOverrides`, `widgetsOverrides`, `siteStyleOverrides` | — | Change a generated collection or global, including `fields({ defaultFields })` |
| `elements` / `tags` | — | Register your own widgets and dynamic values |
| `templates.slug` | `bw-templates` | Slug of the templates collection |
| `kit.slug` | `bw-site-style` | Slug of the site style global |
| `forms.submissionsSlug` | `bw-form-entries` | Slug of the form entries collection |
| `forms.defaultToEmail` / `defaultFromEmail` / `defaultFromName` | — | Email defaults |
| `forms.allowedCollections` | `[]` | Collections the "Create document" action may write to |
| `forms.webhookSecret` | — | Adds an `X-Blockwright-Signature: sha256=…` header to webhooks |
| `forms.rateLimit` | 10 per minute | `{ max, windowMs }`, or `false` to disable |
| `forms.storeIp` | `false` | Save visitor IP addresses with entries |
| `canUseUnfilteredHtml` | admin users | Who may save Custom HTML and custom CSS |
| `onChange` | — | Called when templates, the site style or pages change (for cache revalidation) |
| `uploadCollection` | `media` | Upload collection used for images |
| `adminGroup` | `Blockwright` | Admin sidebar group |

## Repository structure

```
apps/
  dev/                 Payload 3 + Next.js 16 test site on Postgres (seed script, e2e tests)
packages/
  editor/              Visual drag-and-drop editor (client React app)
  schema/              Layout JSON format, validation, import upgrades, display conditions
  core/                Controls, widget registry, CSS compiler, site style, dynamic values, templates
  renderer/            React renderer (Server Components) and style hoisting
  widgets-basic/       Frame, Heading, Text, Button, Image, Spacer, Divider, Custom HTML
  forms/               Form widget, shared validation, browser enhancer, server actions
  payload-plugin/      Payload plugin: fields, collections, site style, endpoints, dashboard
  next/                Next.js helpers: document and template rendering, next/image and next/link
docs/
  PROJECT_PLAN.md      Architecture and roadmap
  TESTING.md           Manual test checklist for localhost
  LAYOUT_FORMAT.md     The layout JSON format, for editing layouts by hand
  CUSTOM_WIDGETS.md    Building widgets in the admin
  PERMISSIONS.md       Who can edit what, and the admin role
  INSTALL-EXISTING-PROJECT.md  Adding Blockwright to your own Payload project (Windows)
examples/
  existing-project/    Files to copy into an existing Payload project
```

## Layout format

Layouts are stored as JSON in the same shape as Elementor's container export, so existing templates and HTML-to-JSON converters work. A minimal page:

```json
[
  {
    "id": "a1b2c3d",
    "elType": "container",
    "settings": { "flex_direction": "row", "flex_direction_mobile": "column" },
    "elements": [
      {
        "id": "e4f5a6b",
        "elType": "widget",
        "widgetType": "heading",
        "settings": { "title": "Hello", "header_size": "h1", "__globals__": { "title_color": "globals/colors?id=primary" } },
        "elements": []
      }
    ]
  }
]
```

See [`docs/LAYOUT_FORMAT.md`](docs/LAYOUT_FORMAT.md) for every widget's main settings, responsive keys, global colors and fonts, and dynamic values.

## Contributing

1. Create a branch from `main`: `feat/…`, `fix/…` or `docs/…`.
2. Run `pnpm build && pnpm typecheck && pnpm test` before pushing.
3. Open a pull request. CI runs the unit tests and the full browser tests against Postgres.

Blockwright uses Elementor's open JSON format for compatibility, but no Elementor code, icons or text. Please keep it that way.

## Licence

[MIT](LICENSE) © Ahmer and Blockwright contributors. "Elementor" is a trademark of its owner; Blockwright is not affiliated with it.
