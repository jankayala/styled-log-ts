# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2026.04.14

### Added

- `source` field in `package.json` pointing to `src/index.ts` for bundler consumers
- `.npmignore` for explicit package file control
- `RELEASING.md` with comprehensive release process documentation
- Export validation test scripts (`scripts/test-exports.mjs`, `scripts/test-exports.cjs`)
- `prepublishOnly` npm hook to enforce `build` + `test` before publishing

### Changed

- Enhanced `package.json` export map documentation

---

## [1.0.6] - 2026-04-10

### Added

- Complete styled-log-ts library implementation with:
  - `Logger` class for production-ready logging
  - `styled()` utility for ANSI color formatting
  - `shouldUseColor()` for intelligent color detection
  - `stripAnsi()` for ANSI code removal
- Comprehensive test suite (159 tests)
- TypeScript strict mode support with full type definitions
- Zero runtime dependencies
- Support for both CommonJS and ES Modules

### Features

- **Color Policy**: Respects `NO_COLOR`, `FORCE_COLOR`, and TTY detection
- **Error Routing**: Routes `error` level logs to `stderr`
- **JSON Mode**: Optional JSON/NDJSON output format for production systems
- **Structured Logging**: Pretty and JSON formats for different environments
- **Type Safety**: Fully typed Logger with `StyledLogger` union type export
- **Edge Cases**: Handles `undefined`, `null`, `Symbol`, functions, and circular references

### Build & Distribution

- ESM and CJS builds with source maps
- Complete TypeScript declarations (`*.d.mts`, `*.d.cts`)
- Minimal bundle size: ~15 kB per format (4.5-4.6 kB gzipped)
- Clean package distribution (9 files total, 30.2 kB gzipped)

### Documentation

- Comprehensive README with usage examples
- Inline code documentation
- Export map configuration

### Testing

- 159 unit tests covering:
  - Color policy enforcement
  - Log level routing (stdout/stderr)
  - JSON and pretty format modes
  - Edge case handling
  - Type safety validation

---
