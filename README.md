# json5-manifest-sync

Add comments to your package manifest in a companion `package.json5`, then sync it with the standard `package.json` expected by npm and other tools. This works whether you use pnpm, which supports `package.json5` natively, or simply want a documented manifest while retaining compatibility with tools that require `package.json`. Choose either file as the source of truth for manifest values; `package.json` remains valid strict JSON.

For example, document dependencies in `package.json5` and generate `package.json` for npm or other tools that require it:

<!-- prettier-ignore -->
```json5
{
  "dependencies": {
    // Keep JSON5 parsing available to the CLI.
    "json5": "^2.2.3",
  },
}
```

```bash
npx json5-manifest-sync --source=package.json5
```

The tool can also work in the other direction: by default, it updates `package.json5` from `package.json`, preserving mapped `//` comments where possible.

> [!NOTE]
> pnpm supports `package.json5` natively, but when both files exist it prefers `package.json` (citation needed). Keeping the manifests synchronized makes this trivial: pnpm reads `package.json`, whose values match `package.json5`. Other tools in your scripts, CI/CD, publishing, or deployment workflows may also expect `package.json`.

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

## Alternative installation methods

Global install (optional):

```bash
npm install -g json5-manifest-sync
```

Or with pnpm:

```bash
pnpm add --global json5-manifest-sync
```

### Install from GitHub (alternative)

Use this if you want an unreleased branch or tag:

```bash
npm install github:BBaysinger/json5-manifest-sync#main
```

## Why this exists

`package.json` must be strict JSON, which means comments are invalid. That makes it hard to document complex scripts, dependency choices, or workspace settings directly in the manifest.

`package.json` is arguably the most important file in most JavaScript/TypeScript repositories. It drives install behavior, scripts, dependency policy, packaging, and release workflows—so it deserves clear inline documentation.

Some tooling does not treat `package.json5` as a package manifest source. While pnpm supports it in supported workflows, npm, Node-based tooling, legacy CI/CD environments, deployment systems, release tooling, and other ecosystem integrations may still require the conventional `package.json` filename. A companion `package.json5` approach provides documented manifests without giving up broad compatibility.

This is also why the long-running Yarn Berry discussion about comment-friendly manifests is relevant here: [yarnpkg/berry#241](https://github.com/yarnpkg/berry/issues/241) describes the same underlying need, along with the ecosystem compatibility constraints that make a companion `package.json5` approach useful today.

The source of truth for this tool is configurable. By default:

- `package.json` is authoritative for manifest values.
- `package.json5` is authoritative for comments; values are synchronized from `package.json` while mapped `//` comments are preserved where possible.

Alternatively, make `package.json5` authoritative for values and generate a strict `package.json` for tools that need it. In this direction, comments remain in `package.json5`; they are not copied to `package.json`.

**pnpm consideration:** pnpm has no setting or environment variable to prefer `package.json5` when both files exist (citation needed). The `--source` option and `JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH` variable configure only this tool; they do not change pnpm's selection. When the two manifests are synchronized, this is straightforward: pnpm reads `package.json`, whose values match `package.json5`. If JSON5 is your source of truth, run this tool with `--source=package.json5` before pnpm operations that need the latest values. Pnpm commands may update `package.json`, so reconcile those changes into `package.json5` before syncing from JSON5 again, or they may be overwritten. Removing `package.json` lets pnpm read `package.json5` directly, but may break Node, npm, or other tools that require `package.json`.

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

## Options

By default, the tool runs with `--blank-comments=preserve`.

Choose which manifest is authoritative with:

- `--source=package.json` (default): update `package.json5` from `package.json`, preserving mapped JSON5 comments.
- `--source=package.json5`: create or update `package.json` from `package.json5`; comments remain only in the JSON5 file.

To retain the choice across runs, set `JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH` in the project-root `.env` file:

```dotenv
JSON5_MANIFEST_SYNC_SOURCE_OF_TRUTH=package.json5
```

An existing shell environment variable takes precedence over `.env`, and `--source=...` takes precedence over both. If the setting is omitted, the default remains `package.json`.

If you use npm in a project that has only `package.json5`, run the tool through `npx` (or install it globally) to generate the initial `package.json`:

```bash
npx --yes --package=json5-manifest-sync json5-manifest-sync --source=package.json5
```

Without `package.json`, npm cannot run project scripts or install local dev dependencies. pnpm supports `package.json5` directly, so you can install the tool with `pnpm add --save-dev json5-manifest-sync` and run `pnpm exec json5-manifest-sync --source=package.json5`. If you define a script in `package.json5`, include `--source=package.json5` in its command; the default direction reads `package.json`. Once generated, `package.json` is available to npm and other tools that require strict JSON.

Commands such as `npm install` update `package.json`; reconcile those changes back into `package.json5` with the default `--source=package.json` mode before regenerating JSON from the JSON5 source, or those updates could be overwritten.

In this setup, pnpm reads the generated `package.json`; it reads `package.json5` directly only when `package.json` is absent (citation needed).

Choose a blank-comment mode with one of the following:

- `--blank-comments=preserve`
- `--blank-comments=fill`
- `--blank-comments=remove`

To warn after sync when blank `//` placeholders remain, add `--warn-blank-comments`. That warning applies to `preserve` and `fill`; `remove` strips those lines.

Use `--check` to compare each selected source manifest's generated output with its counterpart without writing files. It exits with status `1` if an output is missing or differs, and `0` if all checked outputs are current. It respects `--source` and `--blank-comments`; in the default `package.json` source direction, packages without a `package.json5` companion are skipped, as they are during sync.

For CI, run the check directly:

```bash
npx --yes --package=json5-manifest-sync json5-manifest-sync --check
```

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

## Changelog

See `CHANGELOG.md` for full release history.

## Author

Bradley Baysinger ([@BBaysinger](https://github.com/BBaysinger))
