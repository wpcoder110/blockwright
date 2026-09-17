// Cross-platform `rm -rf`: node scripts/rm.mjs <path> [...paths]
import { rmSync } from 'node:fs'

for (const target of process.argv.slice(2)) rmSync(target, { recursive: true, force: true })
