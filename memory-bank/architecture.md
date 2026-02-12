# 架构（更新：plan_09 设置与偏好）

## 项目结构
- 单一 package.json（禁止 workspace/monorepo），所有依赖安装在根级 `node_modules`。
- 目录：
  - `src/main`：Electron 主进程 + Fastify API（已接入）。`src/main/db` 持久化层；`src/main/api` Fastify 服务器与路由；`src/main/services` 业务封装；`src/main/ai` provider 抽象、限流/重试与客户端适配。
  - `src/renderer`：Vite + React 渲染层。
    - 路由：`/` Home 概览（统计 + 队列预览 + AI Playground），`/today` 列表（搜索/难度过滤/分页），`/review` SM-2 复习流程（快捷键可配置、展开/回退、进度条与空/错误态），`/library` 词库管理（筛选、详情编辑、标签管理、软删除恢复、批量操作、导入导出），`/settings` 设置页（主题/语言/队列/快捷键/隐私/备份恢复）。
    - 状态与数据：`@tanstack/react-query` 负责 API 缓存与加载态；`zustand` 负责复习会话态与设置快照（缓存 + 主题应用）。
    - UI 结构：`AppLayout` 顶部导航 + HashRouter；页面在 `pages/`，可复用部件在 `components/`，领域调用在 `api/`，Library 与 Settings 各自拆分到 `features/library/`、`features/settings/`。
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
    - 元数据：`deleted_at`（软删除标记，NULL 表示有效）、`created_at`, `updated_at`
  - `word_tags`: `word_id` FK→words ON DELETE CASCADE, `tag_id` FK→tags ON DELETE CASCADE, `created_at`, PRIMARY KEY(word_id, tag_id)
  - `ai_requests`: `id` PK, `trace_id`, `scenario`, `provider`, `word_id` FK→words NULLABLE, `input_json`, `output_json`, `status` CHECK in (success/error), `error_message`, `latency_ms`, `created_at`, `updated_at`
  - `app_meta`: `key` PK, `value`, `updated_at`（用于 settings user patch、最近备份路径等元信息）
- 索引：`idx_words_next_due_at`, `idx_words_difficulty`, `idx_words_lookup(word, reading)`, `idx_words_deleted_at`, `idx_word_tags_word`, `idx_word_tags_tag`，`idx_ai_requests_word`，`idx_ai_requests_created_at`，`idx_ai_requests_trace`。

## 里程碑衔接
- plan_02：数据库与模型细化（迁移、Zod schema、数据访问层）——已完成。
- plan_03：SM-2 调度核心（纯函数、配置化、测试覆盖）——已完成，输出 `src/shared/sm2/`。
- plan_04：Fastify API 与数据访问封装——已完成，本地 API 路由、校验、服务层与端到端测试可用。
- plan_05：AI provider 抽象（ChatGPT/Gemini/Mock）、提示模板、限流/重试、调用日志表 `ai_requests`、AI 生成 API 与 renderer playground —— 已完成。
- plan_07：渲染层体验（Home/Today/Review 路由、队列复习交互、空/错/加载态、快捷键）—— 已完成。
- plan_08：Library 与内容管理（软删除恢复、标签 CRUD、批量操作、导入校验与导出、Library 页面）—— 已完成。
- plan_09：设置与偏好（设置分层、持久化、Settings 页面、快捷键冲突提示、隐私开关确认、设置导入导出与数据库备份入口）—— 已完成。
- 待办：plan_06 Electron 壳。

## plan_08 架构洞察
- 软删除优先于硬删除：业务默认执行软删除（`deleted_at` 置值），恢复与审计更可控；硬删除只保留在显式确认场景，避免误删不可逆。
- 查询一致性优先：搜索、统计、复习队列对“已删除词条”采用统一过滤语义，避免页面数据与统计口径不一致。
- 批量操作采用单入口：通过 `wordBatchRequestSchema` 的 `action` 判别统一扩展，减少 API 面数量并维持前后端契约集中管理。
- 导入采用三段式：前端解析 -> 后端校验 -> 最终写入，降低批量导入对数据库一致性的冲击。
- Library 页面只做编排：将筛选栏、列表、批量动作、编辑弹层、导入导出拆分为独立模块，降低单文件复杂度并便于独立测试。

## plan_09 架构洞察
- 设置采用三层合并：`defaultAppSettings` -> `app_meta` 用户 patch -> 环境变量 runtime override，确保新增配置项可平滑回退默认值。
- 设置与 API 契约统一：`src/shared/schemas/settings.ts` + `src/shared/schemas/api/settings.ts` 作为单一真源，前后端共享校验和类型。
- 隐私开关默认安全：`telemetryEnabled=false`，对 `allowNetwork/telemetry/aiRequestLogging` 变更要求显式确认；并在 AI 路由侧强制执行网络开关。
- 快捷键冲突“可保存但可见”：后端返回 `shortcutConflicts` 元数据，前端实时提示冲突，避免强阻断带来的配置死锁。
- 备份采用双入口：设置 JSON 导入导出（可校验 checksum）+ SQLite 备份（`better-sqlite3 backup`），覆盖偏好与本地数据两类恢复场景。

## plan_09 新增文件职责（逐文件）
- `src/shared/schemas/settings.ts`：设置域单一真源；定义默认值、patch 规则、快捷键规范化/冲突检测、备份文件校验模型。
- `src/shared/schemas/api/settings.ts`：设置 API 契约层；定义 snapshot/update/reset/import/export/backup 的请求响应结构，供前后端共用。
- `src/main/db/repositories/app-meta-repository.ts`：`app_meta` key-value 的最小仓储封装；统一 get/set/delete 与更新时间写入。
- `src/main/services/settings-service.ts`：设置核心编排；负责读取用户 patch、三层合并、保存、重置、checksum 导入导出、SQLite 备份与元信息返回。
- `src/main/api/routes/settings.ts`：设置 HTTP 入口；校验请求体、处理敏感变更确认、把领域错误转换为 400 语义错误。
- `src/renderer/api/settings.ts`：设置请求客户端；将页面交互映射为 `/api/settings` 系列调用，屏蔽 URL 与 method 细节。
- `src/renderer/stores/settings-store.ts`：设置快照状态容器；缓存 snapshot、应用主题到 `data-theme`、提供全局读取接口。
- `src/renderer/features/settings/shortcut-utils.ts`：快捷键工具层；负责 binding 匹配、展示格式化，供 Review 与 Settings 页复用。
- `src/renderer/features/settings/settings-form.ts`：设置表单工具层；负责 diff patch 生成、敏感项检测、JSON 导入导出辅助。
- `src/renderer/pages/SettingsPage.tsx`：设置页编排层；组织查询/更新 mutation、冲突提示、隐私确认、导入导出与数据库备份入口。
- `src/renderer/pages/__tests__/settings.test.tsx`：设置页回归测试；覆盖“加载 -> 修改 -> 提交 patch”主路径，防止回归为全量覆盖提交。

## 文件作用说明
- `package.json`：单包定义，脚本 dev/build/test/lint/format/typecheck/db:migrate/db:backup；pnpm onlyBuiltDependencies。
- `pnpm-lock.yaml`：依赖锁（根级 node_modules）。
- `tsconfig.base.json`：通用 TS 选项与路径别名 @shared/@main/@renderer。
- `tsconfig.main.json` / `tsconfig.renderer.json` / `tsconfig.json`：分别针对主进程、渲染层、全局；均 noEmit。
- `.eslintrc.cjs`、`.prettierrc`、`.prettierignore`、`.gitignore`：规范与忽略配置；`.env.example` 提供必需环境变量模板。
- `vite.config.ts`：Vite + React 配置，含别名与 Vitest 设置。
- `vitest.setup.ts`：Vitest 全局初始化（注入 `@testing-library/jest-dom` 匹配器）。
- `index.html`：Vite 页面入口。
- `src/renderer/main.tsx`：渲染层启动器，挂载 `QueryClientProvider` 与 `HashRouter`。
- `src/renderer/App.tsx`：路由表与顶层布局装配（Home/Today/Review/Library/Settings + fallback）。
- `src/renderer/styles.css`：渲染层全局样式、页面布局、状态样式、设置页样式与主题变量（light/dark）。
- `src/renderer/api/client.ts`：统一 HTTP 客户端与错误模型（`ApiError`），收敛 `fetch` 基础配置。
- `src/renderer/api/stats.ts`：统计接口封装（`/api/stats/overview`）。
- `src/renderer/api/review.ts`：复习接口封装（队列拉取、提交评分、回退恢复）。
- `src/renderer/api/words.ts`：词条查询与内容管理接口封装（分页过滤、更新、软/硬删除、恢复、批量操作、导入校验、导出）。
- `src/renderer/api/tags.ts`：标签接口封装（查询、新建、重命名、删除）。
- `src/renderer/api/settings.ts`：设置接口封装（读取、更新、重置、导入导出、数据库备份）。
- `src/renderer/hooks/useKeyboardShortcuts.ts`：复习快捷键处理（可配置绑定 + 评分/跳过/展开/回退）并屏蔽输入控件聚焦场景。
- `src/renderer/stores/review-store.ts`：Review 会话状态（当前队列、初始总量、历史栈、回退辅助方法）。
- `src/renderer/stores/settings-store.ts`：设置快照缓存（local cache）、主题应用与全局读取。
- `src/renderer/components/AppLayout.tsx`：统一导航壳层与页头提示，启动时同步设置并应用主题。
- `src/renderer/components/StatTiles.tsx`：统计卡与难度分布可视化。
- `src/renderer/components/ReviewCard.tsx`：复习卡片展示（词面、详情区、进度）。
- `src/renderer/components/WordListItem.tsx`：Today/Home 列表项渲染。
- `src/renderer/components/Skeleton.tsx`：加载骨架占位。
- `src/renderer/components/AiPlayground.tsx`：AI 交互沙盘（默认 provider 跟随设置，网络关闭时限制为 mock）。
- `src/renderer/pages/HomePage.tsx`：首页概览，聚合 stats、队列预览与 AI Playground。
- `src/renderer/pages/TodayPage.tsx`：今日词条列表页面，包含筛选、分页、重试状态。
- `src/renderer/pages/ReviewPage.tsx`：SM-2 复习流程页面，队列数量与快捷键读取设置，处理评分提交、跳过、回退与进度反馈。
- `src/renderer/pages/LibraryPage.tsx`：词库页面，处理筛选查询、批量操作、导入导出、标签管理与详情编辑弹层。
- `src/renderer/pages/SettingsPage.tsx`：设置页，提供主题/语言/队列/快捷键/隐私/导入导出/备份操作与冲突提示。
- `src/renderer/features/settings/shortcut-utils.ts`：快捷键解析、匹配与展示格式化。
- `src/renderer/features/settings/settings-form.ts`：设置表单差异 patch、敏感项判断、导入导出辅助。
- `src/renderer/features/library/library-filters.tsx`：Library 筛选栏（关键词、难度、标签、时间、删除态）与筛选参数输入层。
- `src/renderer/features/library/library-list.tsx`：词条表格与选中态视图（行选择、全选、行级操作按钮）。
- `src/renderer/features/library/library-batch-actions.tsx`：批量动作面板（批量难度、批量删除/恢复、批量标签增删）。
- `src/renderer/features/library/library-editor.tsx`：词条详情编辑弹层 + 标签管理 UI（创建、重命名、删除）。
- `src/renderer/features/library/library-import-export.tsx`：导入导出操作面板（文件选择、导出触发、反馈信息）。
- `src/renderer/features/library/import-export.ts`：导入导出纯工具（JSON 解析、字段规范化、下载导出文件）。
- `src/renderer/test-utils.tsx`：渲染层测试工具，统一挂载 Router + React Query Provider。
- `src/renderer/pages/__tests__/review.test.tsx`：复习页空队列状态测试。
- `src/renderer/pages/__tests__/today.test.tsx`：Today 查询流程测试（参数构造与列表渲染）。
- `src/renderer/pages/__tests__/library.test.tsx`：Library 列表与批量操作触发测试。
- `src/renderer/pages/__tests__/settings.test.tsx`：Settings 读取与更新 patch 提交测试。
- `src/main/index.ts`：主进程入口，直接运行时启动 Fastify API（默认 127.0.0.1:8787）；导出数据库上下文与 `startServer`。
- `src/main/api/server.ts`：Fastify 构建与错误处理，挂载健康、词条、标签、来源、统计、AI、设置路由，启用 CORS。
- `src/main/api/context.ts`：数据库上下文组装业务服务与 provider registry，统一 close。
- `src/main/api/routes/*`：`health`/`words`/`tags`/`sources`/`stats`/`ai`/`settings` 路由；settings 路由覆盖读取/更新/重置/导入导出/备份；AI 路由读取隐私设置强制网络开关。
- `src/main/api/__tests__/api.test.ts`：Fastify 端到端测试（创建/查询、SM-2 评分、软删除恢复、批量与导入导出、统计、settings 流程）。
- `src/main/api/__tests__/ai.test.ts`：AI 路由端到端测试（成功、provider 配置错误日志、隐私网络开关拦截）。
- `src/main/services/*`：`WordService`（SM-2 应用、搜索、统计、软删除恢复、批量操作、导入校验、导出）、`TagService`（增删改查）、`SourceService`、`AiService`（提示渲染、调用、解析、持久化、日志）、`SettingsService`（配置分层、持久化、checksum 导入导出、数据库备份）。
- `src/main/ai/*`：provider 注册、限流（并发）、重试、超时包装，OpenAI/Gemini/Mock 客户端适配。
- `src/main/db/connection.ts`：SQLite 打开/路径解析，启用 WAL 与外键。
- `src/main/db/migrations/*`：迁移定义与执行器（事务应用并记录，`003_soft_delete_words` 新增 `words.deleted_at`）。
- `src/main/db/migrations/003_soft_delete_words.ts`：plan_08 专用迁移，增加 `words.deleted_at` 字段与 `idx_words_deleted_at` 索引。
- `src/main/db/repositories/*`：`WordRepository`、`TagRepository`、`SourceRepository`、`AiRequestRepository`（记录调用输入/输出、provider、耗时、错误）、`AppMetaRepository`（应用元数据 key-value）。
- `src/main/db/mappers.ts` / `time.ts`：数据库行映射与时间工具。
- `src/shared/constants.ts`：SM-2 默认值与间隔常量。
- `src/shared/schemas/*`：words/tags/sources/settings 的 Zod schema，`schemas/api` 描述 API 请求/响应、分页、复习队列、批量导入、批量操作、导入校验、导出、统计、AI 生成、设置；其中 `api/common.ts` 提供分页/ISO 时间共享校验，`api/word.ts` 定义词条 CRUD/搜索/软删除恢复/复习/批量/导入导出契约，`api/stats.ts` 定义统计概览结构，`api/ai.ts` 定义 AI 调用请求/响应，`api/settings.ts` 定义设置契约。
- `src/shared/types.ts`：从 schema 导出类型与常量，覆盖 WordView/WordListQuery/WordBatchRequest/WordExportResponse/StatsOverview/AiGenerateRequest/AppSettings/SettingsSnapshot 等。
- `src/shared/sm2/`：SM-2 调度纯函数、配置与难度评分映射；核心入口 `applySm2Review`（质量分→状态更新）与 `applyDifficultyReview`（难度→质量），支持可选 `maxIntervalDays`、自定义时钟、失败重置、首两次固定间隔、EF 下限。
- `src/shared/__tests__/smoke.test.ts`：基础常量测试。
- `src/shared/__tests__/sm2.test.ts`：覆盖失败重置、早期间隔、EF 驱动增长、最大间隔裁剪、难度→质量映射及时间推进。
- `scripts/run-migrations.ts`：CLI 迁移入口。
- `scripts/backup-db.ts`：备份当前 SQLite 到 `data/backups/`。
- `docs/database-schema.md`：数据库字段/索引与备份流程说明。
- `data/.gitkeep`、`scripts/.gitkeep`、`docs/.gitkeep`：目录占位。
- `README.md`：快速开始与目录约定。
