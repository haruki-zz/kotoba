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
