# 工程规范基线（plan_01 输出）

## 目录与包划分
- `packages/main`：Electron 主进程 + Fastify API + SQLite 访问。
- `packages/renderer`：React/Vite 渲染端。
- `packages/shared`：跨进程共享类型/Schema。
- `data/`：本地 SQLite 存储，忽略 `*.sqlite`。
- `scripts/`：自动化脚本预留位。

## 命名与代码风格
- TypeScript 优先，2 空格缩进，遵循 Prettier 配置（singleQuote、trailingComma=all）。
- 文件：kebab-case；React 组件 PascalCase；hooks 以 `use` 前缀；Zustand store `useXStore`；共享工具 camelCase。
- 注释聚焦“为何”，避免赘述“做什么”。

## 常用脚本（根目录执行）
- `pnpm dev` / `pnpm build` / `pnpm typecheck`：当前阶段均执行类型检查（后续可替换真实 dev/build）。
- `pnpm lint`：ESLint（@typescript-eslint），React 规则仅作用 renderer。
- `pnpm format`：Prettier 检查。
- `pnpm test`：占位运行 `vitest --version`（引入 Vitest，待写用例）。
- `pnpm check`：lint + format + test + typecheck，作为提交前默认检查。

## 提交流程
1) 确保 Node >= 20 & pnpm >= 10。
2) `pnpm install`（会注入 simple-git-hooks）。
3) 开发前复制 `.env.example` 为 `.env.local` 并填入 `OPENAI_API_KEY` / `GEMINI_API_KEY`。
4) 提交前运行（或依赖 pre-commit 自动执行）`pnpm check`；提交信息保持祈使句短句。

## 其他约束
- 模块化优先，避免巨石文件；共享类型放在 `packages/shared` 并通过路径别名 `@kotoba/shared` 引用。
- 本地数据不入库：`data/*.sqlite` 已忽略。
- 未来加入真实测试时，优先 Vitest + React Testing Library；SM-2 核心逻辑需要高覆盖度。
