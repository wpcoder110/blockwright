import {
  type MenuItem,
  type RenderProps,
  boxShadow,
  choose,
  color,
  defineWidget,
  dimensions,
  docSelect,
  heading,
  opts,
  section,
  select,
  slider,
  switcher,
  text,
  typography,
} from '@blockwright/core'
import { BwLink } from '@blockwright/renderer'

const W = '{{WRAPPER}}'
const ITEM = `${W} .bw-menu > li > .bw-menu-link`
const SUB = `${W} .bw-submenu .bw-menu-link`

/** Shown in the editor before a menu is chosen. */
export const SAMPLE_MENU: MenuItem[] = [
  { id: 's1', label: 'Home', url: '/', children: [] },
  { id: 's2', label: 'About', url: '/about', children: [] },
  {
    id: 's3',
    label: 'Services',
    url: '/services',
    children: [
      { id: 's31', label: 'Design', url: '/services/design', children: [] },
      { id: 's32', label: 'Development', url: '/services/development', children: [] },
    ],
  },
  { id: 's4', label: 'Contact', url: '/contact', children: [] },
]

const normalise = (p: string) => {
  const clean = p.split(/[?#]/)[0]!.replace(/\/+$/, '')
  return clean === '' ? '/' : clean
}

function isCurrent(item: MenuItem, path: string | undefined): boolean {
  if (!path || !item.url || /^(https?:)?\/\//i.test(item.url) || item.url.startsWith('#') || item.url.includes('#')) return false
  return normalise(item.url) === normalise(path)
}

function hasCurrent(item: MenuItem, path: string | undefined): boolean {
  return item.children.some((c) => isCurrent(c, path) || hasCurrent(c, path))
}

function Items({ items, ctx, depth, path }: { items: MenuItem[]; ctx: RenderProps['ctx']; depth: number; path?: string }) {
  return (
    <>
      {items.map((item) => {
        const current = isCurrent(item, path)
        const parent = hasCurrent(item, path)
        const kids = item.children.length > 0 && depth < 3
        const cls = ['bw-menu-item', kids ? 'has-children' : '', current ? 'is-current' : '', parent ? 'is-current-parent' : ''].filter(Boolean).join(' ')
        const rel = [item.newTab ? 'noopener' : '', item.rel ?? ''].filter(Boolean).join(' ') || undefined
        return (
          <li key={item.id} className={cls}>
            <BwLink
              ctx={ctx}
              href={item.url || '#'}
              className="bw-menu-link"
              aria-current={current ? 'page' : undefined}
              target={item.newTab ? '_blank' : undefined}
              rel={rel}
              aria-haspopup={kids ? 'true' : undefined}
            >
              <span>{item.label}</span>
              {kids ? <span className="bw-menu-caret" aria-hidden="true" /> : null}
            </BwLink>
            {kids ? (
              <ul className="bw-submenu">
                <Items items={item.children} ctx={ctx} depth={depth + 1} path={path} />
              </ul>
            ) : null}
          </li>
        )
      })}
    </>
  )
}

function NavMenu({ settings, ctx, data, element }: RenderProps) {
  const items = (Array.isArray(data) ? data : ctx.mode === 'edit' || ctx.mode === 'preview' ? SAMPLE_MENU : null) as MenuItem[] | null
  if (!items?.length) return ctx.mode === 'edit' ? <div className="bw-nav-empty">Choose a menu in the settings</div> : null
  const breakpoint = ['mobile', 'tablet', 'none'].includes(settings.dropdown) ? settings.dropdown : 'tablet'
  const layout = settings.layout === 'vertical' ? 'vertical' : 'horizontal'
  const pointer = settings.pointer || 'underline'
  const id = `bw-nav-${element.id}`
  const label = String(settings.bw_label || 'Main menu')
  return (
    <nav className={`bw-nav bw-nav-${layout} bw-nav-bp-${breakpoint} bw-pointer-${pointer}${settings.full_width === 'yes' ? ' is-full' : ''}`} aria-label={label}>
      {breakpoint !== 'none' ? (
        <>
          <input type="checkbox" id={id} className="bw-nav-check" aria-label={`Show ${label.toLowerCase()}`} />
          <label htmlFor={id} className="bw-nav-toggle" aria-hidden="true">
            <span className="bw-nav-bars" />
            {settings.toggle_label ? <span className="bw-nav-toggle-text">{settings.toggle_label}</span> : null}
          </label>
        </>
      ) : null}
      <ul className="bw-menu">
        <Items items={items} ctx={ctx} depth={1} path={ctx.request?.path} />
      </ul>
    </nav>
  )
}

const BP = { mobile: 767, tablet: 1024 }

const menuCss = () => {
  const desktop =
    '.bw-nav{position:relative;--bw-nav-gap:0px;--bw-nav-px:15px;--bw-nav-py:13px;--bw-nav-color:var(--bw-c-text);--bw-nav-hover:var(--bw-c-accent);--bw-nav-active:var(--bw-c-accent);--bw-nav-pointer:var(--bw-c-accent);--bw-nav-pointer-w:3px;--bw-nav-justify:flex-start;' +
    '--bw-sub-bg:#fff;--bw-sub-color:var(--bw-c-text);--bw-sub-hover-bg:var(--bw-c-accent);--bw-sub-hover:#fff;--bw-sub-width:220px;--bw-toggle-color:var(--bw-c-text);--bw-toggle-bg:transparent;--bw-toggle-size:22px;--bw-toggle-justify:flex-end}' +
    '.bw-nav ul{list-style:none;margin:0;padding:0}' +
    '.bw-menu{display:flex;flex-wrap:wrap;align-items:center;justify-content:var(--bw-nav-justify);gap:var(--bw-nav-gap)}' +
    '.bw-nav-vertical .bw-menu{flex-direction:column;align-items:stretch}' +
    '.bw-menu-item{position:relative}' +
    '.bw-menu-link{position:relative;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:var(--bw-nav-py) var(--bw-nav-px);color:var(--bw-nav-color);text-decoration:none;font-family:var(--bw-t-primary-font-family,inherit);font-weight:500;line-height:1.3;transition:color .2s,background-color .2s}' +
    '.bw-menu>li>.bw-menu-link:hover,.bw-menu>li:focus-within>.bw-menu-link{color:var(--bw-nav-hover)}' +
    '.bw-menu>.is-current>.bw-menu-link,.bw-menu>.is-current-parent>.bw-menu-link{color:var(--bw-nav-active)}' +
    '.bw-menu-link:focus-visible{outline:2px solid var(--bw-nav-hover);outline-offset:-2px}' +
    '.bw-menu-caret{width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);flex:none}' +
    // pointers
    '.bw-pointer-underline .bw-menu>li>.bw-menu-link::after,.bw-pointer-overline .bw-menu>li>.bw-menu-link::after,.bw-pointer-double-line .bw-menu>li>.bw-menu-link::after,.bw-pointer-double-line .bw-menu>li>.bw-menu-link::before{content:"";position:absolute;left:var(--bw-nav-px);right:var(--bw-nav-px);height:var(--bw-nav-pointer-w);background:var(--bw-nav-pointer);opacity:0;transform:scaleX(.6);transition:opacity .2s,transform .2s}' +
    '.bw-pointer-underline .bw-menu>li>.bw-menu-link::after,.bw-pointer-double-line .bw-menu>li>.bw-menu-link::after{bottom:0}' +
    '.bw-pointer-overline .bw-menu>li>.bw-menu-link::after,.bw-pointer-double-line .bw-menu>li>.bw-menu-link::before{top:0}' +
    '.bw-nav .bw-menu>li>.bw-menu-link:hover::after,.bw-nav .bw-menu>li>.bw-menu-link:hover::before,.bw-nav .bw-menu>.is-current>.bw-menu-link::after,.bw-nav .bw-menu>.is-current>.bw-menu-link::before{opacity:1;transform:none}' +
    '.bw-pointer-background .bw-menu>li>.bw-menu-link:hover,.bw-pointer-background .bw-menu>.is-current>.bw-menu-link{background:var(--bw-nav-pointer);color:#fff}' +
    // dropdowns
    '.bw-submenu{position:absolute;left:0;top:100%;z-index:50;min-width:var(--bw-sub-width);padding:6px 0!important;background:var(--bw-sub-bg);box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:4px;opacity:0;visibility:hidden;transform:translateY(6px);transition:opacity .15s,transform .15s,visibility .15s}' +
    '.bw-submenu .bw-submenu{left:100%;top:-6px}' +
    '.bw-menu-item:hover>.bw-submenu,.bw-menu-item:focus-within>.bw-submenu{opacity:1;visibility:visible;transform:none}' +
    '.bw-submenu .bw-menu-link{padding:10px 18px;color:var(--bw-sub-color);white-space:nowrap}' +
    '.bw-submenu .bw-menu-link:hover,.bw-submenu .bw-menu-link:focus-visible,.bw-submenu .is-current>.bw-menu-link{background:var(--bw-sub-hover-bg);color:var(--bw-sub-hover)}' +
    '.bw-submenu .bw-menu-caret{transform:rotate(-45deg)}' +
    '.bw-nav-vertical .bw-submenu{position:static;opacity:1;visibility:visible;transform:none;box-shadow:none;padding:0 0 0 14px!important;background:none}' +
    // mobile toggle (hidden on large screens)
    // hidden from the keyboard until the mobile menu button is in use
    '.bw-nav-check{display:none;position:absolute;width:1px;height:1px;opacity:0;margin:0}' +
    '.bw-nav-toggle{display:none;align-items:center;gap:8px;margin-left:auto;padding:8px;cursor:pointer;color:var(--bw-toggle-color);background:var(--bw-toggle-bg);border-radius:4px;font-size:var(--bw-toggle-size)}' +
    '.bw-nav-bars,.bw-nav-bars::before,.bw-nav-bars::after{display:block;width:1em;height:2px;background:currentColor;border-radius:2px;transition:transform .2s,opacity .2s}' +
    '.bw-nav-bars{position:relative}.bw-nav-bars::before,.bw-nav-bars::after{content:"";position:absolute;left:0}.bw-nav-bars::before{top:-.3em}.bw-nav-bars::after{top:.3em}' +
    '.bw-nav-toggle-text{font-size:15px;font-weight:500}' +
    '.bw-nav-check:focus-visible+.bw-nav-toggle{outline:2px solid var(--bw-nav-hover);outline-offset:2px}' +
    '.bw-nav-empty{padding:12px;border:1px dashed #b7bcc4;text-align:center;font:12px system-ui;color:#687080}'
  const mobile = (bp: string, px: number) =>
    `@media (max-width:${px}px){` +
    `.bw-nav-bp-${bp}{display:flex;flex-wrap:wrap;justify-content:var(--bw-toggle-justify)}` +
    `.bw-nav-bp-${bp} .bw-nav-toggle{display:inline-flex;margin-left:0}` +
    `.bw-nav-bp-${bp} .bw-nav-check{display:block}` +
    `.bw-nav-bp-${bp} .bw-menu{display:none;flex-basis:100%;flex-direction:column;align-items:stretch;gap:0;margin-top:8px;padding:6px 0;background:var(--bw-sub-bg);box-shadow:0 8px 24px rgba(0,0,0,.12);border-radius:4px}` +
    `.bw-nav-bp-${bp}.is-full,.bw-el:has(>.bw-nav-bp-${bp}.is-full){position:static}` +
    `.bw-nav-bp-${bp}.is-full .bw-menu{position:absolute;left:0;right:0;top:100%;z-index:60;margin-top:0;border-radius:0}` +
    `.bw-nav-bp-${bp} .bw-nav-check:checked~.bw-menu{display:flex}` +
    `.bw-nav-bp-${bp} .bw-nav-check:checked+.bw-nav-toggle .bw-nav-bars{background:transparent}` +
    `.bw-nav-bp-${bp} .bw-nav-check:checked+.bw-nav-toggle .bw-nav-bars::before{transform:translateY(.3em) rotate(45deg)}` +
    `.bw-nav-bp-${bp} .bw-nav-check:checked+.bw-nav-toggle .bw-nav-bars::after{transform:translateY(-.3em) rotate(-45deg)}` +
    `.bw-nav-bp-${bp} .bw-menu .bw-menu-link{padding:12px 18px;color:var(--bw-sub-color)}` +
    `.bw-nav-bp-${bp} .bw-menu .bw-menu-link::before,.bw-nav-bp-${bp} .bw-menu .bw-menu-link::after{display:none}` +
    `.bw-nav-bp-${bp} .bw-submenu{position:static;opacity:1;visibility:visible;transform:none;box-shadow:none;background:none;min-width:0;padding:0 0 0 16px!important}` +
    `.bw-nav-bp-${bp} .bw-menu-caret{display:none}}`
  return desktop + mobile('tablet', BP.tablet) + mobile('mobile', BP.mobile) + '@media (prefers-reduced-motion:reduce){.bw-nav *{transition:none!important}}'
}

export const navMenu = defineWidget({
  type: 'nav-menu',
  title: 'Nav menu',
  description: 'Site navigation from a menu, with dropdowns and a mobile menu.',
  icon: 'nav-menu',
  category: 'site',
  keywords: ['menu', 'navigation', 'nav', 'header', 'links'],
  render: NavMenu as never,
  prepare: async (settings, ctx) => {
    const ref = settings.menu
    if (!ref || !ctx.services?.menu) return null
    return ctx.services.menu(ref)
  },
  sections: [
    section('section_layout', 'Layout', [
      docSelect('menu', { label: 'Menu', collection: 'bw-menus', manageUrl: 'bw-menus', description: 'Create and edit menus under Blockwright → Menus.' }),
      select('layout', { label: 'Layout', options: opts({ horizontal: 'Horizontal', vertical: 'Vertical' }), default: 'horizontal' }),
      choose('align_items', {
        label: 'Alignment',
        responsive: true,
        options: opts({ start: 'Start', center: 'Center', end: 'End', justify: 'Stretch' }),
        selectorsDictionary: { start: 'flex-start', center: 'center', end: 'flex-end', justify: 'space-between' },
        selectors: { [W]: '--bw-nav-justify: {{VALUE}};' },
      }),
      select('pointer', { label: 'Hover effect', options: opts({ underline: 'Underline', overline: 'Overline', 'double-line': 'Double line', background: 'Background', none: 'None' }), default: 'underline' }),
      text('bw_label', { label: 'Accessible name', default: 'Main menu', description: 'Tells screen readers which menu this is.' }),
      heading('heading_mobile_dropdown', 'Mobile menu'),
      select('dropdown', { label: 'Show the menu button on', options: opts({ tablet: 'Tablet and mobile', mobile: 'Mobile only', none: 'Never' }), default: 'tablet' }),
      switcher('full_width', { label: 'Full-width dropdown', condition: { 'dropdown!': 'none' } }),
      text('toggle_label', { label: 'Button text', placeholder: 'Menu', condition: { 'dropdown!': 'none' } }),
      choose('toggle_align', {
        label: 'Button alignment',
        options: opts({ left: 'Left', center: 'Center', right: 'Right' }),
        selectorsDictionary: { left: 'flex-start', center: 'center', right: 'flex-end' },
        condition: { 'dropdown!': 'none' },
        selectors: { [W]: '--bw-toggle-justify: {{VALUE}};' },
      }),
    ]),
    section(
      'section_style_main-menu',
      'Main menu',
      [
        ...typography('menu_typography', { selector: `${W} .bw-menu > li > .bw-menu-link` }),
        color('color_menu_item', { label: 'Text color', global: 'colors', selectors: { [W]: '--bw-nav-color: {{VALUE}};' } }),
        color('color_menu_item_hover', { label: 'Hover color', global: 'colors', selectors: { [W]: '--bw-nav-hover: {{VALUE}};' } }),
        color('color_menu_item_active', { label: 'Current page color', global: 'colors', selectors: { [W]: '--bw-nav-active: {{VALUE}};' } }),
        color('pointer_color_menu_item_hover', { label: 'Pointer color', global: 'colors', condition: { 'pointer!': 'none' }, selectors: { [W]: '--bw-nav-pointer: {{VALUE}};' } }),
        slider('pointer_width', { label: 'Pointer thickness', units: ['px'], condition: { pointer: ['underline', 'overline', 'double-line'] }, selectors: { [W]: '--bw-nav-pointer-w: {{SIZE}}{{UNIT}};' } }),
        slider('padding_horizontal_menu_item', { label: 'Horizontal padding', responsive: true, units: ['px', 'em'], selectors: { [W]: '--bw-nav-px: {{SIZE}}{{UNIT}};' } }),
        slider('padding_vertical_menu_item', { label: 'Vertical padding', responsive: true, units: ['px', 'em'], selectors: { [W]: '--bw-nav-py: {{SIZE}}{{UNIT}};' } }),
        slider('menu_space_between', { label: 'Space between', responsive: true, units: ['px', 'em'], selectors: { [W]: '--bw-nav-gap: {{SIZE}}{{UNIT}};' } }),
        dimensions('menu_item_border_radius', { label: 'Item border radius', selectors: { [ITEM]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
      ],
      { tab: 'style' },
    ),
    section(
      'section_style_dropdown',
      'Dropdown',
      [
        ...typography('dropdown_typography', { selector: SUB }),
        color('color_dropdown_item', { label: 'Text color', global: 'colors', selectors: { [W]: '--bw-sub-color: {{VALUE}};' } }),
        color('background_color_dropdown_item', { label: 'Background', global: 'colors', selectors: { [W]: '--bw-sub-bg: {{VALUE}};' } }),
        color('color_dropdown_item_hover', { label: 'Hover text color', global: 'colors', selectors: { [W]: '--bw-sub-hover: {{VALUE}};' } }),
        color('background_color_dropdown_item_hover', { label: 'Hover background', global: 'colors', selectors: { [W]: '--bw-sub-hover-bg: {{VALUE}};' } }),
        slider('dropdown_width', { label: 'Width', units: ['px'], selectors: { [W]: '--bw-sub-width: {{SIZE}}{{UNIT}};' } }),
        dimensions('dropdown_border_radius', { label: 'Border radius', selectors: { [`${W} .bw-submenu`]: 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' } }),
        ...boxShadow('dropdown_box_shadow', { selector: `${W} .bw-submenu` }),
      ],
      { tab: 'style' },
    ),
    section(
      'style_toggle',
      'Menu button',
      [
        color('toggle_color', { label: 'Color', global: 'colors', selectors: { [W]: '--bw-toggle-color: {{VALUE}};' } }),
        color('toggle_background_color', { label: 'Background', global: 'colors', selectors: { [W]: '--bw-toggle-bg: {{VALUE}};' } }),
        slider('toggle_size', { label: 'Size', units: ['px'], selectors: { [W]: '--bw-toggle-size: {{SIZE}}{{UNIT}};' } }),
      ],
      { tab: 'style', condition: { 'dropdown!': 'none' } },
    ),
  ],
  baseCss: menuCss(),
})
