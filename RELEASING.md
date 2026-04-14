# Release Process for styled-log-ts

This document describes the step-by-step process to release a new version of `styled-log-ts`.

## Prerequisites

- You have admin/maintainer access to the npm package and GitHub repository
- You have a clean `main` branch with no uncommitted changes
- All tests pass locally: `npm run test`
- All coverage targets are met: `npm run coverage`

## Steps

### 1. Prepare the release branch

```bash
git checkout main
git pull origin main
npm install  # Ensure dependencies are up-to-date
```

### 2. Update version in package.json

Update the `version` field in `package.json` following [Semantic Versioning](https://semver.org/):

```bash
npm version [major | minor | patch]
# or manually edit package.json and then:
# npm install  # to update package-lock.json
```

### 3. Update CHANGELOG.md

Add an entry for the new version at the top of the `Unreleased` section (or create one).
Describe breaking changes, new features, and bug fixes:

```markdown
## [x.x.x] - YYYY-MM-DD

### Added

- New feature description

### Fixed

- Bug fix description

### Changed

- Breaking change description (if any)
```

For guidelines on changelog format and examples, see [CHANGELOG.md](./CHANGELOG.md).

### 4. Commit and tag

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v1.0.7"
git tag v1.0.7
```

### 5. Verify the build and tests

The `prepublishOnly` hook will run automatically during `npm publish`, but you can verify it now:

```bash
npm run build
npm run test
```

### 6. Publish to npm

```bash
npm publish
```

This will:

- Run `prepublishOnly` (build + test)
- Verify git tag matches package.json version
- Pack only files listed in `files` field (enforced by `.npmignore`)
- Upload to npm registry

### 7. Push to GitHub

```bash
git push origin main
git push origin v1.0.7
```

## Verification

After publishing, verify the package on npm:

```bash
npm view styled-log-ts  # Check latest version
npm install styled-log-ts@latest  # Test installation
```

Verify that the tarball contains only `dist/`, `README.md`, and `LICENSE`:

```bash
npm pack --dry-run
```

## Troubleshooting

### Publish fails with version mismatch

Ensure your git tag matches the version in package.json:

```bash
git describe --exact-match --tags HEAD
# Should output: v1.0.7
```

### Types not resolving in consumer projects

Verify that `exports` in package.json is correct:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "require": "./dist/index.cjs",
      "import": "./dist/index.mjs"
    }
  }
}
```

Test with both ESM and CJS imports:

```bash
# ESM
node --input-type=module -e "import { Logger } from 'styled-log-ts'; console.log(typeof Logger)"

# CJS (after building with .cjs entry)
node -e "const { Logger } = require('styled-log-ts'); console.log(typeof Logger)"
```

## Security

- Always publish from a trusted machine with secure npm credentials
- Use `npm login` only on secure connections
- Consider using npm's 2FA for additional security:
  ```bash
  npm profile enable-2fa auth-and-writes
  ```
