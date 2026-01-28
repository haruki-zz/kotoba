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
