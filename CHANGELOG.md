# Changelog

All notable changes to this project are documented in this file.

## [0.3.7] - 2026-11-09

### Added

- Added a read-only `--check` mode for validating manifest synchronization in CI.

## [0.3.6] - 2026-11-09

### Changed

- Reframed the README introduction around the documented companion-manifest use case.

## [0.3.5] - 2026-11-09

### Changed

- Clarified the README's pnpm workflow for projects that start with only `package.json5`.
- Marked pnpm manifest-precedence claims that still need a citation.

## [0.3.4] - 2026-11-09

### Changed

- Simplified README installation guidance and removed repeated usage examples.

## [0.3.3] - 2026-11-09

### Changed

- Clarified pnpm's manifest selection behavior and how synchronized manifests keep package values aligned.

## [0.3.2] - 2026-11-09

### Changed

- Clarified the README's explanation and example for documenting npm package manifests with `package.json5`.

## [0.3.0] - 2026-11-02

### Added

- Added bidirectional synchronization with configurable `package.json` or `package.json5` source of truth.
- Added `JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH` support in `.env` and the process environment.
- Added JSON5-only project discovery and generation of a strict-JSON `package.json`.

### Fixed

- Report invalid source-of-truth environment values with a descriptive error.
- Skip writes when synchronization produces unchanged content.

## [0.2.2] - 2026-05-13

### Changed

- Refined README wording so the npm package page explains sync behavior, blank-comment modes, and current limitations more clearly.
- Added npm package discoverability improvements, including package metadata fields and a top-of-page npm badge/link.

## [0.2.1] - 2026-05-06

### Changed

- Republished the `0.2.0` blank-comment workflow changes as `0.2.1` so the npm release can proceed with a new package version.

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
