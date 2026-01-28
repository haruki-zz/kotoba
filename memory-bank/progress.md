## 2026-01-28 — plan_01 环境与基础框架搭建
- 建立 pnpm workspace，新增 packages/main、packages/renderer、packages/shared、scripts、data 目录骨架。
- 根级配置：package.json 统一脚本，tsconfig.base.json、.eslintrc.cjs、.prettierrc、.gitignore、pnpm-workspace.yaml（onlyBuiltDependencies: esbuild）。
- 环境与示例：.env.example，Fastify starter（/health、/sample-word），共享 Zod schema，Vite+React 占位 UI。
- CI：新增 .github/workflows/ci.yml（checkout → setup-node@20 → corepack → pnpm install --frozen-lockfile → lint → test → build）。
- 运行验证：pnpm install，pnpm lint，pnpm format，pnpm test，pnpm build 均通过。
