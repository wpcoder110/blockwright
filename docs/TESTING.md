# Testing Blockwright on localhost

Follow the quick start in the [README](../README.md) first (`pnpm db:up`, `pnpm build`, `pnpm seed`, `pnpm dev`). Then work through these checks. Each one says what to do and what you should see.

## 1. Automated checks

| Command | Expected result |
| --- | --- |
| `pnpm test` | All unit tests pass (schema, core, widgets, forms, plugin) |
| `pnpm typecheck` | No errors |
| `pnpm --filter dev build` | Production build finishes |
| `pnpm --filter dev test:e2e` | Browser tests pass on desktop and mobile, including the axe accessibility checks (WCAG 2.1 AA) (needs `playwright install chromium` once, and a seeded database) |

## 2. Accessibility

- [ ] Tab through the home page: focus is always visible, the header menu is reachable, and the dropdown opens on focus.
- [ ] Submit the form empty: focus moves to the first field, the error is read out, and it is tied to the field.
- [ ] Turn on *reduce motion* in your OS: animations and transitions stop.
- [ ] Run Lighthouse → Accessibility on the home page and the contact page.

## 2. Front end

- [ ] **Home page** (http://localhost:3000): sticky header with the site name and two buttons; gradient hero; a three-card grid; contact form; dark footer.
- [ ] **Responsive:** resize to under 1024 px. The grid becomes two columns. Under 767 px it becomes one column, the hero heading shrinks, and the footer stacks.
- [ ] **Animations:** scroll down and the cards fade up. With *reduce motion* turned on in your OS settings, they appear without animation.
- [ ] **Links:** "See how we work" jumps to the process section.
- [ ] **View source:** one `<h1>`, `<header>`, `<main>`, `<footer>` and `<section>` landmarks, and `<style>` tags in `<head>`, not the body.
- [ ] **404** (http://localhost:3000/nope): the "This page wandered off" template, with header and footer.
- [ ] **Lighthouse** (Chrome DevTools → Lighthouse, mobile, on `pnpm --filter dev build && pnpm --filter dev start`): note the Performance, Accessibility and SEO scores.

## 3. Forms

On the home page:

- [ ] Click **Send message** with empty fields. Errors appear under Name, Email and Message, and focus moves to Name.
- [ ] Type an invalid email and fix it. The error clears as you type.
- [ ] Fill in all fields and send. The success message appears and the form clears.
- [ ] Open Mailpit (http://localhost:8025). There is a "New question from …" email with the answers.
- [ ] In the admin, **Form entries** has a new entry with the answers, and an action log showing `save` and `email` as successful.

On http://localhost:3000/contact:

- [ ] Step 1 is shown with numbered step indicators. **Next** with empty fields shows errors.
- [ ] Enter `12345` as the mobile number. You get "Enter an 11-digit number starting with 03."
- [ ] Choose **Other** as the city. "Which city?" appears and is required; choose Lahore and it disappears.
- [ ] Step 2: choosing **Something custom** reveals "Describe the custom piece".
- [ ] The budget slider shows its value as you drag. The star-style rating isn't in this form; add a `rating` field to test it.
- [ ] **Previous** returns to step 1 with your answers kept.
- [ ] Submit. Mailpit receives two emails: the admin notification, and the auto-reply to the visitor's address.

Without JavaScript (DevTools → Command menu → *Disable JavaScript*):

- [ ] The home form still submits. The page reloads with `?bw_form=…&bw_status=success` and shows the success message.

Spam and limits:

- [ ] Submitting more than `FORMS_RATE_LIMIT` times in a minute returns "Too many submissions".
- [ ] A request that fills the hidden honeypot field returns success but creates no entry.

## 4. Visual editor

Open **Pages → Home → Edit with Blockwright**.

- [ ] The page appears in the canvas. Hovering outlines elements; clicking one selects it and opens its settings.
- [ ] Change the hero heading's title. The canvas updates as you type.
- [ ] **Style** tab: set a text color, then pick a global color with the globe icon. Open **Typography** (gear icon) and change the size.
- [ ] Switch to **Mobile** at the top. The canvas narrows; change the heading size. Switch back to desktop: the desktop size is unchanged.
- [ ] Drag **Button** from the left panel onto the page. A blue line shows where it will land.
- [ ] Drag an element by the move handle in its toolbar to a different frame.
- [ ] Duplicate and delete elements from the toolbar; use Ctrl+Z and Ctrl+Shift+Z.
- [ ] Add a section with the column buttons at the bottom of the page.
- [ ] Open the **Navigator** (layers icon) and select an element from the tree.
- [ ] Select an image widget (add one first) and choose or upload an image from the media library.
- [ ] **Save draft**: the public page is unchanged. **Publish**: the public page updates.
- [ ] Leave with unsaved changes: the browser asks you to confirm.

Forms (open **Request a quote**):

- [ ] Click the Mobile number field on the canvas. The form's field list opens at that field.
- [ ] Drag fields by their handle to reorder them; the canvas follows.
- [ ] Add a field, change its type to Select, and add options.
- [ ] Open **Which city?** and edit its show/hide rule.

Navigation:

- [ ] On the site, the header menu shows Home, Our process, Services and Contact. Hover Services: a dropdown opens. On /contact, Contact is highlighted.
- [ ] Narrow the window below 1024 px: a menu button replaces the links and opens the menu (also with JavaScript disabled).
- [ ] **Blockwright → Menus → Main menu**: add an item that links to a page, and a dropdown item with a custom URL. Save; reload the site.
- [ ] Change the contact page's slug: the menu link follows. Change it back.
- [ ] In **Templates → Site header → Edit with Blockwright**, select the Nav menu: pick the menu, change the hover effect, colors and the mobile button settings.

New widgets and structure:

- [ ] Add Icon box, Icon list, Tabs, Accordion, Video, Gallery, Counter and Testimonial. Change their icons with the icon picker.
- [ ] Press Ctrl+I. Drag the structure panel by its header, resize it, and drag rows to reorder elements.

Notifications (on **Request a quote**, select the form):

- [ ] **Email notifications** lists three notifications. Open *Team notification*, add a second address to **Send to**, and use the `{ }` menu to insert a field into the subject.
- [ ] **Preview email** shows the branded email with example answers.
- [ ] Open *Custom orders*: it is only sent when "What would you like?" is "Something custom". Submit the form both ways and check Mailpit.

PDF:

- [ ] Open a form entry and click **Print or save as PDF**. The page uses the *Entry PDF* template; print it to PDF.
- [ ] **Templates → Entry PDF → Edit with Blockwright**: the canvas is A4-width with an example entry. Change the layout and publish; print again.

Custom widgets:

- [ ] **Blockwright → Custom widgets → Create new**, type `promo-card`, keep the starter fields and template, save.
- [ ] Reopen the editor: *Promo card* is under Custom. Add it, change the title color, publish, and check the site.

Templates and library:

- [ ] Open **Templates → Site header → Edit with Blockwright**, click the gear icon, and add an exclusion for the contact page. Publish, then check /contact.
- [ ] Select a frame and click the save icon in its toolbar to save it as a template. Open the **Library** on another page and insert it.
- [ ] **Library → Export** downloads a JSON file; **Library → Import** accepts the file by drag and drop, shows a preview, and inserts it or saves it to the library.

Images:

- [ ] Add an Image widget, choose an uploaded image, and set Width to 50%: the image resizes. Do the same with an Image box (Width, Height and Spacing).
- [ ] View the page source: the `srcset` offers the image at its real size, not an upscaled one, and the image loads.

## 5. Admin

- [ ] **Dashboard:** the Blockwright panel shows four steps, with links that work.
- [ ] **Site style → Colors:** each row shows its swatch and name. Change *Teal* (`accent`) with the colour picker or a preset and save. Buttons on the site change on reload.
- [ ] **Site style → Fonts:** change *Headings* to `Poppins`; a sample of the font appears under the field. Headings change, and the Google Fonts request includes Poppins.
- [ ] **Invalid layout:** add `{"elType":"widget"}` to the layout array and save. Saving is blocked with "Invalid layout: …".
- [ ] **HTML cleaning:** in a Text widget, switch the editor to HTML, add `<script>alert(1)</script>` and save. The script is removed.
- [ ] **Form entries:** open an entry. The answers show as a table; **Print or save as PDF** opens a printable page.
- [ ] **Templates → Site header:** add `exclude/singular/pages/<id of Contact>`. The header disappears on /contact only.
- [ ] **Invalid condition:** add `everywhere`. Saving is blocked.
- [ ] **Drafts:** edit Home and **Save draft** (not publish). The public site is unchanged; http://localhost:3000/?preview=1 while logged in shows the draft with a yellow preview bar.

## 6. Import

While logged in, import an Elementor-style export as a draft template:

```bash
curl -X POST http://localhost:3000/api/bw/templates/import \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <token from POST /api/users/login>" \
  -d @my-export.json
```

The body can be the exported file itself, or `{ "title": "…", "template": <file> }`. Legacy section/column layouts are converted to frames. The new template appears under **Templates** as a draft.

## Reporting problems

Open an issue with the page URL, what you expected, what happened, the browser and device, and any errors from the terminal running `pnpm dev`.
