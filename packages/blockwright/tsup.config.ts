import { rmSync } from 'node:fs'
import { defineConfig } from 'tsup'

const external = [/^react/, /^next/, /^payload/, /^@payloadcms\//, /^@blockwright\//, /^blockwright/, 'sanitize-html']

rmSync('dist', { recursive: true, force: true })

export default defineConfig([
  {
    entry: { index: 'src/index.ts', types: 'src/types.ts', rsc: 'src/rsc.ts', next: 'src/next.ts', widgets: 'src/widgets.ts', forms: 'src/forms.ts', core: 'src/core.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    external,
  },
  {
    entry: { client: 'src/client.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    external,
    banner: { js: "'use client';" },
  },
])
