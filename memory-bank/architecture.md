# Kotoba 仓库结构与职责说明（当前快照）

## 1. 架构阶段说明
- 当前已完成实施计划步骤 8，且步骤 8 已通过用户验证。
- 仓库处于“可运行壳工程 + 领域模型固化 + 本地 JSON 仓储能力”阶段。
- 已具备主进程、预加载、渲染层与共享类型的最小闭环，并落地 Electron 安全基线与 IPC 白名单机制。
- 已具备提交前质量门禁链路：`ESLint + Prettier + Husky + lint-staged + verify`。
- 已具备领域数据结构与 `zod` schema 校验能力（含 `schema_version=1` 固化）。
- 已具备步骤 5+6+7+8 目标能力：原子写入、串行写队列、每日备份、启动损坏回退、`schema_version` 顺序迁移、迁移失败回滚、设置默认值自动生效、API Key keytar 存储、AI Provider 抽象与 Gemini 重试链路。
- 文档状态：本文件已按步骤 8 验证后的实际文件结构与职责同步，可直接作为后续 AI 开发交接基线。

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
  - Git 提交前钩子，执行 `pnpm lint-staged`（仅保留执行命令，兼容 Husky v10）。
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
- `src/main/library_repository.ts`
  - JSON 仓储核心实现。
  - 对外提供：启动初始化/校验恢复、读取、串行写入、串行更新。
  - 内部实现：临时文件写入 + 原子替换、每日首次写入备份、最近有效备份回退、`schema_version` 迁移前强制备份与失败回滚。
- `src/main/settings_repository.ts`
  - 设置仓储实现。
  - 对外提供：读取默认设置、设置写入、设置更新（串行）。
  - 内部实现：设置文件原子写入；首次读取时自动写入 `DEFAULT_SETTINGS`。
- `src/main/keytar_secret_store.ts`
  - API Key 安全存储适配层。
  - 封装 keytar `set/get/delete`，统一 service/account 命名并保证 API Key 不写入 JSON。
- `src/main/settings_service.ts`
  - 设置服务层。
  - 提供加载 AI 运行时配置能力；当 API Key 缺失时抛出 `SETTINGS_API_KEY_MISSING` 并引导前往设置页。
- `src/main/ai_provider.ts`
  - AI Provider 统一抽象与输出校验模块。
  - 提供 `AiProvider` 接口、四字段输出 schema、JSON 双层校验与非日语输出判定。
- `src/main/gemini_provider.ts`
  - Gemini Provider 默认实现。
  - 提供 Gemini SDK 调用、超时中断、错误分级、指数退避重试（`500ms -> 1500ms` + jitter）。
- `src/preload/preload.ts`
  - 通过 `contextBridge` 暴露受限 API（`window.kotoba.invoke`）给渲染层。
  - 隔离渲染层与 Node/Electron 原生能力。
- `src/shared/ipc.ts`
  - IPC 协议共享定义：通道常量、请求/响应类型、错误码、校验函数。
  - 作为 main/preload/renderer 三层共用的契约文件。
- `src/shared/domain_schema.ts`
  - 领域模型与 `zod` schema 定义。
  - 覆盖 `Word`、`ReviewState`、`ReviewLog`、`LibraryRoot`、`Settings` 与迁移输入 `library_root_v0_schema`。
  - 固化 `schema_version=1`、UTC ISO 时间格式与 AI 输出字段长度约束。
- `src/shared/domain_schema.test.ts`
  - 领域 schema 单元测试。
  - 验证合法输入通过、非法输入（缺字段/超长/类型错）拒绝与 `schema_version` 错误定位。
- `src/main/library_repository.repository.test.ts`
  - 验证并发更新场景的串行化写入与结果完整性（无字段丢失）。
- `src/main/library_repository.backup.test.ts`
  - 验证“每日首次写入备份一次”的触发规则。
- `src/main/library_repository.recovery.test.ts`
  - 验证启动时主文件损坏恢复路径与“无可用备份”失败路径。
- `src/main/library_repository.migration.test.ts`
  - 验证旧版本库迁移到当前版本、`updated_at` 更新与迁移前备份生成。
- `src/main/library_repository.rollback.test.ts`
  - 验证迁移异常时自动回滚，并保持原文件可再次迁移。
- `src/main/settings_repository.test.ts`
  - 验证默认设置首次生效、设置更新持久化、缺失 API Key 的引导错误。
- `src/main/keytar_secret_store.test.ts`
  - 验证 keytar 适配层的 API Key 存取删行为，以及 API Key 不进入 `settings/library` JSON。
- `src/main/gemini_provider_ai_provider.test.ts`
  - 验证 Gemini Provider 正常路径能返回四字段 JSON 且请求参数符合预期。
- `src/main/gemini_provider_ai_retry.test.ts`
  - 验证 `429/5xx` 重试退避与非日语输出自动重试行为。
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

## 5. 当前质量门禁流程（步骤 3 + 步骤 4 + 步骤 5 + 步骤 6 + 步骤 7 + 步骤 8）
1. 开发者执行 `pnpm verify`，串行运行：`lint -> format:check -> typecheck`。
2. Git `commit` 时，`husky pre-commit` 自动触发 `pnpm lint-staged`。
3. `lint-staged` 只处理暂存文件：
  - `*.{ts,tsx}`：`eslint --fix` + `prettier --write`
  - `*.{js,cjs,mjs,json,css,html}`：`prettier --write`
4. 执行领域 schema 验证时使用：`pnpm test:unit -- schema`。
5. 执行仓储验证时使用：`pnpm test:unit -- repository|backup|recovery`。
6. 执行迁移验证时使用：`pnpm test:unit -- migration|rollback`。
7. 执行设置与密钥验证时使用：`pnpm test:unit -- settings|keytar`。
8. 执行 AI Provider 验证时使用：`pnpm test:unit -- ai-provider|ai-retry`。

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
  - `src/main/library_repository.ts`
  - `src/main/settings_repository.ts`
  - `src/main/keytar_secret_store.ts`
  - `src/main/settings_service.ts`
  - `src/main/ai_provider.ts`
  - `src/main/gemini_provider.ts`
  - `src/preload/preload.ts`
  - `src/shared/ipc.ts`
- 领域模型与测试：
  - `src/shared/domain_schema.ts`
  - `src/shared/domain_schema.test.ts`
- 仓储与恢复测试：
  - `src/main/library_repository.repository.test.ts`
  - `src/main/library_repository.backup.test.ts`
  - `src/main/library_repository.recovery.test.ts`
  - `src/main/library_repository.migration.test.ts`
  - `src/main/library_repository.rollback.test.ts`
- 设置与密钥测试：
  - `src/main/settings_repository.test.ts`
  - `src/main/keytar_secret_store.test.ts`
- AI Provider 测试：
  - `src/main/gemini_provider_ai_provider.test.ts`
  - `src/main/gemini_provider_ai_retry.test.ts`
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
