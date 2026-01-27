# 架构与工程约定（workspace 搭建基线）

## 工作区结构
- 单仓 pnpm workspace；根级 `pnpm-workspace.yaml` 收敛至 `packages/*`。
- 目录：`packages/main`（Electron/Fastify 主进程与本地 API/SQLite 访问）、`packages/renderer`（React/Vite 渲染端）、`packages/shared`（跨进程类型与校验）、`data/`（本地 SQLite，*.sqlite 已忽略）、`scripts/`（自动化预留）、`memory-bank/`（产品与架构文档）。
- 根级脚本：`pnpm dev|build|lint|format|test|typecheck` 递归调用各子包；`pnpm check` 汇总 lint/format/test/typecheck；`postinstall` 通过 simple-git-hooks 注入 `pre-commit`（执行 `pnpm check`）。
- TypeScript 基线：`tsconfig.base.json` 开启 strict、Node 模块解析，定义 `@kotoba/shared` 路径别名指向 `packages/shared/src`，各子包继承并添加场景化配置（renderer 启用 JSX/DOM）。

## 模块职责（当前为占位骨架）
- `packages/shared`：共享类型/schema（已提供 `Difficulty`、`WordRecord` 占位接口）。
- `packages/main`：主进程与 API、SM-2 逻辑、SQLite 访问的承载地（现存占位函数）。
- `packages/renderer`：React 前端（已放置占位 App 组件，引用共享类型）。
- `data/`：本地 SQLite 存储路径；禁止提交实际数据库文件。
- `scripts/`：后续自动化脚本存放点。

## 工具链与规范
- 语言与格式：TypeScript、ESLint（@typescript-eslint）、Prettier（2 空格、singleQuote true），全局规则置于 `.eslintrc.cjs`，React 规则仅作用于 renderer。
- 测试：Vitest 已安装；当前 `test` 脚本仅输出版本占位，待业务代码落地后切换为实际用例与 RTL。
- 构建/运行：`dev`/`build`/`typecheck` 现阶段均执行类型检查，后续可替换为真实 dev server 与打包流程。
- 环境变量：`.env.example` 提供 `OPENAI_API_KEY`、`GEMINI_API_KEY`；`.env.local` 已加入 `.gitignore`。
- Git hooks：simple-git-hooks 预设 `pre-commit` 运行 `pnpm check`，确保提交前 lint/format/test/typecheck。

## 数据库 schema（SQLite，当前规划）
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
  - `last_review_at` TEXT（ISO）
  - `next_due_at` TEXT（ISO）
  - `created_at` TEXT
  - `updated_at` TEXT
- 未来扩展（待需求明确再迁移）：`source`、`tags`、`pos` 等。
