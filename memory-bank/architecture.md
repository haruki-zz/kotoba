# 架构与工程状态

## 工作区与模块

- 单仓 pnpm workspace，工具链基于 Node 18+ / pnpm 9。
- 包拆分：`packages/main`（Electron 主进程 + Fastify API + SQLite 访问）、`packages/renderer`（React/Vite 渲染层）、`packages/shared`（共享类型与 schema）。辅助目录：`data/`（本地 SQLite，gitignore）、`scripts/`（自动化）、`docs/` 与 `memory-bank/`（设计文档）。
- TypeScript/ESM 统一，`tsconfig.base.json` 作为共享编译基线，包内 `tsconfig.json` 以 composite 方式参与 `tsc -b`，包间依赖通过 project references（main → shared）。

## 质量与脚本

- 质量：ESLint（flat config，@typescript-eslint + React/Hooks + simple-import-sort）、Prettier 默认规则。
- 测试：Vitest（`pnpm test` 运行 `vitest run --passWithNoTests`，后续补充 RTL），`vitest.config.ts` 将 `@kotoba/shared` 映射到源码以便无需预编译；各包 tsconfig 排除测试文件避免打包产出。
- 根级脚本：`pnpm dev`（逐包 dev）、`pnpm build`（逐包 tsc）、`pnpm lint`、`pnpm format` / `format:check`、`pnpm typecheck`。
- simple-git-hooks 安装 pre-commit（lint + format:check + test），`postinstall` 自动写入 git hooks。

## 文件作用说明

- `pnpm-workspace.yaml`：定义 workspace 作用域（`packages/*`、`scripts`），统一安装与脚本调度。
- 根 `package.json`：声明包管理器版本、跨包脚本（dev/build/lint/format/test/typecheck）、postinstall 安装 git hooks、开发依赖版本。
- TypeScript 配置：`tsconfig.base.json` 共享编译基线；根 `tsconfig.json` 维护包引用用于 `tsc -b`；`tsconfig.eslint.json` 为 ESLint 提供 noEmit 项目上下文；各包 `tsconfig.json` 设 composite/rootDir/outDir/tsBuildInfo。
- Lint/Format：`eslint.config.mjs` 采用 flat config，启用 TS/React/Hooks/import-sort，并忽略 dist/data；`.prettierrc`/`.prettierignore` 控制格式；`.gitignore` 排除 node_modules、dist、data、.env\* 等。
- 环境与文档：`.env.example` 给出 OPENAI/GEMINI key 与 DATABASE_PATH 示例；`docs/engineering.md` 汇总目录约定、脚本、命名与钩子；`docs/data-model.md` 说明字段/校验与数据访问；`docs/data-testing-plan.md` 记录校验与存储测试计划；本文件追踪当前架构与 schema。
- ESM 规范：所有相对导入/导出使用显式 `.js` 扩展，目录引用需指向 index 文件，避免 Node ESM 模式下（standalone/dev）出现 ERR_MODULE_NOT_FOUND。
- 测试配置：`vitest.config.ts` 提供 alias（@kotoba/shared → packages/shared/src/index.ts）以在测试时直连源码。
- 共享 Schema 细分：
  - `packages/shared/src/sm2.ts`：SM-2 常量（EF 默认 2.5、下限 1.3，质量映射 easy=5/medium=4/hard=3，默认批量 30，句长/场景长度范围）与 `computeSm2Review` 纯函数（根据 grade/ef/interval/repetition 计算 EF、间隔、重复次数、last/next 时间，保证间隔最小 1 天）。
  - `packages/shared/src/schemas/common.ts`：通用 Zod 基元（ISO 时间、非空字符串、枚举 difficulty、正整数 id）。
  - `packages/shared/src/schemas/word.ts`：wordCore/Create/Update/Record/Query schema 与类型，含默认值与分页过滤。
  - `packages/shared/src/schemas/review.ts`：reviewRequest（wordId、grade、reviewedAt 默认 now）、reviewResult（EF/间隔/重复/next_due_at）schema。
  - `packages/shared/src/schemas/settings.ts`：appSettings（reviewBatchSize、aiProvider、theme、exampleStyle 范围校验与默认）。
  - `packages/shared/src/schemas/ai.ts`：AI 生成词条的请求/响应 schema（word/hint/locale/provider/exampleStyle）。
- 数据层文件：
  - `packages/main/src/db/config.ts`：解析 DATABASE_PATH（默认 data/kotoba.sqlite），确保目录存在。
  - `packages/main/src/db/connection.ts`：创建 better-sqlite3 连接。
  - `packages/main/src/db/migrator.ts`：管理 `_migrations` 表并按序执行迁移。
  - `packages/main/src/db/migrations/0001_init.ts`：创建 words 表及索引。
  - `packages/main/src/db/word-mapper.ts`：SQLite 行与 WordRecord 映射。
  - `packages/main/src/db/word-repository.ts`：词条 CRUD、search/difficulty/dueBefore 过滤、分页与默认排序。
  - `packages/main/src/db/transaction.ts`：通用事务包装。
  - `packages/main/src/db/setup.ts`：initializeDatabase 聚合配置、连接、迁移与仓储实例。
  - `packages/main/src/server/app.ts`：构建 Fastify（Zod type provider、错误处理、限流、安全插件、路由装配）。
  - `packages/main/src/server/routes/*`：健康检查、词条 CRUD、复习队列/提交/撤销、统计摘要、设置读写，统一 `/api/v1` 前缀。
  - `packages/main/src/server/plugins/*`：上下文（数据库 + 复习/统计/设置服务注入）、安全（CORS + Bearer token）、限流、错误格式化。
  - `packages/main/src/server/services/*`：复习服务（按 next_due_at 生成队列并缓存指针、SM-2 计算 EF/间隔/重复/时间、更新 difficulty 为最新 grade、支持幂等提交与一步撤销）、统计汇总（难度分布/到期计数/新增统计/硬词样本）、设置持久化（data/settings.json）。
  - `packages/main/src/server/standalone.ts`：从环境变量读取端口/host/CORS/token，启动 HTTP 模式。
  - `packages/main/src/index.ts`：对外导出 db 模块与 server 构建器。
  - `packages/shared/src/__tests__/sm2.test.ts`、`packages/main/src/server/services/__tests__/review-service.test.ts`：Vitest 覆盖 SM-2 计算、队列生成/幂等提交/撤销回滚。

## 环境与数据

- 环境变量：`.env.example` 提供 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`DATABASE_PATH` 示例，使用时复制为 `.env.local`。`.env*` 与 `data/` 已加入 `.gitignore`。
- API 环境：`API_MODE`（默认 http 用于 standalone）、`API_HOST`/`API_PORT`、`API_CORS_ORIGINS`、`API_AUTH_TOKEN`（默认 dev-token，http 模式需 Bearer）。`pnpm --filter @kotoba/main dev` 先编译再启动。
- 数据库路径：默认 `data/kotoba.sqlite`，可通过 `DATABASE_PATH` 覆盖；初始化使用 `initializeDatabase()` 连接并执行迁移。设置持久化文件默认 `data/settings.json`。

## 数据库 Schema（SQLite）

- `words` 表（间隔重复核心）：
  - `id` INTEGER PRIMARY KEY
  - `word` TEXT NOT NULL
  - `reading` TEXT
  - `context_expl` TEXT
  - `scene_desc` TEXT
  - `example` TEXT
  - `difficulty` TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard'))
  - `ef` REAL NOT NULL DEFAULT 2.5 CHECK (ef >= 1.3)
  - `interval_days` INTEGER NOT NULL DEFAULT 0
  - `repetition` INTEGER NOT NULL DEFAULT 0
  - `last_review_at` TEXT -- ISO 时间
  - `next_due_at` TEXT -- ISO 时间
  - `created_at` TEXT NOT NULL
  - `updated_at` TEXT NOT NULL
- 索引：`idx_words_next_due_at`（复习调度）、`idx_words_difficulty`（筛选）。
- 后续扩展字段（未入库）：`source`、`tags`、`pos` 等待需求明确后迁移。
