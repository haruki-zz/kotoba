## 2026-02-03

- 完成 plan_01：建立单包结构（禁止 workspace），搭建 Vite + React 占位渲染层与 main/shared 占位代码，配置 tsconfig / ESLint / Prettier / Vite / Vitest，提供 `.env.example`、`.gitignore`，并通过 `pnpm lint`、`pnpm test`、`pnpm build`。
- 完成 plan_02：落地本地 SQLite 数据层。
  - 新增 Zod schema 与类型（words/tags/sources），抽出 SM-2 默认常量。
  - 实现迁移体系与核心表（words/tags/sources/word_tags/app_meta），索引与外键约束开启 WAL。
  - 提供仓储层（Word/Tag/Source）含标签映射、来源 upsert、到期查询；导出 `createDbContext`。
  - CLI 脚本：`pnpm db:migrate` 迁移、`pnpm db:backup` 备份到 `data/backups/`。
  - 文档与架构更新：`docs/database-schema.md`、`memory-bank/architecture.md` 补充文件作用与 schema。
  - 新增数据库相关测试并通过 `pnpm test`，`pnpm typecheck` 亦通过。
