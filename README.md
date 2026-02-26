# json5-manifest-sync

Keep a documented `package.json5` in sync with the real `package.json` used by Node and package managers.

## Quick Start

```bash
npm install github:BBaysinger/json5-manifest-sync#v0.1.3
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

> [!NOTE]
> It would be great to see first-class support for JSON5-style manifests in npm/tooling over time, but today this project provides a practical bridge.

This tool solves that gap by letting you maintain both:

- `package.json` as the canonical, machine-consumed manifest
- `package.json5` as the human-documented companion file

Then it synchronizes `package.json5` from `package.json` while preserving mapped `//` comments where possible.

## What it does

- Finds `package.json` files recursively (excluding `node_modules`)
- Skips paths ignored by your root `.gitignore`
- For each matching `package.json5`, rewrites values from canonical `package.json`
- Preserves/migrates mapped `//` comments for keys and supported array items
- Writes stable JSON5 formatting with trailing commas for cleaner diffs

Repository: https://github.com/BBaysinger/json5-manifest-sync

## Author

Bradley Baysinger ([@BBaysinger](https://github.com/BBaysinger))

## Install from GitHub

Install from a tag (recommended):

```bash
npm install github:BBaysinger/json5-manifest-sync#v0.1.3
```

Or from a branch during iteration:

```bash
npm install github:BBaysinger/json5-manifest-sync#main
```

Because this repo defines a `prepare` script, npm will build TypeScript during git-based install.

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

- `--no-empty-comment` or `--no-empty-comments`
- `--empty-comment=false`
- env var: `SYNC_JSON5_ADD_EMPTY_COMMENT=false`

### Formatting note

Recommended: exclude `package.json5` from Prettier (for example via `.prettierignore`).

Prettier's JSON5 formatter can remove quotes from valid keys, which makes `package.json5` less similar to canonical `package.json`. Ignoring `package.json5` helps preserve intentional key/comment style and reduces avoidable drift.

> [!NOTE]
> It would be nice if Prettier provided an option to preserve quoted keys in JSON5.

## Example dependency block in consumer

```json
{
  "dependencies": {
    "json5-manifest-sync": "github:BBaysinger/json5-manifest-sync#v0.1.3"
  }
}
```

## Changelog

See `CHANGELOG.md` for full release history.
