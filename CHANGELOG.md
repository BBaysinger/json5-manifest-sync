# Changelog

All notable changes to this project are documented in this file.

## [0.1.2] - 2026-02-25

### Fixed

- Fixed CLI entrypoint detection so execution works through npm/yarn/pnpm `.bin` symlinks and wrappers.
- Fixed `npm run sync:json5` no-op behavior seen in consuming repositories installed from git dependencies.
- Kept direct invocation behavior intact for `node dist/json5-manifest-sync.js`.

### Tests

- Added coverage for direct invocation path detection.
- Added coverage for symlinked `.bin`-style invocation path detection.
- Added regression test proving `runCli` updates `package.json5` from canonical `package.json`.
