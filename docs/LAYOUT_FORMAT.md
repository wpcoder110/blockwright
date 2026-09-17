# Layout format

Blockwright stores layouts as JSON arrays of elements. The format matches the container export of popular WordPress page builders, so templates and converters built for that format can be imported.

## Elements

```json
{
  "id": "7c1a2b3",
  "elType": "container",
  "isInner": false,
  "settings": {},
  "elements": []
}
```

| Key | Meaning |
| --- | --- |
| `id` | Unique id (letters, numbers, `_`, `-`). Missing or duplicate ids are replaced on save. |
| `elType` | `container` (a Frame) or `widget`. `section` and `column` are accepted and converted to frames. |
| `widgetType` | For widgets: `heading`, `text-editor`, `button`, `image`, `spacer`, `divider`, `html`, `form`. |
| `isInner` | `true` for nested frames. Top-level frames are boxed by default; nested frames are full width. |
| `settings` | Flat key/value settings. Only values that differ from the defaults need to be stored. |
| `elements` | Children (frames only). |

Limits: 5,000 elements, 24 levels deep, 2 MB.

## Value shapes

| Type | Example |
| --- | --- |
| Slider (size) | `{ "unit": "px", "size": 24 }`; custom CSS: `{ "unit": "custom", "size": "clamp(2rem, 5vw, 4rem)" }` |
| Dimensions (padding, margin, radius, border width) | `{ "unit": "px", "top": 10, "right": 20, "bottom": 10, "left": 20, "isLinked": false }` |
| Gaps | `{ "unit": "px", "column": 20, "row": 20, "isLinked": true }` |
| Link | `{ "url": "/contact", "is_external": "on", "nofollow": "", "custom_attributes": "data-track|cta" }` |
| Media | `{ "url": "/api/media/file/hero.jpg", "alt": "…", "width": 1600, "height": 900 }` |
| Switch | `"yes"` or `""` (forms use `"true"`) |

## Responsive settings

Add the device suffix to any responsive setting: `_tablet`, `_mobile`, and when enabled in Site style `_laptop`, `_tablet_extra`, `_mobile_extra`, `_widescreen`. Smaller devices inherit from larger ones.

```json
{ "flex_direction": "row", "flex_direction_mobile": "column", "padding_mobile": { "unit": "px", "top": 20, "right": 16, "bottom": 20, "left": 16 } }
```

## Global colors and fonts

Reference the Site style instead of fixed values with `__globals__`:

```json
{
  "__globals__": {
    "title_color": "globals/colors?id=primary",
    "typography_typography": "globals/typography?id=primary"
  }
}
```

Custom typography needs the group switch set to `custom`:

```json
{ "typography_typography": "custom", "typography_font_family": "Sora", "typography_font_size": { "unit": "px", "size": 48 }, "typography_font_weight": "700" }
```

Groups follow the same pattern with their prefix: `background_*`, `border_*`, `box_shadow_*`, `text_shadow_*` (for example `background_background: "gradient"`, `background_color`, `background_color_b`, `background_gradient_angle`).

## Dynamic values

`__dynamic__` maps a setting to a tag. The setting's static value is used as a fallback.

```json
{
  "title": "Fallback title",
  "__dynamic__": {
    "title": "[bw-tag id=\"x1\" name=\"doc-title\" settings=\"%7B%22after%22%3A%22%20%E2%80%94%20Sale%22%7D\"]"
  }
}
```

The `settings` attribute is URL-encoded JSON. Every text tag accepts `before`, `after` and `fallback`. `[elementor-tag …]` is also accepted, and common names such as `post-title` map to Blockwright tags.

| Tag | Returns | Settings |
| --- | --- | --- |
| `site-title`, `site-tagline`, `site-url`, `site-logo` | text, url, image | — |
| `doc-title`, `doc-excerpt`, `doc-url`, `doc-id` | text, url | — |
| `doc-date` | text | `type`: published/modified, `format`: short/medium/long/full/iso |
| `doc-field` | any | `path`, e.g. `hero.title` |
| `featured-image` | image | `field` (optional) |
| `archive-title` | text | — |
| `current-date-time` | text | `format` |
| `request-parameter` | text | `query_var` |
| `user-info` | text | `type`: name/email/id |

## Advanced settings (every widget)

| Setting | Effect |
| --- | --- |
| `_margin`, `_padding` | Spacing (frames use `margin`, `padding`) |
| `_element_width`: `inherit` / `auto` / `initial` + `_element_custom_width` | Full, inline or custom width inside a frame |
| `_flex_align_self`, `_flex_size`, `_flex_order_custom` | Flex item behaviour |
| `_position`, `_offset_x`, `_offset_y`, `_z_index` | Positioning |
| `_element_id`, `_css_classes` (frames: `css_classes`) | HTML id and classes |
| `_animation`: `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `zoomIn`, `slideInUp`; `animation_duration`: `fast`/`slow` | Entrance animation (CSS only) |
| `hide_desktop`, `hide_tablet`, `hide_mobile` | Hide per device |
| `_background_*`, `_border_*`, `_border_radius`, `_box_shadow_*` | Wrapper styling |
| `custom_css` | Admin-only CSS; `selector` targets the element |

## Frame

`container_type` (`flex`/`grid`), `content_width` (`boxed`/`full`), `boxed_width`, `width`, `min_height`, `flex_direction`, `flex_justify_content`, `flex_align_items`, `flex_gap`, `flex_wrap`, `grid_columns_grid` (`{ "unit": "fr", "size": 3 }`), `grid_rows_grid`, `grid_gaps`, `grid_auto_flow`, `html_tag` (`div`, `section`, `header`, `footer`, `main`, `article`, `aside`, `nav`, `a`), `link`, `overflow`, plus `background_*`, `border_*`, `border_radius`, `box_shadow_*`.

## Widgets

| Widget | Main settings |
| --- | --- |
| `heading` | `title`, `link`, `header_size` (h1–h6, div, span, p), `align`, `title_color`, `typography_*`, `text_shadow_*`, `title_hover_color`, `blend_mode` |
| `text-editor` | `editor` (HTML, cleaned on save), `align`, `text_color`, `typography_*`, `paragraph_spacing`, `link_color`, `link_hover_color` |
| `button` | `text`, `link`, `align` (incl. `justify`), `size` (xs–xl), `button_css_id`, `button_text_color`, `background_*`, `hover_color`, `button_background_hover_color`, `border_*`, `border_radius`, `button_box_shadow_*`, `text_padding`, `typography_*` |
| `image` | `image`, `bw_alt`, `align`, `caption_source` (none/attachment/custom), `caption`, `link_to` (none/file/custom), `link`, `bw_priority` (load first), `bw_sizes`, `width`, `space` (max width), `height`, `object-fit`, `opacity`, `image_border_*`, `image_border_radius`, `image_box_shadow_*`, caption styles |
| `spacer` | `space` |
| `divider` | `style`, `width`, `align`, `color`, `weight`, `gap` |
| `html` | `html` (admins only) |
| `form` | See below |

## Form

```json
{
  "form_name": "Contact",
  "form_fields": [
    { "custom_id": "name", "field_type": "text", "field_label": "Name", "required": "true", "width": "50", "width_mobile": "100" },
    { "custom_id": "topic", "field_type": "select", "field_label": "Topic", "field_options": "Sales|sales\nSupport|support" },
    {
      "custom_id": "order",
      "field_type": "text",
      "field_label": "Order number",
      "bw_logic": { "action": "show", "match": "all", "rules": [{ "field": "topic", "operator": "is", "value": "support" }] }
    },
    { "custom_id": "hp", "field_type": "honeypot" }
  ],
  "submit_actions": ["save", "email", "redirect"],
  "email_to": "owner@example.com",
  "redirect_to": { "url": "/thanks?name=[field id=\"name\"]" }
}
```

**Field types:** `text`, `email`, `textarea`, `tel`, `number`, `url`, `date`, `time`, `select`, `radio`, `checkbox`, `acceptance`, `rating`, `range`, `password`, `hidden`, `html`, `step`, `honeypot`.

**Field settings:** `custom_id`, `field_label`, `placeholder`, `required`, `width` (100, 80, 75, 66, 60, 50, 40, 33, 25, 20) with `_tablet`/`_mobile`, `field_options` (one per line, `Label|value`), `allow_multiple`, `inline_list`, `rows`, `field_min`, `field_max`, `field_step`, `field_value` (default), `field_html`, `acceptance_text`, `checked_by_default`, `autocomplete`, `bw_pattern` (regex), `bw_error`, `bw_logic`, `css_classes`, and on step fields `previous_button`/`next_button`.

**Conditional logic operators:** `is`, `is_not`, `contains`, `not_contains`, `is_empty`, `not_empty`, `gt`, `lt`. A field can only depend on fields above it.

**Actions:** `save`, `email` (`email_to`, `email_subject`, `email_content`, `email_from`, `email_from_name`, `email_reply_to`, `email_to_cc`, `email_to_bcc`), `email2` (the same keys with `_2`), `redirect` (`redirect_to`), `webhook` (`webhooks`, `webhooks_advanced_data`), `collection` (`bw_collection`, `bw_collection_mapping: [{ "field": "email", "target": "email" }]`).

**Placeholders:** `[all-fields]`, `[field id="…"]`, `{form_name}`, `{site_name}`, `{page_url}`, `{date}`.

**Layout and messages:** `input_size`, `show_labels`, `mark_required`, `button_text`, `button_size`, `button_width`, `button_align`, `step_type` (`none`, `text`, `number`, `number_text`, `progress_bar`), `step_next_label`, `step_previous_label`, `custom_messages` + `success_message`, `error_message`, `server_message`, `invalid_message`, `required_field_message`.

**Style:** `column_gap`, `row_gap`, `label_spacing`, `label_color`, `mark_required_color`, `label_typography_*`, `html_*`, `field_text_color`, `bw_placeholder_color`, `field_typography_*`, `field_background_color`, `field_border_color`, `field_border_width`, `field_border_radius`, `bw_field_padding`, `bw_field_height`, `bw_field_shadow_*`, `bw_field_focus_border_color`, `bw_field_focus_ring_color`, `bw_field_focus_background`, `bw_choice_accent`, `bw_choice_size`, `bw_choice_gap`, `bw_rating_color`, `button_typography_*`, `button_border_*`, `button_border_radius`, `button_text_padding`, `button_background_color`, `button_text_color`, hover and previous-button colors, `hover_transition_duration`, `message_typography_*`, `success_message_color`, `error_message_color`, `inline_message_color`, and step colors and sizes (`step_*`, `steps_*`).

## Template display conditions

Stored as strings on templates:

| Condition | Matches | Priority |
| --- | --- | --- |
| `include/general` | Entire site | 100 |
| `include/archive` | All archives and search | 80 |
| `include/archive/<collection>` | One collection's archive | 70 |
| `include/archive/search` | Search results | 70 |
| `include/singular` | Every single document | 60 |
| `include/singular/<collection>` | Every document in a collection | 50 |
| `include/singular/<collection>/in/<field>/<id>` | Documents related to `<id>` through `<field>` | 40 |
| `include/front_page` | The front page | 30 |
| `include/not_found404` | The 404 page | 20 |
| `include/singular/<collection>/<id>` | One document | 10 |

`exclude/…` with the same paths removes a template where it would otherwise show. When several templates match, the lowest priority number wins, then the most recently updated.
