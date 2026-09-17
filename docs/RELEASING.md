# Releasing

Blockwright ships as one npm package, **`blockwright`**, which pulls in the `@blockwright/*` packages it needs. Only built files are published: each package lists `"files": ["dist", "README.md", "LICENSE"]`, so source, tests and the demo app never end up in the tarball.

npm always serves the last released version. Work on `main` continues without affecting it, because publishing only happens from a version tag.

## Cut a release

```bash
pnpm release:check                 # build, typecheck, tests, and a local pack
pnpm version:set 0.1.0-alpha.1     # same version for every package
git commit -am "chore: release v0.1.0-alpha.1"
git tag v0.1.0-alpha.1
git push --follow-tags
```

The **Release** workflow then builds, typechecks and tests again, verifies the tag matches the package version, and publishes with npm provenance.

**One-time setup:** add an npm automation token as the `NPM_TOKEN` repository secret (Settings → Secrets and variables → Actions), and make sure the npm account owns the `blockwright` name and the `@blockwright` scope.

Pre-release versions (`0.1.0-alpha.1`) install only when asked for explicitly, so `npm install blockwright` keeps serving the last stable version once one exists.

## Install without npm

Until the first publish, build tarballs locally:

```bash
pnpm pack:local     # writes release/*.tgz (dist only)
```

Then install them in another project, as described in [`INSTALL-EXISTING-PROJECT.md`](INSTALL-EXISTING-PROJECT.md).

## What each package is for

| Package | Purpose |
| --- | --- |
| `blockwright` | What you install: the Payload plugin, admin components, Next.js helpers |
| `@blockwright/schema` | Layout format and validation |
| `@blockwright/core` | Controls, registry, CSS compiler, site style, dynamic values |
| `@blockwright/renderer` | React renderer, icons, custom-widget templates |
| `@blockwright/widgets-basic` | Built-in widgets |
| `@blockwright/forms` | Form widget, validation, notifications |
| `@blockwright/editor` | Visual editor (client) |
| `@blockwright/payload-plugin` | Collections, globals, endpoints, admin views |
| `@blockwright/next` | Page and template rendering helpers |
