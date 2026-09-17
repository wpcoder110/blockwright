import { rmSync } from 'node:fs'
import { defineConfig } from 'tsup'

// the two builds below run in parallel, so clean once up front instead of per build
rmSync('dist', { recursive: true, force: true })

const external = [/^react/, /^next/, /^payload/, /^@payloadcms\//, /^@blockwright\//]

export default defineConfig([
  {
    entry: { index: 'src/index.tsx', server: 'src/server.ts', validate: 'src/validate.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    external,
  },
  {
    // client island: keep the directive so Next.js treats it as a client boundary
    entry: { client: 'src/client.tsx' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    external,
    banner: { js: "'use client';" },
  },
])
