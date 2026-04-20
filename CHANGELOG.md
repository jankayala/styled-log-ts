# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Documentation

- Expanded README badges with npm version, zero runtime dependencies, and bundle size
- Completed README API reference with `StyledLogger`, additional exported types, and aligned `LogLevel` docs to the enum-based public API

## [2.0.0] - 2026.04.20

### Added

- Typed `onLog` hook support via `Logger` / `createLogger` for custom transports and integrations
- Public `LogEntry` and `LogHook` types for strongly typed log hook consumers

### Changed

- `Logger.child({ prefix })` now preserves inherited `onLog` hooks alongside other parent options
- Hook failures are caught internally and reported to `stderr` without interrupting application logging
- Initial logger level resolution now follows `LOG_LEVEL` env var first, then `options.logLevel`, then default `info`

### Documentation

- Added README examples and API reference entries for `onLog`, `LogEntry`, and custom transport usage
- Documented `LOG_LEVEL` precedence and updated the default initial `logLevel` to `info`

### Testing

- Added Vitest coverage for structured hook payloads, multiple hooks, child hook inheritance, filtered logs, and hook failure isolation
- Added Vitest coverage for `LOG_LEVEL` precedence, case-insensitive parsing, and invalid-value fallback behavior

## [1.0.8] - 2026.04.15

### Added

- `.editorconfig` for consistent formatting across all IDEs (IntelliJ, VS Code, etc.)
- `.prettierrc.json` for deterministic code style enforcement (100 char line width, trailing commas, double quotes)
- `.prettierignore` for excluding build artifacts and generated files
- `npm run format` script to auto-format code
- `npm run format:check` script for CI validation
- Format validation step in CI workflow (`npm run format:check` before build/test)
- `.github/dependabot.yml` for automated npm and GitHub Actions update PRs
- `createLogger(options)` as the recommended logger factory entry point
- `Logger.child({ prefix })` for context-aware child loggers with inherited parent options
- `Logger` options `levelColors` and `levelLabels` for per-level pretty output customization
- AI contributor guidance in `.github/copilot-instructions.md`

### Changed

- CI job order: `install` → `format:check` → `build` → `test` → `coverage`
- Added coverage thresholds in `vite.config.ts` (95% lines/functions/branches/statements)
- Pinned GitHub Actions in `ci.yml` to full commit SHAs for better supply-chain safety
- Child logger prefixes are now applied consistently across `pretty`, `json`, and `log()` output paths
- Public API guidance now prefers `createLogger(...)` while keeping `Logger` exports stable and typed
- Expanded `logger.ts` test coverage for child logger prefix edge cases in pretty, JSON, and `log()` paths
- Invalid `levelColors` values now throw a `TypeError` at logger construction time

### Security

- Added `npm audit --audit-level=high` as a mandatory CI step to fail on High/Critical advisories
- Enabled Dependabot update checks for both npm dependencies and GitHub Actions

### Documentation

- Added "Consistent Formatting (Any IDE)" section to README with format commands
- Expanded README with `createLogger(...)` usage, child logger examples, and updated API reference guidance

### Testing

- Added Vitest coverage for `createLogger(...)` and child logger behavior, including nested prefixes and JSON output
- Added targeted prefix edge-case tests for empty calls and non-string first arguments in `logger.ts`
- Added an index re-export check for `createLogger`

---

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
