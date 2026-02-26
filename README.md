# json5-manifest-sync

Sync `package.json5` files from canonical `package.json` files while preserving mapped line comments.

Repository: https://github.com/BBaysinger/json5-manifest-sync

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
