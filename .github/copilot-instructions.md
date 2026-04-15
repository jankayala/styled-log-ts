# Copilot Instructions

Use these project-specific rules when generating or editing code in this repository.

## Scope and priorities

- Keep the package zero-runtime-dependency.
- Preserve TypeScript strictness and avoid `any`.
- Prefer small, focused changes over broad refactors.
- Maintain backward compatibility unless the task explicitly allows a breaking change.

## Logging behavior requirements

- Respect color policy in this order: `NO_COLOR` -> `FORCE_COLOR` -> `process.stdout.isTTY`.
- Keep `error` output on `stderr`; all other levels on `stdout`.
- Support both output formats:
  - `pretty` for developer-friendly output
  - `json` for NDJSON production output
- Ensure object/error serialization stays deterministic and safe (including circular values).

## API conventions

- Treat `createLogger(...)` as the preferred API entry point.
- Keep `Logger` class exports stable and fully typed.
- Child loggers created with `child({ prefix })` should inherit parent options.
- Re-export public surface from `src/index.ts`; avoid deep-import-only APIs.

## Tests and quality gates

- Add or update Vitest tests for every behavior change.
- Use spies for stream assertions (`console.log`/`console.error`) in logger tests.
- Keep docs aligned with public API changes in `README.md`.
- Update the `Unreleased` section in `CHANGELOG.md` to reflect the implemented changes.
- Do not modify generated `coverage/` output manually.

## Style

- Follow existing formatting and naming conventions.
- Keep comments concise and only for non-obvious logic.
- Use English for docs, comments, commit messages, and user-facing text.
