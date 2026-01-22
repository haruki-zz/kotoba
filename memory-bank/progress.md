# 进度记录

## 2026-01-21

- 搭建 pnpm workspace 骨架：创建 packages/main、packages/renderer、packages/shared 及 data、scripts、docs；配置共享 tsconfig（base + references + eslint 用），每包添加 composite tsconfig 与占位 src 入口。
- 工具链与脚本：根级 package.json 写入 dev/build/lint/format/test/typecheck、postinstall 安装 simple-git-hooks（pre-commit 执行 lint + format:check + test）；安装 ESLint flat config、Prettier、Vitest、TypeScript 等依赖。
- 规范与环境：新增 .env.example（OPENAI_API_KEY/GEMINI_API_KEY/DATABASE_PATH）、.gitignore/.prettierignore 与 docs/engineering.md 说明工程规范；更新 architecture.md 记录当前结构与 words 表 schema。
- 问题修复：调整 lint 范围与忽略 dist 产物，避免 @typescript-eslint/parser 对编译输出报缺失 tsconfig。

## 2026-01-21（数据模型与数据库）

- 共享 Schema：在 packages/shared/src/schemas 下定义 word/review/settings/ai Zod schema 及 SM-2 常量（sm2.ts），通过 index.ts 汇出；补充 workspace 出口与 package 元信息。
- 数据层：在 packages/main/src/db 搭建 config/connection/migrator/migrations/0001_init（words 表+索引）/word-repository（CRUD+过滤+分页）/word-mapper/transaction/setup（initializeDatabase）并依赖 @kotoba/shared。
- 文档：新增 docs/data-model.md（字段与 schema 说明）、docs/data-testing-plan.md（测试计划），更新 memory-bank/architecture.md 记录文件作用与默认值。
- 校验：运行 pnpm typecheck、pnpm test（暂无用例）；清理误生成的 src 下 .js/.d.ts 产物。

## 2026-01-22（主进程 API 与 ESM 兼容）

- 主进程 Fastify：新增 server 模块（app/config/plugins/routes/services/standalone）提供健康检查、词条 CRUD、复习队列/提交/撤销、统计摘要、设置读写；引入 CORS + Bearer 校验（http 模式）、按读写的限流、统一错误格式与 Zod 校验。
- 运行脚本：packages/main dev 现在编译后启动 standalone（API_MODE=http 默认），支持 env 配置 host/port/cors/token；添加 settings.json 本地持久化。
- ESM 规范：为 Node ESM 运行修复所有相对导入/导出为显式 .js 扩展，并修正目录引用到 index 文件，解决 pnpm dev 的 ERR_MODULE_NOT_FOUND。
- 校验：通过 pnpm --filter @kotoba/main lint/build、pnpm --filter @kotoba/shared lint/build，运行 pnpm test（暂无用例）；手动 smoke 启动 API_PORT=0 node dist/server/standalone.js 正常监听后退出。
