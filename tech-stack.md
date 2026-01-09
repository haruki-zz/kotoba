# 技术栈选择

- 桌面容器：Electron（稳定跨平台、生态成熟），前端打包采用 Vite，最终使用 electron-builder 打包分发。
- 前端框架：React + TypeScript，页面路由可用 React Router（仅在需要多视图时启用），状态以 React hooks/Context 管理，保持轻量。
- 样式体系：Tailwind CSS（遵循设计文档指定的原子类风格），配合少量自定义 CSS 变量统一色彩与阴影。
- 数据持久化：Node.js `fs/promises` 直接读写本地 JSON 文件（`words.json`、`activity.json`），封装读写助手以确保原子写入与错误处理。
- AI 调用：通过官方提供的 Node SDK，在 Electron 主进程封装接口，经 `contextBridge` 暴露给渲染进程。
- 算法与可视化：SM-2 逻辑使用纯 TypeScript 实现；统计图（Heat Map、扇形比例）优先使用原生 SVG/Canvas 手绘，避免额外图表依赖。
