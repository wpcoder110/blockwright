/**
 * Blockwright for Payload CMS.
 *
 * ```ts
 * import { blockwrightPlugin } from 'blockwright'
 *
 * export default buildConfig({
 *   plugins: [blockwrightPlugin({ collections: ['pages'] })],
 * })
 * ```
 */
export * from '@blockwright/payload-plugin'
export { blockwrightPlugin as default } from '@blockwright/payload-plugin'
