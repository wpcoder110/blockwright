// Packs every @blockwright package into ./release so another project can
// install them with npm, pnpm or yarn before they are published to npm.
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'release')
const packages = ['schema', 'core', 'renderer', 'widgets-basic', 'forms', 'editor', 'payload-plugin', 'next', 'blockwright']

rmSync(out, { recursive: true, force: true })
mkdirSync(out)
for (const name of packages) {
  execSync(`pnpm pack --pack-destination "${out}"`, { cwd: path.join(root, 'packages', name), stdio: 'ignore' })
}
const files = readdirSync(out).filter((f) => f.endsWith('.tgz'))
console.log(`\nPacked ${files.length} packages into ${out}:\n${files.map((f) => `  ${f}`).join('\n')}`)
console.log('\nInstall them in your Payload project (PowerShell):')
console.log(`  npm install (Get-ChildItem "${out}\\*.tgz").FullName`)
console.log('Or (macOS/Linux):')
console.log(`  npm install ${out}/*.tgz\n`)
