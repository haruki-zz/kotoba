# 技术栈选型

## 原则

- 简单优先：单仓、单应用，前后端统一 TypeScript；使用根级单一 package（禁止 monorepo/workspace），按 `src/main`（Electron+Fastify）、`src/renderer`（React/Vite）、`src/shared`（Zod schema）拆分目录，避免巨石文件，所有依赖安装在根级 `node_modules`。
- 健壮优先：成熟生态（Electron、Fastify、SQLite、React、Vite、Tailwind、shadcn/ui、Framer Motion、Zustand、Zod），尽量少自研基础设施。
- 贴合需求：词条管理 + AI 生成 + SM-2 复习 + 统计反馈；首发桌面端，后续可平滑转 Web。

## 应用形态

- Electron 壳：提供跨平台桌面端与本地存储；主进程托管 Fastify API、AI 调用与 SQLite 访问。
- 渲染进程：React 18 + Vite + TypeScript，使用 Tailwind CSS + shadcn/ui 构建 Home/Today/Review/Library/Settings 页面；Framer Motion 负责关键动效（进场/切换）。
- 本地数据：`data/kotoba.sqlite`（gitignore）。驱动选 `better-sqlite3`，稳定且零守护进程。

## 前端（src/renderer）

- UI：Tailwind CSS + shadcn/ui（Radix 底座）；图标用 Lucide。
- 状态：Zustand 管理 UI/本地交互状态（弹窗、筛选、队列进度）；数据获取用原生 fetch + 轻量缓存（可选 TanStack Query，若需要请求层缓存与失效处理）。
- 表单与校验：React Hook Form + Zod（复用 shared schema）确保词条/设置填写可靠。
- 动效：Framer Motion 用于页面切换、卡片滑动、进度条/提示过渡。

## 主进程与 API（src/main）

- 框架：Fastify + TypeScript，插件化路由；内置 JSON schema 校验。
- 数据：SQLite + better-sqlite3；可选轻量迁移/类型层 Drizzle sqlite-driver，保持简洁。
- 业务：封装 SM-2 逻辑、复习队列、词条 CRUD、统计聚合；AI 生成统一 provider 抽象（如 OpenAI/Gemini）。

## 共享与类型（src/shared）

- Zod schema 定义词条、设置、AI 生成入参/出参、SM-2 记录；同时生成 TypeScript 类型供前后端复用。

## 数据库 schema（SQLite）

- `words`：`id` INTEGER PK、`word` TEXT、`reading` TEXT、`context_expl` TEXT、`scene_desc` TEXT、`example` TEXT、`difficulty` TEXT、`ef` REAL（默认 2.5）、`interval_days` INTEGER、`repetition` INTEGER、`last_review_at` TEXT（ISO）、`next_due_at` TEXT（ISO）、`created_at` TEXT、`updated_at` TEXT。
- 未来扩展字段（延后）：`source`、`tags`、`pos` 等不入库，待需求明确再迁移。

## 工具链与质量

- 包管理：pnpm（单包模式，无 workspace；所有 node_modules 在根目录）；格式/检查：ESLint + @typescript-eslint + Prettier；单元测试：Vitest；UI 测试：React Testing Library（核心交互）。
- 打包：Vite + electron-builder（或 vite-plugin-electron）；环境变量 `.env.local` 管理 AI Keys。

## 不采纳/暂缓

- 不做微前端、多服务拆分、云数据库；保持单机本地优先。
- 暂不上 Redux/MobX 等重量状态库；Zustand + 轻量数据获取足够。
- 云同步/多人协作/导入导出暂缓，后续再为 Fastify 增加远端存储与迁移。
