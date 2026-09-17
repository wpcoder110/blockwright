import type { ElementDefinition, Registry } from '@blockwright/core'
import { button } from './widgets/button'
import { divider } from './widgets/divider'
import { frame } from './widgets/frame'
import { heading } from './widgets/heading'
import { html } from './widgets/html'
import { image } from './widgets/image'
import { spacer } from './widgets/spacer'
import { textEditor } from './widgets/text'
import { SAMPLE_MENU, navMenu } from './widgets/nav'
import { iconBox, iconList, iconWidget, imageBox, socialIcons } from './widgets/icons'
import { accordion, alert, counter, googleMaps, imageGallery, progress, starRating, tabs, testimonial, video } from './widgets/content'

export { button, divider, frame, heading, html, image, spacer, textEditor }
export { iconBox, iconList, iconWidget, imageBox, socialIcons, accordion, alert, counter, googleMaps, imageGallery, progress, starRating, tabs, testimonial, video }
export { youtubeId, vimeoId } from './widgets/content'
export { navMenu, SAMPLE_MENU }

export const basicElements: ElementDefinition[] = [
  frame, heading, textEditor, button, image, spacer, divider,
  navMenu,
  iconWidget, iconBox, imageBox, iconList, socialIcons, alert,
  video, imageGallery, googleMaps,
  tabs, accordion,
  testimonial, counter, progress, starRating,
  html,
]

export function registerBasicElements(registry: Registry) {
  basicElements.forEach((d) => registry.register(d))
}
