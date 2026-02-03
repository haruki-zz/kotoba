# 架构（更新：plan_01 环境与基础框架）

## 项目结构
- 单一 package.json（禁止 workspace / monorepo），所有依赖安装于根级 node_modules。
- 目录：
  - `src/main`：Electron 主进程 + Fastify API（当前为占位）。
  - `src/renderer`：Vite + React 渲染层（当前为占位页面）。
  - `src/shared`：跨进程复用的类型/未来的 Zod schema。
  - `data/`：本地 SQLite 存储（gitignore，默认 `data/kotoba.sqlite`）。
  - `scripts/`：自动化脚本占位。
  - `docs/`：文档占位；`plan/`、`memory-bank/` 存放设计资料。

## 工具链与命令
- 包管理：pnpm（packageManager=pnpm@10.28.0）。
- TypeScript 5.4，ESNext module。
- Vite 5 + React 18，用于渲染层；输出目录 `dist/renderer`。
- 代码规范：ESLint（TS/React/import），Prettier；脚本 `pnpm lint` / `pnpm format`。
- 类型检查：`pnpm typecheck`（main + renderer 双向 noEmit 检查）。
- 测试：Vitest（jsdom 环境，占位用例）。
- 构建：`pnpm build` = typecheck + Vite build。
- 环境变量：`.env.local`（未提交），参考 `.env.example`，包含 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`DATABASE_PATH` 等。

## 数据库 Schema（SQLite，本地）
- 表 `words`（来源：tech-stack.md）：
  - `id` INTEGER PRIMARY KEY
  - `word` TEXT
  - `reading` TEXT
  - `context_expl` TEXT
  - `scene_desc` TEXT
  - `example` TEXT
  - `difficulty` TEXT（枚举：easy/medium/hard）
  - `ef` REAL（默认 2.5）
  - `interval_days` INTEGER
  - `repetition` INTEGER
  - `last_review_at` TEXT（ISO）
  - `next_due_at` TEXT（ISO）
  - `created_at` TEXT
  - `updated_at` TEXT
- 未来扩展字段（暂不入库）：`source`、`tags`、`pos` 等。

## 里程碑衔接
- plan_02：数据库与模型细化（迁移、Zod schema、数据访问层）。
- plan_03：SM-2 调度核心。
- plan_04：Fastify API。
- plan_05：AI 辅助生成与提示工程。
- plan_06：Electron 主进程与应用壳。
- plan_07：渲染层体验与界面。

## 文件作用说明（当前代码/配置）
- `package.json`：单包定义与脚本（dev/build/test/lint/format/typecheck）及 pnpm-onlyBuiltDependencies 审批。
- `pnpm-lock.yaml`：依赖锁定（根级 node_modules；禁止 workspace）。
- `tsconfig.base.json`：通用 TS 选项与别名（@shared/@main/@renderer）。
- `tsconfig.main.json` / `tsconfig.renderer.json` / `tsconfig.json`：分别覆盖主进程、渲染层、全局 noEmit 类型检查。
- `.eslintrc.cjs`：TS/React/import 规则与导入排序；关闭 React in JSX scope、prop-types。
- `.prettierrc` / `.prettierignore`：格式化风格与忽略项。
- `.gitignore`：忽略 node_modules、dist、data、env 等；允许 .env.example。
- `.env.example`：本地环境变量模板（OPENAI_API_KEY、GEMINI_API_KEY、DATABASE_PATH、VITE_APP_NAME）。
- `vite.config.ts`：Vite + React 插件，产物输出 dist/renderer，Vitest 基本配置。
- `vitest.setup.ts`：测试全局占位，后续可挂载自定义匹配器/Mocks。
- `index.html`：Vite 入口文件，挂载渲染层 `src/renderer/main.tsx`。
- `src/renderer/main.tsx`：React 入口，创建根节点并渲染 App。
- `src/renderer/App.tsx`：占位 UI，呈现环境基线检查列表。
- `src/renderer/styles.css`：占位样式（浅色渐变背景、卡片样式）。
- `src/main/index.ts`：主进程占位导出；后续接入 Fastify/Electron。
- `src/shared/types.ts`：词条与 SM-2 相关类型常量（与设计文档/tech-stack schema 对齐）。
- `src/shared/__tests__/smoke.test.ts`：基础 Vitest 用例，验证类型常量可用。
- `data/.gitkeep`、`scripts/.gitkeep`、`docs/.gitkeep`：占位以保留目录结构。
- `README.md`：快速开始与目录约定（plan_01 阶段说明）。
