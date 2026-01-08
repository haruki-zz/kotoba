## 2026-01-08
- 调整 SM-2 记忆程度为 easy/medium/hard 三档（质量分 5/3/1，hard 重置、medium/easy 按公式更新 `ef` ≥ 1.3），同步更新设计、架构、UI、实施与技术文档的描述与示例。

## 2026-01-07
- 完成实施计划第 1 步：使用 electron-vite React + TS 脚手架初始化工程，复制主进程与预加载脚本，添加 electron-builder 配置与图标。
- 配置工具链：补充 Prettier、Vitest、ESLint Prettier 扩展，更新 tsconfig 包含 electron 代码与 Node 类型，添加 npm 脚本（dev/build/lint/test/format）。
- 运行 `npm run lint` 与 `npm run test` 均通过；`npm run dev` 可编译 main/preload/render（命令因守护模式超时退出，日志无报错）。
- 调整测试目录：所有测试文件集中于 `src/__test__`，迁移示例测试并保持 Vitest 通过。
