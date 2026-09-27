# Roadmap

What exists today, and what is planned next. Dates are intentions, not promises.

## Shipped (0.1.x)

- Visual editor: drag and drop, settings panel, device previews, undo/redo, structure panel, library with import and export
- Widgets: layout frame, heading, text, button, image, icon, icon box, image box, icon list, social icons, alert, video, gallery, maps, tabs, accordion, testimonial, counter, progress, star rating, custom HTML
- Forms: 19 field types, multi-step, conditional logic, spam protection, entries, email notifications, PDF templates
- Navigation: menus collection and nav menu widget
- Theme templates: header, footer, 404, with display conditions
- Site style: global colours, fonts, breakpoints, custom CSS
- Custom widgets built in the admin from fields or JSON
- Commerce: Products, Price, Add to cart, Cart, Cart button and Checkout widgets, product templates, and a cart and checkout API
- Rendering: React Server Components, minimal CSS, WCAG 2.1 AA checks in CI

## Recent fixes (0.2.1)

- Keyboard shortcuts work while focus is in the canvas, and Escape closes the library and other dialogs
- Google Fonts no longer hold up the page when the network blocks them
- Plugin options typecheck before `payload generate:types` has run

## Next

- **Payments**: card payments through the ecommerce plugin's adapters, plus local methods such as JazzCash and Easypaisa
- Variant pickers and category filters for shops
- Inline text editing on the canvas
- More widgets: countdown, pricing table, posts grid, breadcrumbs, search
- Loop templates for any collection
- Global sections reused across pages
- Revision history and template versioning in the editor

## Later

- Popups with display and trigger rules
- Role-based editing permissions per widget
- Multi-language content support
- Performance budget reporting per page
