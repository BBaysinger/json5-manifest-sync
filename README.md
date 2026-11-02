# json5-manifest-sync

Keep `package.json` and a documented `package.json5` in sync. Choose either file as the source of truth: maintain comments in `package.json5` and generate strict JSON for tools that require it, or update the JSON5 companion from `package.json`.

pnpm supports `package.json5` natively, but other tools in a project’s scripts, CI/CD, publishing, or deployment workflows may still expect `package.json`. When both files exist, pnpm prefers `package.json`; it reads `package.json5` natively when `package.json` is absent. This tool bridges mixed toolchains by keeping both manifests synchronized in either direction.

## Quick Start

Install with the package manager your project already uses:

```bash
npm install --save-dev json5-manifest-sync
```

```bash
pnpm add --save-dev json5-manifest-sync
```

Add a script in your project's `package.json`:

```json
{
  "scripts": {
    "sync:json5": "json5-manifest-sync"
  }
}
```

Run it:

```bash
npm run sync:json5
```

## Why this exists

`package.json` must be strict JSON, which means comments are invalid. That makes it hard to document complex scripts, dependency choices, or workspace settings directly in the manifest.

`package.json` is arguably the most important file in most JavaScript/TypeScript repositories. It drives install behavior, scripts, dependency policy, packaging, and release workflows—so it deserves clear inline documentation.

Some tooling does not treat `package.json5` as a package manifest source. While pnpm supports it in supported workflows, npm, Node-based tooling, legacy CI/CD environments, deployment systems, release tooling, and other ecosystem integrations may still require the conventional `package.json` filename. A companion `package.json5` approach provides documented manifests without giving up broad compatibility.

This is also why the long-running Yarn Berry discussion about comment-friendly manifests is relevant here: [yarnpkg/berry#241](https://github.com/yarnpkg/berry/issues/241) describes the same underlying need, along with the ecosystem compatibility constraints that make a companion `package.json5` approach useful today.

> [!NOTE]
> pnpm's native `package.json5` support is useful when pnpm controls the workflow, but it does not make `package.json5` universally recognized across npm, CI/CD, deployment, release, and other JavaScript tooling. This project keeps `package.json` available for compatibility while providing a documented companion file.

The source of truth for this tool is configurable. By default:

- `package.json` is authoritative for manifest values.
- `package.json5` is authoritative for comments; values are synchronized from `package.json` while mapped `//` comments are preserved where possible.

Alternatively, make `package.json5` authoritative for values and generate a strict `package.json` for tools that need it. In this direction, comments remain in `package.json5`; they are not copied to `package.json`.

**pnpm consideration:** pnpm has no setting or environment variable to prefer `package.json5` when both files exist. The `--source` option and `JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH` variable configure only this tool; they do not change pnpm's selection. When the two manifests are synchronized, this is straightforward: pnpm reads `package.json`, whose values match `package.json5`. If JSON5 is your source of truth, run this tool with `--source=package.json5` before pnpm operations that need the latest values. Pnpm commands may update `package.json`, so reconcile those changes into `package.json5` before syncing from JSON5 again, or they may be overwritten. Removing `package.json` lets pnpm read `package.json5` directly, but may break Node, npm, or other tools that require `package.json`.

For CI or other automated workflows where `package.json5` is authoritative, run the sync as a separate step before pnpm reads the manifest. A lifecycle hook such as `preinstall` may run too late, after pnpm has already selected `package.json`:

```bash
pnpm dlx json5-manifest-sync --source=package.json5
pnpm install
```

## What it does

- Finds `package.json` files recursively (excluding `node_modules`)
- Skips paths ignored by your root `.gitignore`
- Synchronizes each matching `package.json` / `package.json5` pair in either direction
- By default, rewrites `package.json5` values from `package.json` (including `version`, scripts, dependencies, and other manifest fields)
- With `--source=package.json5`, parses JSON5 and creates or updates a strict-JSON `package.json`
- Preserves/migrates mapped `//` comments for keys and supported array items
- Supports three blank-comment modes: `preserve`, `fill`, and `remove`
- Writes stable JSON5 formatting with trailing commas for cleaner diffs
- Keeps a documented `package.json5` synchronized while retaining `package.json` compatibility for npm, legacy CI/CD, and other tooling that requires it

### Current limitations

- Per-item comment preservation is most reliable for arrays of strings.
- Arrays of objects or numbers still serialize correctly, but item-level comments may be dropped.

Repository: https://github.com/BBaysinger/json5-manifest-sync

Package: https://www.npmjs.com/package/json5-manifest-sync

## Author

Bradley Baysinger ([@BBaysinger](https://github.com/BBaysinger))

## Install from the npm registry (recommended)

Use the package manager already used by your project so its lockfile stays consistent.

With npm:

```bash
npm install --save-dev json5-manifest-sync
```

With pnpm:

```bash
pnpm add --save-dev json5-manifest-sync
```

Global install (optional):

```bash
npm install -g json5-manifest-sync
```

Or with pnpm:

```bash
pnpm add --global json5-manifest-sync
```

## Install from GitHub (alternative)

Use this if you want an unreleased branch or tag:

```bash
npm install github:BBaysinger/json5-manifest-sync#main
```

## Use in a project

Add a script in your consuming project's `package.json`:

```json
{
  "scripts": {
    "sync:json5": "json5-manifest-sync"
  }
}
```

Run it:

```bash
npm run sync:json5
```

## Generated `package.json5` example

Illustrative output (trimmed):

<!-- prettier-ignore -->
```json5
{
  // Package name used by npm and consumers.
  "name": "consumer-app",
  // Release version (keep in sync with git tags).
  "version": "1.2.3",
  // Development and release scripts.
  "scripts": {
    // Compile TypeScript to dist/.
    "build": "tsc -p tsconfig.json",
  },
}
```

For the current full output style, see this repo's live example: [`package.json5`](./package.json5).

### Options

By default, the tool runs with `--blank-comments=preserve`.

Choose which manifest is authoritative with:

- `--source=package.json` (default): update `package.json5` from `package.json`, preserving mapped JSON5 comments.
- `--source=package.json5`: create or update `package.json` from `package.json5`; comments remain only in the JSON5 file.

To retain the choice across runs, set `JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH` in the project-root `.env` file:

```dotenv
JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH=package.json5
```

An existing shell environment variable takes precedence over `.env`, and `--source=...` takes precedence over both. If the setting is omitted, the default remains `package.json`.

For a project that has only `package.json5`, run the tool through `npx` (or install it globally) to generate the initial `package.json`—no pnpm installation is needed:

```bash
npx --yes --package=json5-manifest-sync json5-manifest-sync --source=package.json5
```

You cannot use a local `npm run` script or install this tool as a local dev dependency until `package.json` exists. Once generated, npm and other strict-JSON tools can use it. Note that commands such as `npm install` update `package.json`; reconcile those changes back into `package.json5` with the default `--source=package.json` mode before regenerating JSON from the JSON5 source, or those updates could be overwritten.

Because pnpm prefers `package.json` when both files exist, it will read the generated JSON copy in that setup; it reads `package.json5` directly only when `package.json` is absent.

Choose a blank-comment mode with one of the following:

- `--blank-comments=preserve`
- `--blank-comments=fill`
- `--blank-comments=remove`

To warn after sync when blank `//` placeholders remain, add `--warn-blank-comments`. That warning applies to `preserve` and `fill`; `remove` strips those lines.

### Pre-commit synchronization

To keep both manifests aligned in each commit, run `json5-manifest-sync` from a Git pre-commit hook after manifest changes. It uses `JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH` or the `--source` option to choose the authoritative file. Make sure the hook stages the generated counterpart as well; if you use partial staging, stage only the file generated by the sync rather than blindly adding both manifests.

### Formatting note

Recommended: exclude `package.json5` from Prettier (for example via `.prettierignore`).

Prettier's JSON5 formatter can remove quotes from valid keys, which makes `package.json5` less similar to canonical `package.json`. Ignoring `package.json5` helps preserve intentional key/comment style and reduces avoidable drift.

> [!NOTE]
> It would be nice if Prettier provided an option to preserve quoted keys in JSON5.

### AI assist tip

After running `sync:json5`, you can ask an AI coding assistant to fill placeholder comment lines.

If you use this repo's `precommit` workflow, it warns when `package.json5` still contains blank `//` placeholder comments. Suppress just that warning for a given run with `npm run precommit -- --suppress-blank-comment-warning`.

Example prompt:

> "Complete empty `//` comment lines in `package.json5` with concise, field-specific comments."

## Example dependency block in consumer

```json
{
  "dependencies": {
    "json5-manifest-sync": "^0.3.0"
  }
}
```

## Changelog

See `CHANGELOG.md` for full release history.
