# Repository Guidelines

# IMPORTANT:
# Always follow the rules in prompts/coding-principles.md before writing any code.
# Always read memory-bank/architecture.md before writing any code. Include entire database schema.
# Always read memory-bank/design-doc.md before writing any code.
# Always emphasize modularity (multiple files) and discourage a monolith (one giant file).
# After adding a major feature or completing a milestone, update memory-bank/architecture.md.
# 禁止使用 monorepo / workspace 配置；仅允许仓库根目录的单一 package.json，所有 node_modules 必须放在仓库根目录。

## Project Structure & Module Organization
Current contents are planning docs at root (`design-doc.md`, `discussion.md`, `tech-stack.md`). When code is present, use a single-package layout (no monorepo/workspaces): keep `src/main/` (Electron main + Fastify API, SM-2 logic, SQLite access), `src/renderer/` (React/Vite UI for Home/Today/Review/Library/Settings), `src/shared/` (Zod schemas/types reused across processes), `data/` (local SQLite such as `data/kotoba.sqlite`, gitignored), `scripts/` for automation, and `docs/` for specs. All dependencies install into the root-level `node_modules`. Place page components under `src/renderer/pages/`, shared UI in `src/renderer/components/`, feature logic in `src/renderer/features/<feature>/`, and tests alongside code in `__tests__` or `*.test.ts[x]`.

## Build, Test, and Development Commands
Use pnpm (single package; root-level node_modules only):
- `pnpm install` — install root dependencies.
- `pnpm dev` — start Electron shell with Fastify API and Vite renderer in watch mode.
- `pnpm lint` / `pnpm format` — ESLint + Prettier checks/fixes.
- `pnpm test` — run Vitest (unit + RTL); add `--runInBand` for deterministic runs.
- `pnpm build` — bundle main + renderer for packaging (electron-builder or vite-plugin-electron).

## Coding Style & Naming Conventions
TypeScript-first, 2-space indent, Prettier defaults. Filenames kebab-case (`review-queue.ts`); React components PascalCase; hooks prefixed `use...`; Zustand stores `useXStore`. Keep schemas/utilities camelCase. Co-locate API schemas in `src/shared` and import on both sides to avoid drift. Prefer functional components, Tailwind + shadcn/ui primitives, and minimal global state beyond API caches and UI overlays.

## Testing Guidelines
Framework: Vitest; UI: React Testing Library. Cover SM-2 math, Fastify handlers, and critical flows (today intake, review navigation/back-one-step, delete with confirm). Name tests `*.test.ts`/`*.test.tsx`; mock time/AI calls for determinism. Target high coverage for scheduling and mutation endpoints; keep fixtures/factories near tests.

## Commit & Pull Request Guidelines
History uses short imperative subjects (“add design doc”, “update discussion”); continue that style, keeping body lines under 72 chars. Group related changes; avoid mixing docs and behavior unless tightly coupled. PRs should include a summary, linked issue, test evidence (`pnpm test`/`pnpm lint`), and screenshots/GIFs for UI changes. Call out DB migrations or new env vars explicitly.

## Security & Configuration Tips
Do not commit secrets. Use `.env.local` for keys (e.g., `OPENAI_API_KEY`, `GEMINI_API_KEY`) and add `.env.example` when introducing new vars. Keep SQLite files under `data/` out of git. Scrub personal vocabulary data before sharing logs or artifacts.
