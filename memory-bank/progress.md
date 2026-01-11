## 2026-01-10
- 完成实施计划第 1 步：初始化 npm 项目，设定 ES module 与 private 标记，添加占位 lint/test 脚本；生成 package-lock.json；新增 `.gitignore` 忽略依赖与本地密钥文件；创建 `.env.local` 提供 OpenAI/Google API 密钥占位，确保后续读取环境变量时不会报错；验证 `npm install` 与占位 `npm run lint` 可正常执行。 

## 2026-01-11
- 完成实施计划第 2 步：新增最小依赖（Electron/Vite/TypeScript/React）并配置 `dev`、`build`、`build:desktop` 脚本，接入 electron-builder；建立 `tsconfig.json`、`vite.config.ts`，输出目录区分 `dist/renderer` 与 `dist-electron`。
- 搭建最小骨架：`src/main` 创建窗口并加载 Vite dev/prod 资源，`src/preload` 预留空桥接，`src/renderer` 挂载 React 占位页面，根 `index.html` 作为渲染入口。
- 修复 `npm run dev` 主进程模块类型冲突：调整主进程构建为 ESM（`index.mjs`）并更新 `package.json` 的 `main` 指向，确保 dev 启动无 ESM/CJS 报错；`npm run build` 打包通过。

## 2026-01-12
- 完成实施计划第 3 步：接入 ESLint flat 配置与 Prettier，新增 `eslint.config.js`、`.prettierrc`/`.prettierignore`，并在 `package.json` 增补 `lint`/`format` 脚本与所需依赖（eslint、typescript-eslint、react/react-hooks 插件、eslint-config-prettier、prettier 等）。
- 运行 `npm run lint` 验证现有 `src` 与配置文件均通过格式与规则检查，未调整业务逻辑。

## 2026-01-13
- 完成实施计划第 4 步：在 `src/shared` 定义词条/活跃度类型、SM-2 默认状态与更新算法、数据校验与默认补全逻辑；新增 `src/__test__` 覆盖 SM-2 更新/队列排序与词条/活跃度校验的 Vitest 用例。
- 将 `npm test` 切换为 Vitest，更新 `vite.config.ts` 支持测试配置，运行 `npm test` 全部通过。

## 2026-01-14
- 完成实施计划第 5 步：在主进程新增 `src/main/storage` 模块，统一数据目录解析、原子写入、词条增删改与 SM-2 评分更新，并对 `words.json`/`activity.json` 读写进行校验与默认补全。
- 新增活跃度递增与 streak 计算逻辑（按 UTC 日期统计），确保新增/复习操作都会累积 `added_count`/`review_count`。
- 添加基于临时目录的 `src/__test__/storage.test.ts`，覆盖原子写入防护、默认补全、SM-2 更新与活跃度聚合；（测试由用户执行并通过）。

## 2026-01-15
- 完成实施计划第 6 步：在 `src/main/ai` 搭建 AI 提供商适配层，抽象统一接口封装 OpenAI/Gemini/Mock，集中提示文案、term 长度校验、JSON 字段解析与超时控制（默认 12s）。
- OpenAI provider 采用 `gpt-4o-mini` 非流式 JSON 输出，Gemini provider 使用 Flash 2.5 Lite 预览模型并限制输出 tokens；无密钥默认使用 mock provider 便于开发。
- 新增 `src/__test__/ai-providers.test.ts` 使用 mock fetch/model 覆盖解析错误、超时与默认 mock 分支；引入 `openai`、`@google/generative-ai` 依赖。测试由用户执行并通过。

## 2026-01-16
- 完成实施计划第 7 步：定义共享 IPC 契约与 AI/词条草稿类型（`src/shared/ipc.ts`、`src/shared/ai.ts`、`src/shared/types.ts`），确保主渲染两端接口一致。
- 主进程新增 IPC 层（`src/main/ipc`）与 provider 管理器，集中入参校验、AI provider 配置、SM-2 队列与 DataStore 调度，并在主入口注册/卸载 handlers。
- 预加载层通过 contextBridge 仅暴露白名单 API（`src/preload/index.ts`），渲染端增加类型声明 `src/renderer/electron-api.d.ts`。
- 添加 IPC 行为单测 `src/__test__/ipc.test.ts` 覆盖频道注册、入参校验、队列过滤与 provider 配置。测试由用户执行并通过。
