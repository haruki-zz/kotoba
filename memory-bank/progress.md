## 2026-02-03

- 完成 plan_01：建立单包结构（禁止 workspace），搭建 Vite + React 占位渲染层与 main/shared 占位代码，配置 tsconfig / ESLint / Prettier / Vite / Vitest，提供 `.env.example`、`.gitignore`，并通过 `pnpm lint`、`pnpm test`、`pnpm build`。
- 完成 plan_02：落地本地 SQLite 数据层。
  - 新增 Zod schema 与类型（words/tags/sources），抽出 SM-2 默认常量。
  - 实现迁移体系与核心表（words/tags/sources/word_tags/app_meta），索引与外键约束开启 WAL。
  - 提供仓储层（Word/Tag/Source）含标签映射、来源 upsert、到期查询；导出 `createDbContext`。
  - CLI 脚本：`pnpm db:migrate` 迁移、`pnpm db:backup` 备份到 `data/backups/`。
  - 文档与架构更新：`docs/database-schema.md`、`memory-bank/architecture.md` 补充文件作用与 schema。
  - 新增数据库相关测试并通过 `pnpm test`，`pnpm typecheck` 亦通过。
- 完成 plan_03：SM-2 调度核心。
  - 在 `src/shared/sm2/` 实现纯函数调度核心（评分映射、EF 更新、间隔计算、日期推进）与可配置参数（最小/默认 EF、首两次间隔、失败间隔、可选最大间隔、自定义时钟）。
  - 提供基于 difficulty 的便捷入口 `applyDifficultyReview` 和质量分 `applySm2Review`，输出可直接写回数据库字段（ef/interval_days/repetition/last_review_at/next_due_at）。
  - 新增单元测试 `src/shared/__tests__/sm2.test.ts` 覆盖失败重置、早期间隔、EF 驱动增长、最大间隔裁剪、难度映射，全部通过 `pnpm test`。
  - 更新 `memory-bank/architecture.md` 标注 plan_03 完成并补充文件作用说明。
- 完成 plan_04：Fastify API 与服务层。
  - 落地 `src/main/api` Fastify 服务器、健康/词条/标签/来源/统计路由，词条路由含 CRUD、SM-2 评分、复习队列、批量导入。
  - 新增 `src/main/services/*` 业务封装，复用 shared schema，新增 `src/shared/schemas/api/*` 和类型导出。
  - 新脚本 `pnpm dev:api` 启动本地 API；端到端测试 `src/main/api/__tests__/api.test.ts` 通过 `pnpm test`。
- Lint 修复：解决 Fastify server 默认导入命名与 API schema 导入顺序问题，`pnpm lint` 重新通过。

## 2026-02-05

- 完成 plan_05：AI 辅助功能与提示工程。
  - 新增 shared AI 场景定义、提示模板（wordEnrich/exampleOnly）与 provider 枚举。
  - 构建 provider 抽象（OpenAI/Gemini/Mock）、并发限流、超时与重试包装。
  - 数据库新增 `ai_requests` 表与仓储，记录调用输入/输出、耗时、错误。
  - 新建 `AiService` 编排提示渲染→provider 调用→解析→可选写回词条，新增 `/api/ai/providers`、`/api/ai/generate` 路由及端到端测试。
  - 渲染层增加 AI Playground（调用触发、加载/错误反馈、手动编辑回退），`.env.example` 扩展 AI 配置与 CORS。

## 2026-02-09

- 完成 plan_07：渲染层核心学习路径（Home / Today / Review）。
  - 路由与壳层：`src/renderer/main.tsx` 接入 `QueryClientProvider` + `HashRouter`，`src/renderer/App.tsx` 注册 `HomePage/TodayPage/ReviewPage` 路由，`src/renderer/components/AppLayout.tsx` 提供统一导航与快捷键提示。
  - 数据访问分层：新增 `src/renderer/api/client.ts` 统一 API 调用与错误结构，按领域拆分 `api/stats.ts`、`api/review.ts`、`api/words.ts`，避免页面直接拼 URL 与重复 fetch 逻辑。
  - Review 状态管理：`src/renderer/stores/review-store.ts` 维护队列快照与历史栈；`src/renderer/hooks/useKeyboardShortcuts.ts` 封装评分、展开、回退快捷键，解耦页面与键盘事件实现。
  - 页面与组件：`pages/HomePage.tsx`（统计 + 队列预览 + AI Playground）、`pages/TodayPage.tsx`（搜索/难度过滤/分页）、`pages/ReviewPage.tsx`（SM-2 评分、跳过、回退、进度）；新增 `ReviewCard`、`StatTiles`、`WordListItem`、`Skeleton` 组件，`styles.css` 更新为新布局与状态样式。
  - 测试：新增 `pages/__tests__/review.test.tsx`（评分推进与回退）与 `pages/__tests__/today.test.tsx`（查询参数与列表加载），`vitest.setup.ts` 引入 `@testing-library/jest-dom`，并提供 `test-utils.tsx` 统一测试 Provider。
- 已知环境限制（开发机网络）：`pnpm install` 访问 npm registry 失败（`ENOTFOUND registry.npmjs.org`），导致本地 `node_modules/.bin/vite` 缺失；`pnpm dev` 报 `vite: command not found`。需先恢复网络/镜像后再安装依赖并验证。
