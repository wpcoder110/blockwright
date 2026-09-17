# Install Blockwright in an existing Payload project (Windows)

This guide adds Blockwright to a project created from the official **Payload plugin template**, the kind with a `dev\` folder containing `payload.config.ts` and `helpers\credentials.ts`. It was tested with that template on Payload 3.84 and Next.js 16. Other Payload 3 projects work the same way; only the file locations differ (see the end of this guide).

Blockwright is not on npm yet, so you build it once from this repository and install the packed files.

## 1. Install the tools (once)

Open **PowerShell** and run:

```powershell
winget install --id Git.Git -e --source winget
npm install -g pnpm@9
```

Close PowerShell and open it again, so `git` and `pnpm` are found. Check them with `git --version` and `pnpm --version`.

If PowerShell says *running scripts is disabled on this system*, run this once, then retry:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 2. Download and pack Blockwright

Put it next to your project, not inside it:

```powershell
cd C:\Users\dell\projects
git clone https://github.com/wpcoder110/blockwright-alpha.git
cd blockwright-alpha
git checkout feat/m0-foundation
pnpm install
pnpm pack:local
```

The repository is private, so the first `git clone` opens a GitHub sign-in window. `pnpm pack:local` builds everything and writes seven `.tgz` files to `blockwright-alpha\release`.

## 3. Install it into your project

```powershell
cd C:\Users\dell\projects\rlt
npm install (Get-ChildItem ..\blockwright-alpha\release\*.tgz).FullName
```

## 4. Add the example files

This copies a **Pages** collection and the front-end routes into your `dev` folder. (`robocopy` is built into Windows and handles the bracketed folder names; ignore its summary table.)

```powershell
robocopy ..\blockwright-alpha\examples\existing-project\dev .\dev /E
```

It adds:

```
dev\collections\Pages.ts                     pages with title, slug and drafts
dev\app\(frontend)\layout.tsx                <html> and <body> for the public site
dev\app\(frontend)\[[...slug]]\page.tsx      renders pages, header and footer
dev\app\(frontend)\not-found.tsx             renders the 404 template
```

## 5. Register the plugin

Open `dev\payload.config.ts` and make three changes. The full result is in `examples\existing-project\payload.config.example.ts` if you want to compare.

```ts
// 1. imports, at the top
import { blockwrightPlugin } from '@blockwright/payload-plugin'
import { Pages } from './collections/Pages.js'

// 2. add Pages to the collections array
collections: [
  Pages,
  { slug: 'posts', fields: [] },
  // ...
],

// 3. add the plugin to the plugins array
plugins: [
  rlt({ collections: { posts: true } }),
  blockwrightPlugin({ collections: ['pages'] }),
],
```

Then regenerate the admin import map:

```powershell
npx cross-env PAYLOAD_CONFIG_PATH=./dev/payload.config.ts payload generate:importmap
```

## 6. Run it

```powershell
npm run dev
```

1. Open http://localhost:3000/admin and log in with the dev user (`dev@payloadcms.com` / `test`).
2. The dashboard shows a **Blockwright** panel. Click **Install demo content**.
3. Open http://localhost:3000 (home page), http://localhost:3000/contact (multi-step form) and http://localhost:3000/nope (404 page).
4. In the admin, open **Pages → Home** and click **Edit with Blockwright** in the sidebar to use the visual editor.
5. Submit a form, then check **Blockwright → Form entries** in the admin.

The template's test email adapter prints emails in the terminal. Until you set a recipient, form emails go to the first admin user.

Then continue with the checklist in [`TESTING.md`](TESTING.md).

## Updating Blockwright

```powershell
cd C:\Users\dell\projects\blockwright-alpha
git pull
pnpm install
pnpm pack:local
cd ..\rlt
npm install (Get-ChildItem ..\blockwright-alpha\release\*.tgz).FullName
npx cross-env PAYLOAD_CONFIG_PATH=./dev/payload.config.ts payload generate:importmap
Remove-Item -Recurse -Force dev\.next
npm run dev
```

Always regenerate the import map after updating: new versions can add admin components (for example the editor and the entry view).

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `git` or `pnpm` is not recognised | Close and reopen PowerShell after installing. |
| `ERESOLVE` peer dependency error | Your Payload or Next.js version is older than 3.0 or 15. Share the error so we can check it. |
| Admin error mentioning `BlockwrightWelcome`, `EditWithBlockwright` or the import map | Run the `generate:importmap` command from step 5 again. |
| Home page returns 404 | Install the demo content, or create a page with the slug `home` and publish it. |
| A layout change is not showing | The page must be published. Drafts are only visible in preview. |
| Old code after updating | Delete `dev\.next` and restart. |

## Other Payload 3 projects

If your project is not based on the plugin template:

- Your config is usually `src\payload.config.ts`, and the app folder is `src\app`. Copy the example files there instead of into `dev`.
- If you already have a `pages` collection with a `slug` field, skip `Pages.ts` and just add `blockwrightPlugin({ collections: ['pages'] })`.
- If your site already has a page at `/` (for example `src\app\(frontend)\page.tsx`), rename the example route folder from `[[...slug]]` to `[...slug]`. Blockwright pages then render at `/about`, `/contact` and so on, while your home page stays as it is.
- Run `npx payload generate:importmap` after adding the plugin.
