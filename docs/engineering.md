# 工程规范

## 工作区结构

- pnpm 工作区，根目录统一调度；包按职责拆分：`packages/main`（Electron 主进程 + Fastify/API）、`packages/renderer`（React/Vite 渲染层）、`packages/shared`（共享类型/Zod schema）。
- `data/` 存放本地 SQLite（如 `data/kotoba.sqlite`），不纳入版本控制；`scripts/` 放自动化脚本；文档位于 `docs/` 与 `memory-bank/`。
- TypeScript 优先，保持多文件模块化，避免巨石文件。

## 运行与脚本

- 安装依赖：`pnpm install`（自动安装 simple-git-hooks）。
- 开发占位：`pnpm dev`（当前输出占位提示，后续接入 Electron/Vite）。
- 构建：`pnpm build`（逐包 tsc 编译）。
- 质量：`pnpm lint`、`pnpm format` / `pnpm format:check`、`pnpm test`（Vitest，无测试时允许通过）、`pnpm typecheck`（tsc -b）。
- 包内脚本可单独执行（如 `pnpm -C packages/main lint`），根脚本默认递归执行 `packages/*`。

## 代码规范

- Prettier 默认规则、2 空格缩进；ESM 模式。
- ESLint 使用 flat config，集成 `@typescript-eslint`、React/Hooks 与 simple-import-sort，忽略 `dist/`、`data/` 等产物。
- 命名：文件 kebab-case，React 组件 PascalCase，hooks 以 `use` 开头，Zustand stores 以 `useXStore` 命名。
- 测试框架：Vitest（UI 采用 React Testing Library，待后续接入）。

## 环境与敏感信息

- 示例变量：参考 `.env.example`（`OPENAI_API_KEY`、`GEMINI_API_KEY`、`DATABASE_PATH`），复制为 `.env.local` 使用。
- 不要提交 `.env*`、`data/` 中的数据库或个人词表数据；相关路径已在 `.gitignore` 中。

## 提交流程

- simple-git-hooks 预设 `pre-commit`：`pnpm lint && pnpm format:check && pnpm test --runInBand`。
- 提交信息遵循简短祈使句（如 “add design doc”），必要时拆分为小步提交。
