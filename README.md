# json5-manifest-sync

Keep a documented `package.json5` in sync with the real `package.json` used by Node and package managers, including `version` updates.

## Quick Start

```bash
npm install --save-dev json5-manifest-sync
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

At the same time, Node/npm/pnpm/yarn do not treat `package.json5` as a package manifest source. A JSON5 file can be great for human-readable documentation, but tooling still requires `package.json`.

This is also why the long-running Yarn Berry discussion about comment-friendly manifests is relevant here: [yarnpkg/berry#241](https://github.com/yarnpkg/berry/issues/241) describes the same underlying need, along with the ecosystem compatibility constraints that make a companion `package.json5` approach useful today.

> [!NOTE]
> It would be great to see first-class support for JSON5-style manifests in npm/tooling over time, but today this project provides a practical bridge.

This tool solves that gap by letting you maintain both:

- `package.json` as the canonical, machine-consumed manifest
- `package.json5` as the human-documented companion file

Then it synchronizes `package.json5` from `package.json` while preserving mapped `//` comments where possible.
When values like `version`, `scripts`, or dependency versions change in `package.json`, those updates are propagated into `package.json5`.

## What it does

- Finds `package.json` files recursively (excluding `node_modules`)
- Skips paths ignored by your root `.gitignore`
- For each matching `package.json5`, rewrites values from canonical `package.json` (including `version`, scripts, dependencies, and other manifest fields)
- Preserves/migrates mapped `//` comments for keys and supported array items
- Supports three blank-comment modes: `preserve`, `fill`, and `remove`
- Writes stable JSON5 formatting with trailing commas for cleaner diffs

### Current limitations

- Per-item comment preservation is most reliable for arrays of strings.
- Arrays of objects or numbers still serialize correctly, but item-level comments may be dropped.
- Use `--blank-comments=preserve` to keep existing blank `//` lines without adding new ones.
- Use `--blank-comments=fill` to add blank `//` placeholders where comments are omitted.
- Use `--blank-comments=remove` to strip blank `//` lines from the output.

Repository: https://github.com/BBaysinger/json5-manifest-sync

## Author

Bradley Baysinger ([@BBaysinger](https://github.com/BBaysinger))

## Install from npm (recommended)

```bash
npm install --save-dev json5-manifest-sync
```

Global install (optional):

```bash
npm install -g json5-manifest-sync
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

Choose a blank-comment mode with one of the following:

- `--blank-comments=preserve`
- `--blank-comments=fill`
- `--blank-comments=remove`

To warn after sync when blank `//` placeholders remain, add `--warn-blank-comments`. That warning applies to `preserve` and `fill`; `remove` strips those lines.

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
    "json5-manifest-sync": "^0.1.3"
  }
}
```

## Changelog

See `CHANGELOG.md` for full release history.
