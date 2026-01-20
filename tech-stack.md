# 技术栈选型

## 选型原则
- 需求对照：单人/小规模使用，核心是词条管理 + AI 生成 + SM-2 复习 + 统计展示。
- 简单优先：单仓、单进程模型为主，尽量少层次、少依赖；前后端统一 TypeScript。
- 健壮优先：选成熟生态（React/Vite/Tailwind/Fastify/SQLite/OpenAI），用 Zod 约束输入输出，避免自研基础设施。

## 应用形态
- Electron 桌面端：满足离线/本地数据诉求，减少部署；未来要做 Web 只需复用 Fastify 层替换壳。
- 本地 Fastify API（TypeScript）：作为 Electron 主进程的 API 服务，承载词条 CRUD、SM-2 调度、统计聚合、AI 调用代理。
- 单文件数据库：SQLite（better-sqlite3 驱动）本地落盘，轻量且可靠，适合个人数据量级。

## 前端（Electron Renderer）
- React 18 + TypeScript + Vite：快速开发与热更，满足多页（首页/今日学习/复习/词库/设置）导航。
- UI：Tailwind CSS + shadcn/ui（基于 Radix 的可访问组件），便捷定制 light/dark；图标用 Lucide。
- 路由与数据：React Router 维护多页；TanStack Query 管理 API 数据/缓存/请求状态，避免全局状态库。
- 表单与校验：React Hook Form + Zod（与 API 同构 schema）保障词条/设置表单可靠。
- 图表：Recharts绘制热力图、环形图、折线图。

## 后端（Electron 主进程 + Fastify）
- 框架：Fastify + TypeScript，内置 schema 校验与插件体系，稳定且性能好。
- 数据与模型：SQLite + better-sqlite3（同步、嵌入友好）；通过轻量查询层封装（可选 Drizzle ORM sqlite-driver）保持类型安全与迁移能力。
- 校验：Zod 定义请求/响应/配置 schema，复用到前端类型。
- 业务：服务层实现 SM-2 逻辑、复习队列、统计聚合；AI 生成通过统一 provider 抽象（Gemini，后续可扩展）。

## 开发与质量
- 构建与包：pnpm；ESLint + @typescript-eslint + Prettier；Tailwind 插件维持样式规范。
- 测试：Vitest 覆盖 SM-2 逻辑、API 处理；React Testing Library 做核心交互烟测。
- 打包：Vite + electron-builder（或 vite-plugin-electron）产出跨平台安装包。

## 不采用/延后
- 不上微前端、多数据库、服务网格等复杂架构。
- 暂不引入 Redux/MobX 等重量状态管理；数据以 TanStack Query + 组件局部状态为主。
- 暂不做云后端同步/多端协同，待需求明确后再抽离 Fastify 与 SQLite。
