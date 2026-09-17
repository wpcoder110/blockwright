import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {"index": "src/index.tsx"},
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: [/^react/, /^next/, /^payload/, /^@payloadcms\//, /^@blockwright\//],
})
