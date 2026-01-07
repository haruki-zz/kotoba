# 架构概览（脚手架阶段）

## 核心结构
- `package.json`：应用元数据与脚本，主入口指向 `dist-electron/main.js`，包含 Electron/Vite/React/测试/格式化依赖。
- `package-lock.json`：当前依赖锁定。
- `electron-builder.json5`：打包配置（appId/productName、mac/win/linux 目标与输出目录）。
- `electron/`：主进程与 preload。
  - `main.ts`：创建 `BrowserWindow`，注入 APP_ROOT/VITE_PUBLIC，加载 dev server 或打包文件，并向渲染进程发送启动消息。
  - `preload.ts`：通过 `contextBridge` 暴露安全的 `ipcRenderer` API。
  - `electron-env.d.ts`：主进程/预加载使用的环境变量与 Window 类型声明。
- `src/`：渲染进程 React 代码。
  - `main.tsx`：React 入口，挂载 `App`，并监听 `main-process-message`。
  - `App.tsx`、`App.css`：示例计数器 UI。
  - `index.css`：全局样式基线（含浅/深色模式占位）。
  - `assets/`：静态资源（react.svg）。
  - `__test__/`：Vitest 测试目录（所有 `*.test.tsx`/`*.test.ts` 统一放置）。
    - `App.test.tsx`：示例测试，验证计数按钮渲染。
  - `setupTests.ts`：测试环境注入 jest-dom。
  - `vite-env.d.ts`：Vite 与 Vitest 类型声明。
- `public/`：静态资源与 electron-vite 图标。
- `index.html`：渲染进程 HTML 入口，挂载点 `#root`，引用 electron 图标。
- `vite.config.ts`：Vite React 插件 + `vite-plugin-electron`（main/preload 构建），Vitest 配置（jsdom、globals、setup）。
- `tsconfig.json`、`tsconfig.node.json`：TypeScript 编译选项，包含 electron 源码与 Node 类型。
- `.eslintrc.cjs`：ESLint 规则（TS/React Hooks、Prettier 对齐、vitest globals、忽略 dist/release）。
- `prettier.config.cjs`：格式化规则。
- `.gitignore`：忽略 node_modules/dist/dist-electron/release 等构建产物。
- `README.md`：本地开发与目录速览说明。
- `memory-bank/`：产品、设计、技术、实施计划与进度记录文档。
- `prompts/system-prompt.md`：系统级工作方式约束。

## 当前状态
脚手架运行通畅，lint/test/dev 命令可用，尚未接入业务功能与 UI 设计稿。下一步按实施计划进入目录与配置落地（Tailwind 主题、features 分组等）。 
