# Repository Guidelines

# IMPORTANT:
# Always emphasize modularity (multiple files) and discourage a monolith (one giant file).
# Always read memory-bank/architecture.md before writing any code. Include entire database schema.
# Always read memory-bank/design-doc.md before writing any code.
# After adding a major feature or completing a milestone, update memory-bank/architecture.md.

## Project Structure & Module Organization
The repo currently holds planning docs (`design-doc.md`, `tech-stack.md`, `discussion.md`) at the root. When scaffolding the app (Electron + Fastify + React), align to this layout: `packages/main/` (Electron main + Fastify API with SM-2 logic and SQLite access), `packages/renderer/` (React/Vite UI for Home/Today/Review/Library/Settings), `packages/shared/` (Zod schemas/types reused across processes), `data/` (local SQLite such as `kotoba.sqlite`, gitignored), and `scripts/`/`docs/` for automation and specs. Keep page-level components in `pages/`, reusable UI in `components/`, and feature logic in `features/<feature>/`.

## Build, Test, and Development Commands
Use pnpm once the workspace is initialized:
- `pnpm install` — install workspace deps.
- `pnpm dev` — run Fastify + Electron with renderer hot reload.
- `pnpm lint` / `pnpm format` — ESLint + Prettier.
- `pnpm test` — Vitest unit/RT tests; `pnpm test -- --runInBand` for deterministic runs.
- `pnpm build` — bundle via Vite/electron-builder before release.
Document any new script in `package.json` and keep parity between main/renderer packages.

## Coding Style & Naming Conventions
TypeScript-first with 2-space indent and Prettier defaults. Filenames use lowercase-kebab (e.g., `review-queue.ts`); React components are PascalCase; hooks are prefixed `use...`; schema/util modules stay camelCase. Favor functional components, TanStack Query for data fetching/caching, and React Hook Form + Zod for forms. Keep API schemas in shared Zod files and import them on both sides to avoid drift.

## Testing Guidelines
Vitest covers logic (SM-2 scheduling, stats aggregation, Fastify handlers). React Testing Library exercises critical UI flows (today-learning intake, review queue navigation, back-one-step behavior). Aim for >80% coverage on SM-2 math and any data-mutation endpoints. Add fixtures/factories near tests; name files `*.test.ts[x]`. Keep tests deterministic (mock time and AI providers).

## Commit & Pull Request Guidelines
Write short imperative commit subjects (history uses “Add …”, “Update …”); keep body lines <72 chars. Group changes logically; avoid mixing docs and behavior in one commit unless atomic. PRs should include: summary of changes, linked issue, test evidence (`pnpm test`/lint output), and UI screenshots/GIFs for visible updates. Call out DB migrations or new env vars explicitly.

## Security & Configuration Tips
Never commit API keys; load providers via `.env.local` (e.g., `OPENAI_API_KEY`, `GEMINI_API_KEY`). Ignore SQLite files under `data/`. Before sharing logs, scrub personal vocabulary data. Use sample configs (`.env.example`) when adding new settings.
