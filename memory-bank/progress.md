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
