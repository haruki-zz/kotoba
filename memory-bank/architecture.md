# 架构（更新：plan_05 AI 辅助功能与提示工程）

## 项目结构
- 单一 package.json（禁止 workspace/monorepo），所有依赖安装在根级 `node_modules`。
- 目录：
  - `src/main`：Electron 主进程 + Fastify API（已接入）。`src/main/db` 持久化层；`src/main/api` Fastify 服务器与路由；`src/main/services` 业务封装；`src/main/ai` provider 抽象、限流/重试与客户端适配。
  - `src/renderer`：Vite + React 渲染层（当前占位页面）。
  - `src/shared`：跨进程复用的类型与 Zod schema（`schemas/`、`constants.ts`，新增 `schemas/api` 描述 API 请求/响应）；`src/shared/ai` 提示模板、场景定义、provider 枚举。
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
- Fastify 本地 API：`pnpm dev:api`（默认监听 127.0.0.1:8787，用于无界面验收）。
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
  - `ai_requests`: `id` PK, `trace_id`, `scenario`, `provider`, `word_id` FK→words NULLABLE, `input_json`, `output_json`, `status` CHECK in (success/error), `error_message`, `latency_ms`, `created_at`, `updated_at`
  - `app_meta`: `key` PK, `value`, `updated_at`
- 索引：`idx_words_next_due_at`, `idx_words_difficulty`, `idx_words_lookup(word, reading)`, `idx_word_tags_word`, `idx_word_tags_tag`，`idx_ai_requests_word`，`idx_ai_requests_created_at`，`idx_ai_requests_trace`。

## 里程碑衔接
- plan_02：数据库与模型细化（迁移、Zod schema、数据访问层）——已完成。
- plan_03：SM-2 调度核心（纯函数、配置化、测试覆盖）——已完成，输出 `src/shared/sm2/`。
- plan_04：Fastify API 与数据访问封装——已完成，本地 API 路由、校验、服务层与端到端测试可用。
- plan_05：AI provider 抽象（ChatGPT/Gemini/Mock）、提示模板、限流/重试、调用日志表 `ai_requests`、AI 生成 API 与 renderer playground —— 已完成。
- 待办：plan_06 Electron 壳；plan_07 渲染层体验。

## 文件作用说明
- `package.json`：单包定义，脚本 dev/build/test/lint/format/typecheck/db:migrate/db:backup；pnpm onlyBuiltDependencies。
- `pnpm-lock.yaml`：依赖锁（根级 node_modules）。
- `tsconfig.base.json`：通用 TS 选项与路径别名 @shared/@main/@renderer。
- `tsconfig.main.json` / `tsconfig.renderer.json` / `tsconfig.json`：分别针对主进程、渲染层、全局；均 noEmit。
- `.eslintrc.cjs`、`.prettierrc`、`.prettierignore`、`.gitignore`：规范与忽略配置；`.env.example` 提供必需环境变量模板。
- `vite.config.ts`：Vite + React 配置，含别名与 Vitest 设置。
- `vitest.setup.ts`：测试全局占位。
- `index.html`：Vite 入口；`src/renderer/main.tsx` 启动 React；`src/renderer/App.tsx` / `styles.css` UI。
- `src/renderer/components/AiPlayground.tsx`：AI 交互沙盘（触发调用、加载/错误提示、手动编辑回退）。
- `src/main/index.ts`：主进程入口，直接运行时启动 Fastify API（默认 127.0.0.1:8787）；导出数据库上下文与 `startServer`。
- `src/main/api/server.ts`：Fastify 构建与错误处理，挂载健康、词条、标签、来源、统计、AI 路由，启用 CORS。
- `src/main/api/context.ts`：数据库上下文组装业务服务与 provider registry，统一 close。
- `src/main/api/routes/*`：`health`/`words`/`tags`/`sources`/`stats`/`ai` 路由，词条路由覆盖 CRUD、review、bulk 导入、复习队列。
- `src/main/api/__tests__/api.test.ts`：Fastify 端到端测试（创建/查询、SM-2 评分、队列、统计）。
- `src/main/api/__tests__/ai.test.ts`：AI 路由端到端测试（成功 + provider 配置错误日志）。
- `src/main/services/*`：`WordService`（SM-2 应用、搜索、统计、批量导入）、`TagService`、`SourceService`、`AiService`（提示渲染、调用、解析、持久化、日志）。
- `src/main/ai/*`：provider 注册、限流（并发）、重试、超时包装，OpenAI/Gemini/Mock 客户端适配。
- `src/main/db/connection.ts`：SQLite 打开/路径解析，启用 WAL 与外键。
- `src/main/db/migrations/*`：迁移定义与执行器（事务应用并记录）。
- `src/main/db/repositories/*`：`WordRepository`、`TagRepository`、`SourceRepository`、`AiRequestRepository`（记录调用输入/输出、provider、耗时、错误）。
- `src/main/db/mappers.ts` / `time.ts`：数据库行映射与时间工具。
- `src/shared/constants.ts`：SM-2 默认值与间隔常量。
- `src/shared/schemas/*`：words/tags/sources 的 Zod schema，`schemas/api` 描述 API 请求/响应、分页、复习队列、批量导入、统计、AI 生成；其中 `api/common.ts` 提供分页/ISO 时间共享校验，`api/word.ts` 定义词条 CRUD/搜索/复习/批量导入/队列契约，`api/stats.ts` 定义统计概览结构，`api/ai.ts` 定义 AI 调用请求/响应。
- `src/shared/types.ts`：从 schema 导出类型与常量，新增 WordView/WordListQuery/StatsOverview/AiGenerateRequest 等。
- `src/shared/sm2/`：SM-2 调度纯函数、配置与难度评分映射；核心入口 `applySm2Review`（质量分→状态更新）与 `applyDifficultyReview`（难度→质量），支持可选 `maxIntervalDays`、自定义时钟、失败重置、首两次固定间隔、EF 下限。
- `src/shared/__tests__/smoke.test.ts`：基础常量测试。
- `src/shared/__tests__/sm2.test.ts`：覆盖失败重置、早期间隔、EF 驱动增长、最大间隔裁剪、难度→质量映射及时间推进。
- `scripts/run-migrations.ts`：CLI 迁移入口。
- `scripts/backup-db.ts`：备份当前 SQLite 到 `data/backups/`。
- `docs/database-schema.md`：数据库字段/索引与备份流程说明。
- `data/.gitkeep`、`scripts/.gitkeep`、`docs/.gitkeep`：目录占位。
- `README.md`：快速开始与目录约定。
