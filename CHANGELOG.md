# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-05-06

### Breaking Changes

- The default blank-comment mode is now `preserve` instead of the previous placeholder-generating behavior. Existing users who want generated blank `//` lines must now pass `--blank-comments=fill`.

### Changed

- Replaced the old blank-comment toggle with `--blank-comments=preserve|fill|remove`.
- Changed the default blank-comment mode to `preserve` so sync no longer introduces placeholder `//` lines unless requested.
- Added `--warn-blank-comments` to warn after sync when blank `//` placeholders remain.

## [0.1.3] - 2026-02-27

### Added

- Published `json5-manifest-sync` to the npm registry for direct install and global CLI usage.
- Added npm-first installation guidance in the README, including optional global install instructions.

### Changed

- Updated README examples to use npm semver dependency references instead of GitHub-only install URLs.
- Kept GitHub install instructions as an alternative path for unreleased branch/tag consumption.

## [0.1.2] - 2026-02-25

### Fixed

- Fixed CLI entrypoint detection so execution works through npm/yarn/pnpm `.bin` symlinks and wrappers.
- Fixed `npm run sync:json5` no-op behavior seen in consuming repositories installed from git dependencies.
- Kept direct invocation behavior intact for `node dist/json5-manifest-sync.js`.

### Tests

- Added coverage for direct invocation path detection.
- Added coverage for symlinked `.bin`-style invocation path detection.
- Added regression test proving `runCli` updates `package.json5` from canonical `package.json`.
