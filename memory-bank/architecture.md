# 架构概览

## 当前目录结构与职责
- `package.json`: npm 清单，设定 ES module、私有包标记与 dev/build/build:desktop/lint/format 脚本，配置 electron-builder 产物与 Electron 主入口（ESM）。
- `package-lock.json`: 锁定依赖版本，确保安装结果可复现。
- `.gitignore`: 忽略 `node_modules`、打包产物与本地环境变量，保持仓库整洁与密钥安全。
- `.env.local`: 本地密钥占位文件（OpenAI/Google），避免后续读取缺失变量时报错，实际值不入库。
- `eslint.config.js`: ESLint flat 配置，组合 typescript-eslint、React/React Hooks 规则并套用 Prettier，忽略构建与依赖目录。
- `.prettierrc` / `.prettierignore`: 统一 Prettier 代码风格与忽略列表，避开构建产物与锁文件。
- `tsconfig.json`: TypeScript 严格配置，启用 React JSX/DOM 库，noEmit 仅做类型检查。
- `vite.config.ts`: Vite 与 `vite-plugin-electron` 配置，分别构建 renderer（`dist/renderer`）与 Electron 主/预加载（`dist-electron`，主进程输出 ESM `index.mjs`，预加载输出 CJS）。
- `index.html`: 渲染进程入口，挂载 React 根节点并加载 `src/renderer/main.tsx`。
- `src/main/index.ts`: Electron 主进程入口，创建窗口、加载 dev/prod 资源，预设安全选项（contextIsolation=true、nodeIntegration=false）。
- `src/preload/index.ts`: 预加载脚本，占位暴露 `electronAPI`，后续可按需扩展受控桥接。
- `src/renderer/main.tsx`: React 入口，挂载根组件并启用 StrictMode。
- `src/renderer/App.tsx`: 渲染占位页面，后续 UI 将在此拓展。
- `prompts/`: 约束开发流程的全局提示集合（coding-principles、system-prompt），变更行为需遵循此处规则。
- `memory-bank/`: 项目设计与进度文档中心（设计文档、技术栈、实施计划、架构说明、UI 设计、进度记录）。
- `AGENTS.md`: 代码助手的操作规范与技能列表。

## 当前架构要点
- Electron + Vite 基础骨架已跑通：`npm run dev` 启动空白窗口，`npm run build` 打包 renderer/main/preload 并生成 electron-builder 目录。
- 主进程采用 ESM 输出，避免 CJS/ESM 混用导致的加载警告；预加载保持 CJS 以兼容 contextBridge 暴露。
- 构建产物分层存放（renderer 与 electron 独立目录），为后续主/渲染进程扩展与测试隔离打基础。
- 密钥与依赖隔离：通过 `.env.local` 与 `.gitignore` 避免敏感信息入库，锁文件保证团队一致性。
- 代码风格守护：已接入 ESLint flat 配置与 Prettier，`npm run lint` 作为统一入口保证 TypeScript/React 代码和配置文件风格一致。
- 文档优先：prompts 与 memory-bank 构成规则与设计的单一可信来源，后续模块与代码需按其约束演进。
