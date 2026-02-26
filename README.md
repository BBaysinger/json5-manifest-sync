# json5-manifest-sync

Keep a documented `package.json5` in sync with the real `package.json` used by Node and package managers.

## Why this exists

`package.json` must be strict JSON, which means comments are invalid. That makes it hard to document complex scripts, dependency choices, or workspace settings directly in the manifest.

At the same time, Node/npm/pnpm/yarn do not treat `package.json5` as a package manifest source. A JSON5 file can be great for human-readable documentation, but tooling still requires `package.json`.

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
npm install github:BBaysinger/json5-manifest-sync#v0.1.0
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

### Options

- `--no-empty-comment` or `--no-empty-comments`
- `--empty-comment=false`
- env var: `SYNC_JSON5_ADD_EMPTY_COMMENT=false`

## Publishing workflow (GitHub-only)

1. Commit changes in this repo.
2. Bump version in `package.json`.
3. Create and push a tag, for example `v0.1.1`.
4. In consuming projects, update dependency ref to that tag.

Example dependency block in consumer:

```json
{
  "dependencies": {
    "json5-manifest-sync": "github:BBaysinger/json5-manifest-sync#v0.1.0"
  }
}
```
