# 架构与工程约定（workspace 搭建基线）

## 目录与职责
- `packages/main/`：Electron 主进程 + Fastify API + 本地 SQLite 访问；后续放置 SM-2 逻辑与业务服务。
- `packages/renderer/`：React/Vite 渲染端；页面与交互（Home/Today/Review/Library/Settings）。
- `packages/shared/`：跨进程共享类型与校验（现有 `Difficulty`、`WordRecord` 占位）。
- `data/`：本地 SQLite 文件目录，`*.sqlite` 已忽略。
- `scripts/`：自动化脚本预留。
- `docs/`：工程规范等说明文档。
- `memory-bank/`：设计/讨论/架构/进度记录（本文件即架构视图）。
- 根文件：
  - `pnpm-workspace.yaml`：声明 workspace 包含 `packages/*`。
  - `package.json`：根脚本（dev/build/lint/format/test/typecheck/check）、dev 依赖、pre-commit hook 配置。
  - `.eslintrc.cjs`：ESLint 基线（TS 全局，React 规则仅 renderer 生效）。
  - `.prettierrc`：格式化规则（printWidth 100，singleQuote true，trailingComma all）。
  - `tsconfig.base.json`：strict TS 基线，Node 模块解析，`@kotoba/shared` 路径别名指向 `packages/shared/src`。
  - `tsconfig.json`：项目引用入口，指向 main/renderer/shared。
  - `.gitignore`：忽略 node_modules、构建产物、`.env.local`、`data/*.sqlite` 等。
  - `.env.example`：示例环境变量（OPENAI_API_KEY、GEMINI_API_KEY）。
  - `.npmrc`：允许 esbuild/simple-git-hooks 安装脚本。

## 工具链与脚本
- 包管理：pnpm@10；Node ≥ 20。
- 质量：ESLint（@typescript-eslint，React 仅 renderer）、Prettier。
- 测试：Vitest 已安装；当前 `test` 脚本输出版本占位，待业务落地补充用例（优先 SM-2、API、关键 UI 流程）。
- 命令（根执行）：`pnpm dev/build/typecheck`（现阶段=typecheck）、`pnpm lint`、`pnpm format`、`pnpm test`、`pnpm check`（lint+format+test+typecheck 汇总）。
- Git hooks：simple-git-hooks 设置 `pre-commit` 运行 `pnpm check`。

## 数据库 schema（SQLite 规划）
- 表 `words`：
  - `id` INTEGER PRIMARY KEY
  - `word` TEXT
  - `reading` TEXT
  - `context_expl` TEXT
  - `scene_desc` TEXT
  - `example` TEXT
  - `difficulty` TEXT
  - `ef` REAL DEFAULT 2.5
  - `interval_days` INTEGER
  - `repetition` INTEGER
  - `last_review_at` TEXT (ISO)
  - `next_due_at` TEXT (ISO)
  - `created_at` TEXT
  - `updated_at` TEXT
- 预留扩展（待需求明确再迁移）：`source`、`tags`、`pos` 等。

## 当前占位实现
- `packages/shared/src/index.ts`：定义 `Difficulty` 枚举类型与 `WordRecord` 接口，供两端引用。
- `packages/main/src/index.ts`：占位函数 `describeBootstrap`，确保主进程包可 lint/typecheck。
- `packages/renderer/src/main.tsx`：占位 React 入口，创建 root，展示共享类型样例数据。
- `docs/engineering-conventions.md`：总结目录划分、命名规范、脚本与提交流程，便于新成员快速对齐。
