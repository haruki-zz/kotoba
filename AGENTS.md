# Repository Guidelines

# Always follow rules in ./prompts/coding-principles before writing any code.
# Always read all documents under ./memory-bank before writing any code.

## Project Structure & Module Organization
This repository is currently documentation-first.
- `design-doc.md`: product requirements, behavior rules, and acceptance criteria.
- `tech-stack.md`: implementation stack and default runtime/config values.
- `plan/` (when used): incremental execution notes, named like `plan_09_设置与偏好.md`.

Keep source-of-truth decisions in `design-doc.md` first, then mirror implementation defaults in `tech-stack.md`. Avoid creating duplicate requirement files.

## Build, Test, and Development Commands
There is no runnable app scaffold in the current snapshot, so day-to-day work is doc validation and consistency checks.
- `rg --files` — list tracked files quickly.
- `rg -n "gemini|timeout|retry|schema_version" design-doc.md tech-stack.md` — verify key defaults match.
- `git diff -- design-doc.md tech-stack.md` — review cross-doc changes before commit.
- `pnpm dlx markdownlint-cli2 "**/*.md"` — optional Markdown lint pass.

## Coding Style & Naming Conventions
- Write concise Markdown with clear ATX headings (`##`).
- Prefer short bullets over long paragraphs.
- Use backticks for field names and config values (for example, `schema_version`, `gemini-2.5-flash`).
- File naming:
  - Root docs: kebab-case (for example, `design-doc.md`).
  - Plan docs: `plan_XX_<topic>.md` for ordered execution history.

## Testing Guidelines
Testing currently means consistency testing for docs:
- No conflicting defaults between `design-doc.md` and `tech-stack.md`.
- Version/date updates are applied when behavior changes.
- Examples and constraints remain actionable (timeouts, retries, migration rules, limits).

If code is added later, place tests next to modules or under a top-level `tests/` directory and document commands here.

## Commit & Pull Request Guidelines
Observed history favors short imperative subjects (for example, `Add tech stack doc`, `Aligned docs`, `implement plan_09 ...`).
- Use one logical change per commit.
- Commit subject pattern: `<Verb> <scope>` (for example, `Align doc defaults`).
- PRs should include: purpose, files changed, exact defaults updated, and any follow-up tasks.

## Security & Configuration Tips
- `.env.local` is local-only; never commit real API keys.
- Do not paste credentials into docs, commit messages, or screenshots.
