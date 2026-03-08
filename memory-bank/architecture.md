# Kotoba 仓库结构与职责说明（当前快照）

## 1. 架构阶段说明
- 当前已完成实施计划步骤 4，且已通过用户验证。
- 仓库处于“可运行壳工程 + 领域模型固化”阶段，下一阶段是步骤 5（JSON 存储与原子写入）。
- 已具备主进程、预加载、渲染层与共享类型的最小闭环，并落地 Electron 安全基线与 IPC 白名单机制。
- 已具备提交前质量门禁链路：`ESLint + Prettier + Husky + lint-staged + verify`。
- 已具备领域数据结构与 `zod` schema 校验能力（含 `schema_version=1` 固化）。

## 2. 顶层文件结构与职责
- `AGENTS.md`
  - 仓库协作规范、文档读取顺序、AI 执行约束。
- `plan.md`
  - 实施计划主文档（步骤目标、验收命令、通过指标）。
- `package.json`
  - 依赖声明与工程脚本入口。
  - 当前包含 `dev`、`lint`、`format:check`、`test:unit`、`test`、`typecheck`、`verify`、`build` 相关脚本。
  - 内置 `lint-staged` 规则（暂存文件提交前校验/格式化）。
- `pnpm-lock.yaml`
  - 锁定依赖 patch 版本，保证可复现安装结果。
- `.nvmrc`
  - 目标 Node 主版本声明（`22`）。
- `.eslintrc.cjs`
  - ESLint 规则配置（TypeScript + React Hooks）。
- `.prettierrc.json`
  - Prettier 风格配置。
- `.prettierignore`
  - Prettier 忽略规则（避免非代码文档与产物进入格式检查）。
- `.husky/pre-commit`
  - Git 提交前钩子，执行 `pnpm lint-staged`。
- `.husky/_/`
  - Husky 初始化生成的内部脚本目录（由 Husky 维护）。
- `tsconfig.json`
  - TypeScript 编译与类型检查配置（strict/noEmit）。
- `vite.config.ts`
  - Vite 渲染层构建配置。
- `index.html`
  - 渲染层 HTML 入口，挂载 React 根节点。
- `.gitignore`
  - 忽略本地产物与依赖目录（如 `node_modules`、`dist`、`dist-electron`）。
- `dist-electron/`
  - 本地构建与开发 watch 产物目录（主进程/preload 编译结果）。
- `prompts/coding-principles.md`
  - 开发原则约束文档。
- `memory-bank/`
  - 长期记忆文档目录（需求、技术、进度、架构）。

## 3. src 目录结构与职责
- `src/main/main.ts`
  - Electron 主进程入口。
  - 创建窗口并加载渲染页面。
  - 设置安全基线：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。
  - 启动时注册 IPC 路由。
- `src/main/ipc_router.ts`
  - IPC 统一处理入口。
  - 校验 envelope 格式、校验频道是否在白名单、分发到具体 handler。
  - 对异常与拒绝场景输出标准化错误码与日志。
- `src/preload/preload.ts`
  - 通过 `contextBridge` 暴露受限 API（`window.kotoba.invoke`）给渲染层。
  - 隔离渲染层与 Node/Electron 原生能力。
- `src/shared/ipc.ts`
  - IPC 协议共享定义：通道常量、请求/响应类型、错误码、校验函数。
  - 作为 main/preload/renderer 三层共用的契约文件。
- `src/shared/domain_schema.ts`
  - 领域模型与 `zod` schema 定义。
  - 覆盖 `Word`、`ReviewState`、`ReviewLog`、`LibraryRoot`、`Settings`。
  - 固化 `schema_version=1`、UTC ISO 时间格式与 AI 输出字段长度约束。
- `src/shared/domain_schema.test.ts`
  - 领域 schema 单元测试。
  - 验证合法输入通过、非法输入（缺字段/超长/类型错）拒绝与 `schema_version` 错误定位。
- `src/renderer/main.tsx`
  - React 渲染入口，挂载 `App`。
- `src/renderer/app.tsx`
  - 当前 MVP shell 页面。
  - 提供“允许/非允许 IPC”调用按钮用于验证白名单行为。
- `src/renderer/style.css`
  - 渲染层基础样式。
- `src/renderer/window.d.ts`
  - 浏览器全局类型扩展（`window.kotoba`）。

## 4. 当前运行流程（步骤 2 落地）
1. `pnpm dev` 启动 Vite、main/preload esbuild watch 与 Electron 进程。
2. 主进程创建窗口并加载 `http://localhost:5173`。
3. 渲染层通过 `window.kotoba.invoke` 发起请求到桥接通道 `kotoba:invoke`。
4. `ipc_router` 校验并分发：
  - 命中白名单：执行 handler 并返回 `ok: true`
  - 未命中白名单或参数非法：返回 `ok: false` + 错误码，并记录拒绝日志

## 5. 当前质量门禁流程（步骤 3 + 步骤 4）
1. 开发者执行 `pnpm verify`，串行运行：`lint -> format:check -> typecheck`。
2. Git `commit` 时，`husky pre-commit` 自动触发 `pnpm lint-staged`。
3. `lint-staged` 只处理暂存文件：
  - `*.{ts,tsx}`：`eslint --fix` + `prettier --write`
  - `*.{js,cjs,mjs,json,css,html}`：`prettier --write`
4. 执行领域 schema 验证时使用：`pnpm test:unit -- schema`。

## 6. 当前关键文件清单（供后续 AI 快速定位）
- 基础工程与配置：
  - `package.json`：脚本与依赖入口
  - `tsconfig.json`：TypeScript 严格类型配置
  - `vite.config.ts`：渲染层构建配置
  - `.eslintrc.cjs` / `.prettierrc.json` / `.prettierignore`：代码质量配置
  - `.husky/pre-commit`：提交前钩子
- 主进程与 IPC：
  - `src/main/main.ts`
  - `src/main/ipc_router.ts`
  - `src/preload/preload.ts`
  - `src/shared/ipc.ts`
- 领域模型与测试：
  - `src/shared/domain_schema.ts`
  - `src/shared/domain_schema.test.ts`
- 渲染层：
  - `src/renderer/main.tsx`
  - `src/renderer/app.tsx`
  - `src/renderer/style.css`
  - `src/renderer/window.d.ts`
- 文档与记忆库：
  - `memory-bank/design-doc.md`
  - `memory-bank/tech-stack.md`
  - `memory-bank/progress.md`
  - `memory-bank/architecture.md`
  - `prompts/coding-principles.md`

## 7. memory-bank 文档职责
- `memory-bank/design-doc.md`
  - 需求与行为规则的 source of truth。
- `memory-bank/tech-stack.md`
  - 技术选型与默认值快照，需与 `design-doc.md` 保持一致。
- `memory-bank/progress.md`
  - 执行进度、验证证据、下一步入口。
- `memory-bank/architecture.md`
  - 当前文件结构、模块职责与运行流程（本文档）。

## 8. 信息流更新规则
- 需求或行为变更：先更新 `memory-bank/design-doc.md`，再同步 `memory-bank/tech-stack.md`。
- 每完成一个实施步骤：更新 `memory-bank/progress.md`。
- 文件结构或职责变化：同步更新 `memory-bank/architecture.md`。
