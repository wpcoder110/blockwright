// Sets the same version across every package: node scripts/version.mjs 0.1.0-alpha.1
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const version = process.argv[2]
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? '')) {
  console.error('Usage: node scripts/version.mjs <version>   e.g. 0.1.0-alpha.1')
  process.exit(1)
}
const dirs = readdirSync(path.join(root, 'packages'))
for (const dir of dirs) {
  const file = path.join(root, 'packages', dir, 'package.json')
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  pkg.version = version
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
}
console.log(`Set ${dirs.length} packages to ${version}.\nNext:\n  git commit -am "chore: release v${version}"\n  git tag v${version} && git push --follow-tags`)
