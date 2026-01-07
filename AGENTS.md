# Repository Guidelines

# IMPORTANT:
# Always follow the rules in prompts/@system-prompt.md before making any decision or writing any code.
# Always read memory-bank/@architecture.md before writing any code.
# Always read memory-bank/@design-document.md before writing any code.
# After adding a major feature or completing a milestone, update memory-bank/@architecture.md.

## Project Structure & Module Organization
- Start by reading `design-document.md`, `UI-design-document.md`, and `tech-stack.md` in the repo root; they lock in product scope, visual system, and stack choices.
- Expected layout: `src/main` (Electron main process, IPC providers for AI + filesystem), `src/preload` (context isolation bridge), `src/renderer` (Vite + React + Router + Zustand pages/components), `src/renderer/styles` (Tailwind config/utilities), `assets/` (fonts/icons/patterns), `tests/` (Vitest specs and fixtures). Keep user data files (`words.jsonl`, `sessions.jsonl`, `activity.json`) in the Electron `app.getPath('userData')` directory—never commit them.
- Group renderer code by feature (e.g., `features/review`, `features/vocab`, `features/settings`) with shared UI in `components/` and shared hooks in `hooks/`.

## Build, Test, and Development Commands
- `npm install` (Node 18+): install dependencies.
- `npm run dev`: start Vite renderer with Electron shell for local development.
- `npm run lint`: run ESLint with the project rules.
- `npm run format`: run Prettier to enforce formatting.
- `npm run test` / `npm run test -- --watch`: run Vitest unit/component suite.
- `npm run build`: Vite build + electron-builder packaging (macOS dmg/zip, Windows nsis/portable).

## Coding Style & Naming Conventions
- TypeScript-first, strict types; prefer React function components + hooks; state via Zustand (avoid Redux-scale complexity).
- 2-space indentation; keep files focused (components <200 lines where possible); tailwind utility classes composed with `clsx`.
- Filenames: components in PascalCase (`CardPreview.tsx`), hooks `use*.ts`, Zustand stores `*.store.ts`, tests `*.test.tsx`, IPC channels/constants in `ipc/*.ts`.
- Keep styles tokenized through Tailwind config variables; reuse fonts/color specs from `UI-design-document.md`.

## Testing Guidelines
- Use Vitest + @testing-library/react for renderer; stub IPC in tests; prefer behavior-first assertions (text/roles).
- Name tests `*.test.ts(x)` alongside source or under `tests/`; add fixtures for SM-2 scheduling and date-fns timezone edges.
- Aim to cover new logic, especially persistence (read/write JSONL) and review flows; include a minimal snapshot/screenshot for complex UI states when practical.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`); keep scope small and focused.
- PRs: include summary, linked issue/task, screenshots for UI changes, and test evidence (commands run + results). Note any deviations from `tech-stack.md` or `UI-design-document.md`.
- Avoid committing generated artifacts, packaged builds, or user data; ensure lint/test/build pass before requesting review.

## Security & Configuration Tips
- Keep API keys (OpenAI, Google) out of the repo; load via environment or OS keychain and pass to the main process only. Guard IPC channels to avoid untrusted renderer input.
- Ensure `.gitignore` excludes `dist/`, `out/`, `*.log`, and the Electron `userData` path contents. Validate third-party font/icon licenses before bundling.
