import { rmSync } from 'node:fs'
import { defineConfig } from 'tsup'

// both entries build in parallel, so clean once up front
rmSync('dist', { recursive: true, force: true })

export default defineConfig([
  {
  entry: {"index": "src/index.tsx"},
  format: ['esm'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  external: [/^react/, /^next/, /^payload/, /^@payloadcms\//, /^@blockwright\//],
  },
  {
    entry: { client: 'src/client.tsx' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    external: [/^react/, /^@blockwright\//],
    banner: { js: "'use client';" },
  },
])
