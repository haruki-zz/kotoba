# Kotoba 桌面应用脚手架

Electron + Vite + React + TypeScript 的基础工程，后续按 `memory-bank` 中的设计文档迭代日语单词应用。

## 本地开发
- 安装依赖：`npm install`
- 开发模式：`npm run dev`（同时编译主进程、预加载与渲染进程）
- 代码质量：`npm run lint`、`npm run format`
- 测试：`npm run test`
- 打包：`npm run build`（Vite 构建 + electron-builder）

## 目录速览
- `electron/`：主进程与 preload 脚本
- `src/`：渲染进程 React 代码
- `public/`：静态资源
- `memory-bank/`：产品与设计约束文档
