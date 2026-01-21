# 进度记录

## 2026-01-21

- 搭建 pnpm workspace 骨架：创建 packages/main、packages/renderer、packages/shared 及 data、scripts、docs；配置共享 tsconfig（base + references + eslint 用），每包添加 composite tsconfig 与占位 src 入口。
- 工具链与脚本：根级 package.json 写入 dev/build/lint/format/test/typecheck、postinstall 安装 simple-git-hooks（pre-commit 执行 lint + format:check + test）；安装 ESLint flat config、Prettier、Vitest、TypeScript 等依赖。
- 规范与环境：新增 .env.example（OPENAI_API_KEY/GEMINI_API_KEY/DATABASE_PATH）、.gitignore/.prettierignore 与 docs/engineering.md 说明工程规范；更新 architecture.md 记录当前结构与 words 表 schema。
- 问题修复：调整 lint 范围与忽略 dist 产物，避免 @typescript-eslint/parser 对编译输出报缺失 tsconfig。
