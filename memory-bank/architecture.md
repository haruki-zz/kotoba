# 架构（更新：plan_03 SM-2 调度核心）

## 项目结构
- 单一 package.json（禁止 workspace/monorepo），所有依赖安装在根级 `node_modules`。
- 目录：
  - `src/main`：Electron 主进程 + Fastify API（后续接入）。新增 `src/main/db` 持久化层。
  - `src/renderer`：Vite + React 渲染层（当前占位页面）。
  - `src/shared`：跨进程复用的类型与 Zod schema（`schemas/`、`constants.ts`）。
  - `data/`：本地 SQLite（默认 `data/kotoba.sqlite`，gitignored）。
  - `scripts/`：自动化脚本（迁移、备份）。
  - `docs/`：设计与规格（新增数据库说明）。
  - `plan/`、`memory-bank/`：规划与记录。

## 工具链与命令
- 包管理：pnpm（packageManager=pnpm@10.28.0）。
- TypeScript 5.4，ESNext module；Vite 5 + React 18。
- 质量：ESLint + Prettier；`pnpm lint` / `pnpm format`。
- 类型检查：`pnpm typecheck`（main + renderer noEmit）。
- 测试：Vitest（默认 jsdom，可在文件上声明 node 环境）。
- 构建：`pnpm build` = typecheck + Vite build。
- 环境变量：`.env.local`（未提交），参考 `.env.example`（OPENAI_API_KEY, GEMINI_API_KEY, DATABASE_PATH, VITE_APP_NAME）。
- 数据库运维：`pnpm db:migrate`（应用迁移），`pnpm db:backup`（复制到 `data/backups/`）。

## 数据库 Schema（SQLite，本地）
- 迁移存放于 `src/main/db/migrations`，记录表 `migrations(id, name, applied_at)`。
- 表：
  - `sources`: `id` PK, `name` UNIQUE, `url`, `note`, `created_at`, `updated_at`
  - `tags`: `id` PK, `name` UNIQUE, `description`, `created_at`, `updated_at`
  - `words`:
    - 核心：`id` PK, `word`, `reading`, `context_expl`, `scene_desc`, `example`
    - 调度：`difficulty` CHECK in (easy/medium/hard), `ef` REAL DEFAULT 2.5 (min 1.3), `interval_days` INTEGER DEFAULT 1, `repetition` INTEGER DEFAULT 0, `last_review_at` TEXT, `next_due_at` TEXT
    - 关联：`source_id` FK→sources NULLABLE
    - 元数据：`created_at`, `updated_at`
  - `word_tags`: `word_id` FK→words ON DELETE CASCADE, `tag_id` FK→tags ON DELETE CASCADE, `created_at`, PRIMARY KEY(word_id, tag_id)
  - `app_meta`: `key` PK, `value`, `updated_at`
- 索引：`idx_words_next_due_at`, `idx_words_difficulty`, `idx_words_lookup(word, reading)`, `idx_word_tags_word`, `idx_word_tags_tag`。

## 里程碑衔接
- plan_02：数据库与模型细化（迁移、Zod schema、数据访问层）——已完成。
- plan_03：SM-2 调度核心（纯函数、配置化、测试覆盖）——已完成，输出 `src/shared/sm2/`。
- 待办：plan_04 Fastify API；plan_05 AI 接入；plan_06 Electron 壳；plan_07 渲染层体验。

## 文件作用说明
- `package.json`：单包定义，脚本 dev/build/test/lint/format/typecheck/db:migrate/db:backup；pnpm onlyBuiltDependencies。
- `pnpm-lock.yaml`：依赖锁（根级 node_modules）。
- `tsconfig.base.json`：通用 TS 选项与路径别名 @shared/@main/@renderer。
- `tsconfig.main.json` / `tsconfig.renderer.json` / `tsconfig.json`：分别针对主进程、渲染层、全局；均 noEmit。
- `.eslintrc.cjs`、`.prettierrc`、`.prettierignore`、`.gitignore`：规范与忽略配置；`.env.example` 提供必需环境变量模板。
- `vite.config.ts`：Vite + React 配置，含别名与 Vitest 设置。
- `vitest.setup.ts`：测试全局占位。
- `index.html`：Vite 入口；`src/renderer/main.tsx` 启动 React；`src/renderer/App.tsx` / `styles.css` 占位 UI。
- `src/main/index.ts`：主进程入口，导出数据库上下文以供后续 API 接线。
- `src/main/db/connection.ts`：SQLite 打开/路径解析，启用 WAL 与外键。
- `src/main/db/migrations/*`：迁移定义与执行器（事务应用并记录）。
- `src/main/db/repositories/*`：`WordRepository`、`TagRepository`、`SourceRepository` 提供 typed CRUD、标签关联、来源 upsert、到期查询。
- `src/main/db/mappers.ts` / `time.ts`：数据库行映射与时间工具。
- `src/shared/constants.ts`：SM-2 默认值与间隔常量。
- `src/shared/schemas/*`：words/tags/sources 的 Zod schema。
- `src/shared/types.ts`：从 schema 导出类型与常量。
- `src/shared/sm2/`：SM-2 调度纯函数、配置与难度评分映射；核心入口 `applySm2Review`（质量分→状态更新）与 `applyDifficultyReview`（难度→质量），支持可选 `maxIntervalDays`、自定义时钟、失败重置、首两次固定间隔、EF 下限。
- `src/shared/__tests__/smoke.test.ts`：基础常量测试。
- `src/shared/__tests__/sm2.test.ts`：覆盖失败重置、早期间隔、EF 驱动增长、最大间隔裁剪、难度→质量映射及时间推进。
- `scripts/run-migrations.ts`：CLI 迁移入口。
- `scripts/backup-db.ts`：备份当前 SQLite 到 `data/backups/`。
- `docs/database-schema.md`：数据库字段/索引与备份流程说明。
- `data/.gitkeep`、`scripts/.gitkeep`、`docs/.gitkeep`：目录占位。
- `README.md`：快速开始与目录约定。
