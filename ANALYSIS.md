# SMDB Project Analysis

## What the project is

A **Scale Modeling Database** — a TypeScript/Node.js monorepo with three packages:
- `@smdb/types` — shared domain types (17 entity modules, re-exported through a single index)
- `@smdb/server` — Express 5 REST API backed by SQLite/Sequelize, spec-driven via a ~51KB OpenAPI 3.0.3 YAML, tested with Vitest
- `client/` — placeholder (empty except for a `tsconfig.json`; no `package.json` yet)

---

## Current state: structured like a monorepo, but not wired as one

The packages follow monorepo naming conventions (`@smdb/*`) and the directory layout is correct, but the plumbing is absent:

| Gap | Detail |
|-----|--------|
| No workspace protocol | Root `package.json` has no `workspaces` field; packages can't reference each other via `workspace:*` |
| `@smdb/types` not a real dependency | Server uses a raw `paths` alias (`@smdb-types/*` → `types/src/*`) in the root `tsconfig.json` rather than a proper package link |
| `@smdb/types` has no build | `main` points to `src/index.ts` (source), no build script, no `dist/`; works in dev but will break in any real build pipeline |
| No root orchestration scripts | No `build`, `test`, or `lint` scripts at root; each package is an island |
| Mixed ESLint config formats | Root uses flat config (`eslint.config.js`); both `types` and `server` have old-style `.eslintrc.json` — this creates ambiguity |
| Inconsistent TypeScript versions | Root pins `^5.5.4`, server pins `^5.9.3`; types has no TypeScript dependency at all |
| `client/` is not a valid package | Has a `tsconfig.json` but no `package.json`, so it isn't recognized by any tooling |

---

## Recommendations

### 1. Package manager — stay on Yarn, but choose a path

You're on **Yarn Classic 1.22.22**. Three options in ascending order of effort:

**A. Stay on Yarn 1 + add workspaces** (least friction)
Workspaces in Yarn 1 are stable and battle-tested. Just add the `workspaces` field and you're done.

**B. Upgrade to Yarn 4 (Berry)** (recommended if you want to stay in the Yarn ecosystem)
Yarn 4 with `nodeLinker: node-modules` is a drop-in upgrade for most projects, and it adds: zero-installs optionally, better workspace tooling, built-in `workspace:` protocol, and active maintenance. Yarn 1 is no longer developed.

**C. Migrate to pnpm** (best long-term, most work to migrate)
pnpm has become the dominant choice for TypeScript monorepos. Its strict symlinked `node_modules` prevents phantom dependency bugs, and its workspace support is first-class. The migration cost from Yarn is real but manageable.

**Recommendation: Yarn 4 now, with pnpm as a future option.** The upgrade is low-risk, keeps your existing `yarn.lock` topology, and eliminates the maintenance-dead Yarn 1.

---

### 2. Build orchestration — Turborepo

For a 2–3 package monorepo, **Turborepo** is the right fit:

- Zero-config for simple pipelines (just a `turbo.json`)
- Understands package dependency order: builds `types` before `server` before `client`
- File-hash-based local caching — running `turbo build` twice skips everything already built
- Optional remote cache (Vercel or self-hosted)
- Works with Yarn, pnpm, or npm unchanged

Nx would also work but is substantially heavier and better suited for 10+ package monorepos or Angular/React enterprise setups. Lerna is legacy. Turborepo is the right choice here.

Minimal `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

The `^build` syntax means: "build all packages this package depends on first." `types` would automatically build before `server`.

---

### 3. Wire up `@smdb/types` as a real package dependency

Three changes needed:

**`types/package.json`** — add exports, build script, and TypeScript:
```json
{
  "name": "@smdb/types",
  "version": "0.1.0",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc --build",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "workspace:*"
  }
}
```

**`types/tsconfig.json`** — add `composite: true` (required for project references and incremental builds):
```json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

**`server/package.json`** — add the real dependency:
```json
"dependencies": {
  "@smdb/types": "workspace:*",
  ...
}
```

Then update `server/tsconfig.json` to use TypeScript project references instead of the manual `paths` alias, and drop the `@smdb-types/*` alias from root `tsconfig.json`.

---

### 4. TypeScript project references at root

Replace the current root `tsconfig.json` `paths` workaround with proper project references:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "strict": true,
    "moduleResolution": "nodenext"
  },
  "references": [
    { "path": "./types" },
    { "path": "./server" }
  ]
}
```

With `composite: true` in each sub-package's tsconfig, running `tsc --build` at the root compiles packages in dependency order with incremental caching. IDEs also pick up cross-package "go to definition" correctly.

---

### 5. Consolidate ESLint

Delete `types/.eslintrc.json` and `server/.eslintrc.json`. The root `eslint.config.js` already uses the modern flat config format; extend it to cover all packages by adding file globs, or have each package import from the root config. Mixing old-style and flat configs in the same repo is a source of subtle rule-override bugs.

---

### 6. Hoist shared dev tooling to root

In a workspace setup, tools used across all packages (TypeScript, ESLint, Prettier, typescript-eslint) should live in the root `devDependencies`, not duplicated in each sub-package. This enforces a single version everywhere and shrinks install time. Each sub-package only needs its own unique deps (e.g., `vitest`, `sequelize`, `express` in server).

---

### 7. Create `client/package.json`

Before doing any client work, create a minimal `package.json` so it's recognized as a workspace package:

```json
{
  "name": "@smdb/client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@smdb/types": "workspace:*"
  }
}
```

The `tsconfig.json` that's already there (`"jsx": "preserve"`) suggests React or a similar JSX framework, so the client setup can build from that assumption when the time comes.

---

## Suggested implementation order

1. **Enable workspaces** in root `package.json` — unlocks everything else
2. **Add `@smdb/types` build script** and `composite: true` to its tsconfig
3. **Add `@smdb/types` as `workspace:*` dependency** in `server/package.json`
4. **Add Turborepo** and root-level `build`/`test`/`lint` scripts
5. **Switch project references** in tsconfigs; remove the `paths` alias workaround
6. **Consolidate ESLint** to root flat config only
7. **Create `client/package.json`** (even if client stays empty for now)
8. **Upgrade Yarn** (1 → 4) — lowest-risk after everything else is already working

---

## One note on `server/tsconfig.json`

It currently uses `"moduleResolution": "Bundler"` — but `server` runs under `tsx` (for dev) without a bundler. `Bundler` resolution skips some Node.js module resolution checks that can cause subtle import bugs at runtime. For a Node.js server that isn't actually bundled, `"moduleResolution": "nodenext"` is the correct setting (and matches the root config it extends). Worth fixing separately from the monorepo work.
