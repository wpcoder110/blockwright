# Custom widgets

Build your own widgets in the admin, without writing code or rebuilding the site. They appear in the editor's widget panel and render on the live site like built-in widgets.

Open **Blockwright → Custom widgets → Create new**. Only users allowed to save raw HTML (administrators by default) can create or change them.

## 1. Basics

| Field | What it does |
| --- | --- |
| Title | Name shown in the widget panel |
| Type | Unique ID, e.g. `pricing-card`. Saved pages refer to it, so don't change it after using the widget. |
| Category | Panel section (Custom by default) |
| Icon | Icon shown on the widget tile |
| Enabled | Untick to hide the widget from the panel and the site |

## 2. Fields

Each row becomes a setting in the editor.

| Column | Meaning |
| --- | --- |
| Name | Used in the template: `{{ name }}`. Lowercase letters, numbers and underscores. |
| Type | Text, Textarea, Rich text, Number, Switch, Select, Button group, Color, Image, Gallery, Link, Icon, Slider, Font family, or a style group (Typography, Background, Border, Border radius, Box shadow, Padding, Margin) |
| Default | Starting value. Slider: `24px`. Icon: `star`. Link and Image: a URL. |
| Tab / Section | Where the setting appears in the panel |
| Options | For Select and Button group: one per line, `Label|value` |
| Selector + CSS | Makes the setting style the widget. Selector: `{{WRAPPER}} h3`. CSS: `color: {{VALUE}};` or `font-size: {{SIZE}}{{UNIT}};` |
| Responsive | Different values for desktop, tablet and mobile (for settings with CSS) |

Style groups (Typography, Background, Border…) need only a name and a selector; they add all their settings automatically.

## 3. Template

HTML with placeholders:

| Placeholder | Output |
| --- | --- |
| `{{ title }}` | Value, HTML-escaped |
| `{{{ content }}}` | Value as HTML (for Rich text fields) |
| `{{ image.url }}`, `{{ image.alt }}` | Parts of an image |
| `{{ size }}` | Slider value with unit, e.g. `24px` |
| `{{#if featured}}…{{else}}…{{/if}}` | Show something only when a value is set or a switch is on |
| `{{#each items}}{{ this.text }} {{ @index }}{{/each}}` | Loop over a repeater or gallery |
| `{{icon selected_icon}}` | Inline SVG icon |
| `<a {{link button_link}}>` | `href`, `target` and `rel` for a Link field. Unsafe URLs become `#`. |

Example:

```html
<article class="card">
  {{#if featured}}<span class="badge">Popular</span>{{/if}}
  <h3>{{ plan }}</h3>
  <p class="price">{{ price }}</p>
  <a class="cta" {{link cta}}>{{ cta_text }} {{icon cta_icon}}</a>
</article>
```

## 4. CSS

Loaded once per page, only on pages that use the widget. Write `selector` to target the widget:

```css
selector .card { padding: 24px; border: 1px solid #e3e6ee; border-radius: 12px; }
selector .badge { background: var(--bw-c-accent); color: #fff; }
```

Site style variables are available: `var(--bw-c-primary)`, `var(--bw-c-accent)`, `var(--bw-t-primary-font-family)` and so on.

## 5. JSON definition (advanced)

To define settings in JSON instead of rows, fill in **JSON (advanced)**. It replaces the Fields tab and supports repeaters and conditions:

```json
{
  "sections": [
    {
      "id": "content",
      "label": "Team",
      "tab": "content",
      "controls": [
        { "name": "heading", "type": "text", "label": "Heading", "default": "Our team" },
        {
          "name": "people",
          "type": "repeater",
          "label": "People",
          "titleField": "name",
          "fields": [
            { "name": "name", "type": "text", "label": "Name" },
            { "name": "role", "type": "text", "label": "Role" },
            { "name": "photo", "type": "media", "label": "Photo" }
          ],
          "default": [{ "name": "Ahmer Hassan", "role": "CEO" }]
        }
      ]
    },
    {
      "id": "style",
      "label": "Style",
      "tab": "style",
      "controls": [
        { "name": "name_color", "type": "color", "label": "Name color", "selectors": { "{{WRAPPER}} h4": "color: {{VALUE}};" } },
        { "name": "name_typography", "type": "typography", "selector": "{{WRAPPER}} h4" }
      ]
    }
  ]
}
```

Template for that definition:

```html
<h3>{{ heading }}</h3>
<ul class="team">
  {{#each people}}
  <li>{{#if this.photo}}<img src="{{ this.photo.url }}" alt="{{ this.name }}">{{/if}}<h4>{{ this.name }}</h4><p>{{ this.role }}</p></li>
  {{/each}}
</ul>
```

Controls use the same format as built-in widgets. `condition` (for example `{ "show_badge": "yes" }`) hides a setting until another has a value.

## Widgets written in code

Developers can also register React widgets with `blockwrightPlugin({ elements: [...] })` using `defineWidget` from `@blockwright/core`. Those render on the site; showing them in the editor requires adding them to the editor bundle as well, which is planned.
