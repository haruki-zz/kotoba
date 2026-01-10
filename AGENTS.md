# Repository Guidelines

# IMPORTANT:
# Always follow rules in prompts/coding-principles.md before writing any code.
# Always read prompts/system-prompt.md before making any decision or writing any code.
# Always read memory-bank/architecture.md before writing any code.
# Always read memory-bank/design-document.md before writing any code.
# Always emphasize modularity (multiple files) and discourage a monolith (one giant file). 
# After adding a major feature or completing a milestone, update memory-bank/architecture.md.

## Project Structure & Module Organization
- Root docs: `design-document.md`, `tech-stack.md`, `system-prompt.md`; keep new planning docs alongside them.
- Code goes in `src/`: `src/main/` for Electron main/contextBridge APIs, `src/renderer/` for React + TypeScript + Tailwind UI, `src/shared/` for SM-2 logic/types reused by both sides.
- Local JSON state under `data/` (e.g., `words.json`, `activity.json`) with small helpers to read/write atomically.
- Icons/static in `assets/`; CLI/build helpers in `scripts/`. Keep configurations (`tsconfig`, `vite.config`, `electron-builder.yml`) at the root.

## Build, Test, and Development Commands
- Prefer `npm`; add scripts to `package.json` instead of ad-hoc shell.
- `npm install` installs deps; `npm dev` runs Vite and boots Electron with hot reload.
- `npm lint` runs ESLint (with Tailwind plugin) and Prettier checks.
- `npm test` runs Vitest + React Testing Library.
- `npm build` / `npm build:desktop` produces release bundles via electron-builder.

## Coding Style & Naming Conventions
- TypeScript strict, 2-space indent, Prettier defaults; keep functions small and pure where possible.
- Components PascalCase (`WordCard.tsx`), hooks/utilities camelCase (`useSm2Scheduler.ts`, `sm2.ts`), fixtures and JSON names kebab-case.
- Tailwind classes: order layout → spacing → typography → color; prefer shared snippets/constants over repeated long strings.
- Keep SM-2 helpers side-effect free; isolate filesystem/AI calls in boundary modules.

## Testing Guidelines
- Unit-test SM-2 math, JSON I/O guards, and AI prompt builders with table-driven cases.
- UI tests with React Testing Library focus on user flows (card flip, review queue filters); stub filesystem/AI behind interfaces.
- Aim for meaningful coverage on algorithms and persistence; run `npm test` before PRs and add regression cases when fixing bugs.

## Commit & Pull Request Guidelines
- Commits: imperative, concise (<72 chars) and scoped to one change (`Add SM-2 scheduler`, `Fix activity write guard`).
- PRs: summary + linked issue, screenshots for UI changes, and test results/coverage notes; call out data migrations or breaking changes.
- Keep diffs focused; prefer follow-up PRs over mixed concerns. Update this file when workflows or commands change.

## Security & Configuration Tips
- No secrets/API keys in the repo; load them in the main process and expose minimal typed APIs via contextBridge.
- Validate JSON and write via temp files to avoid corrupting `words.json`/`activity.json`; keep renderer sandboxed without direct `fs` access.
- Review Electron dependencies for sandbox safety before adding new packages.
