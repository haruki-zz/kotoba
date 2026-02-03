# Kotoba

基础环境与工程脚手架（plan_01）。

## 快速开始

```bash
pnpm install
pnpm dev       # Vite 开发服务器（渲染层占位）
pnpm lint      # ESLint 检查
pnpm format    # Prettier 格式化
pnpm typecheck # TypeScript 主/渲染双向类型检查
pnpm test      # Vitest（当前为占位用例）
pnpm build     # 类型检查 + Vite 构建输出 dist/renderer
```

## 目录约定
- `src/main`：Electron 主进程 / Fastify API 占位
- `src/renderer`：React + Vite 渲染层
- `src/shared`：复用的类型与未来的 Zod schema
- `data/`：本地 SQLite 文件（已忽略提交）
- `scripts/`：自动化脚本占位

## 环境变量
复制 `.env.example` 为 `.env.local`，填写 `OPENAI_API_KEY` / `GEMINI_API_KEY` 等敏感信息；`DATABASE_PATH` 默认 `./data/kotoba.sqlite`。
