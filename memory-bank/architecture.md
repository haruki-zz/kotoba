## Workspace layout (January 28, 2026)

- Root managed by pnpm workspace (`pnpm-workspace.yaml`) with packages:
  - `packages/main`: Fastify-ready Electron main/API starter (ESM, TS). Exposes `/health` and `/sample-word` using shared schemas.
  - `packages/renderer`: Vite + React (TS) UI scaffold with navigation stub and hero/panel sections.
  - `packages/shared`: Zod schemas/types for word data (difficulty enum, SM-2 fields).
  - `scripts/`: placeholder for automation.
  - `data/`: holds local SQLite files (`data/kotoba.sqlite` expected), gitignored via `.gitkeep`.

## Tooling & commands

- Node >= 20; packageManager set to `pnpm@10.28.0`; workspace scripts use `--if-present`:
  - `pnpm dev` → parallel dev in packages.
  - `pnpm build` → `tsc -b` for main/shared, `vite build` for renderer.
  - `pnpm lint` → ESLint (React rules scoped to renderer).
  - `pnpm format` → Prettier check.
  - `pnpm test` → Vitest (passWithNoTests).
  - `pnpm typecheck` → `tsc --noEmit` per package.
- Base TS config: `tsconfig.base.json` (ES2020, ESNext modules, strict, JSX react-jsx).
- ESLint config: `.eslintrc.cjs` with renderer-only React/JSX rules to avoid non-React noise.
- Prettier: `.prettierrc` (singleQuote, semi, trailingComma es5).

## Env & configuration

- `.env.example` (tracked) documents keys: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DATABASE_URL=sqlite:data/kotoba.sqlite`, `API_PORT`, `VITE_API_BASE_URL`.
- `.env.local` is gitignored and loaded first in `packages/main/src/index.ts` (override=true) before `.env`.
- pnpm workspace allows build scripts for `esbuild` via `onlyBuiltDependencies` to satisfy Vite/tsx tooling.

## CI/CD

- `.github/workflows/ci.yml`: checkout → setup-node@20 with pnpm cache → corepack enable → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test` → `pnpm build`.

## Data/storage

- No database schema defined yet. SQLite files will live under `data/kotoba.sqlite`; schema to be added in later plans (plan_02).

## Notes for future steps

- SM-2 logic currently represented only in shared Zod schema; scheduling engine/API/data layer remain TODO (plan_02+).
- Renderer uses placeholder content; hook up Fastify API and shared schemas when endpoints exist.

## File roles (current footprint)

- Root configs:  
  - `package.json` — workspace scripts (dev/build/lint/format/test/typecheck) and shared devDeps.  
  - `pnpm-workspace.yaml` — declares packages/sctipts and `onlyBuiltDependencies: [esbuild]` for Vite/tsx.  
  - `tsconfig.base.json` — strict TS baseline for all packages.  
  - `.eslintrc.cjs` — base lint rules; React/JSX rules scoped to renderer via overrides.  
  - `.prettierrc` — formatting defaults (singleQuote, semi, trailingComma es5).  
  - `.gitignore` — ignores node_modules, build artifacts, env locals, data/; keeps `.env.example`.
- Env: `.env.example` documents required vars; `.env.local` (not tracked) loaded first by main server.
- CI: `.github/workflows/ci.yml` runs lint → test → build on Node 20 with pnpm cache.
- Packages:
  - `packages/shared/src/index.ts` — Zod schema/type for word + SM-2 metadata.  
  - `packages/main/src/index.ts` — Fastify bootstrap, env loading, `/health` + `/sample-word` sample using shared schema.  
  - `packages/renderer/src/*` — Vite entry (`main.tsx`), placeholder App UI, styling (`App.css`, `index.css`), Vite env types and config.  
  - Each package has `package.json`, `tsconfig.json`, and build output under `dist/` (from initial build; safe to clean/regenerate).
- Data: `data/.gitkeep` keeps git-empty directory ready for SQLite (`data/kotoba.sqlite`).
- Scripts: `scripts/README.md` placeholder for automation to be added later.
