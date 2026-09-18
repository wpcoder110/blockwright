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
// keep the version shown on the admin overview page in step
const rsc = path.join(root, 'packages', 'payload-plugin', 'src', 'rsc.tsx')
writeFileSync(rsc, readFileSync(rsc, 'utf8').replace(/const PKG_VERSION = '[^']*'/, `const PKG_VERSION = '${version}'`))

console.log(`Set ${dirs.length} packages to ${version}.\nNext:\n  git commit -am "chore: release v${version}"\n  git tag -a v${version} -m "Blockwright v${version}" && git push origin v${version}`)
