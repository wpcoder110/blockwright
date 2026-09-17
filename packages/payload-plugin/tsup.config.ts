import { rmSync } from 'node:fs'
import { defineConfig } from 'tsup'

const external = [/^react/, /^next/, /^payload/, /^@payloadcms\//, /^@blockwright\//, 'sanitize-html']

// both builds run in parallel, so clean once up front
rmSync('dist', { recursive: true, force: true })

export default defineConfig([
  {
    entry: { index: 'src/index.ts', rsc: 'src/rsc.tsx', 'exports/types': 'src/exports/types.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    external,
  },
  {
    entry: { client: 'src/client.tsx' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    external,
    banner: { js: "'use client';" },
  },
])
