# 架构与工程状态

## 工作区与模块

- 单仓 pnpm workspace，工具链基于 Node 18+ / pnpm 9。
- 包拆分：`packages/main`（Electron 主进程 + Fastify API + SQLite 访问）、`packages/renderer`（React/Vite 渲染层）、`packages/shared`（共享类型与 schema）。辅助目录：`data/`（本地 SQLite，gitignore）、`scripts/`（自动化）、`docs/` 与 `memory-bank/`（设计文档）。
- TypeScript/ESM 统一，`tsconfig.base.json` 作为共享编译基线，包内 `tsconfig.json` 以 composite 方式参与 `tsc -b`。

## 质量与脚本

- 质量：ESLint（flat config，@typescript-eslint + React/Hooks + simple-import-sort）、Prettier 默认规则。
- 测试：Vitest（`pnpm test` 运行 `vitest run --passWithNoTests`，后续补充 RTL）。
- 根级脚本：`pnpm dev`（逐包占位 dev）、`pnpm build`（逐包 tsc）、`pnpm lint`、`pnpm format` / `format:check`、`pnpm typecheck`。
- simple-git-hooks 安装 pre-commit（lint + format:check + test），`postinstall` 自动写入 git hooks。

## 文件作用说明

- `pnpm-workspace.yaml`：定义 workspace 作用域（`packages/*`、`scripts`），统一安装与脚本调度。
- 根 `package.json`：声明包管理器版本、跨包脚本（dev/build/lint/format/test/typecheck）、postinstall 安装 git hooks、开发依赖版本。
- TypeScript 配置：`tsconfig.base.json` 共享编译基线；根 `tsconfig.json` 维护包引用用于 `tsc -b`；`tsconfig.eslint.json` 为 ESLint 提供 noEmit 项目上下文；各包 `tsconfig.json` 设 composite/rootDir/outDir/tsBuildInfo。
- Lint/Format：`eslint.config.mjs` 采用 flat config，启用 TS/React/Hooks/import-sort，并忽略 dist/data；`.prettierrc`/`.prettierignore` 控制格式；`.gitignore` 排除 node_modules、dist、data、.env\* 等。
- 环境与文档：`.env.example` 给出 OPENAI/GEMINI key 与 DATABASE_PATH 示例；`docs/engineering.md` 汇总目录约定、脚本、命名与钩子；本文件追踪当前架构与 schema。
- 包内容占位：`packages/*/src/index.ts` 保持 composite 构建可运行，待后续替换为实际主进程/渲染/共享逻辑。

## 环境与数据

- 环境变量：`.env.example` 提供 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`DATABASE_PATH` 示例，使用时复制为 `.env.local`。`.env*` 与 `data/` 已加入 `.gitignore`。
- 本地数据库路径建议 `data/kotoba.sqlite`，保持单机存储与隐私。

## 数据库 Schema（SQLite）

- `words` 表（间隔重复核心）：
  - `id` INTEGER PRIMARY KEY
  - `word` TEXT NOT NULL
  - `reading` TEXT
  - `context_expl` TEXT
  - `scene_desc` TEXT
  - `example` TEXT
  - `difficulty` TEXT CHECK (difficulty IN ('easy','medium','hard'))
  - `ef` REAL DEFAULT 2.5
  - `interval_days` INTEGER
  - `repetition` INTEGER
  - `last_review_at` TEXT -- ISO 时间
  - `next_due_at` TEXT -- ISO 时间
  - `created_at` TEXT
  - `updated_at` TEXT
- 后续扩展字段（未入库）：`source`、`tags`、`pos` 等待需求明确后迁移。
