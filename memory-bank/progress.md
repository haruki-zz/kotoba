# 进度记录

## 2026-01-21

- 搭建 pnpm workspace 骨架：创建 packages/main、packages/renderer、packages/shared 及 data、scripts、docs；配置共享 tsconfig（base + references + eslint 用），每包添加 composite tsconfig 与占位 src 入口。
- 工具链与脚本：根级 package.json 写入 dev/build/lint/format/test/typecheck、postinstall 安装 simple-git-hooks（pre-commit 执行 lint + format:check + test）；安装 ESLint flat config、Prettier、Vitest、TypeScript 等依赖。
- 规范与环境：新增 .env.example（OPENAI_API_KEY/GEMINI_API_KEY/DATABASE_PATH）、.gitignore/.prettierignore 与 docs/engineering.md 说明工程规范；更新 architecture.md 记录当前结构与 words 表 schema。
- 问题修复：调整 lint 范围与忽略 dist 产物，避免 @typescript-eslint/parser 对编译输出报缺失 tsconfig。

## 2026-01-21（数据模型与数据库）

- 共享 Schema：在 packages/shared/src/schemas 下定义 word/review/settings/ai Zod schema 及 SM-2 常量（sm2.ts），通过 index.ts 汇出；补充 workspace 出口与 package 元信息。
- 数据层：在 packages/main/src/db 搭建 config/connection/migrator/migrations/0001_init（words 表+索引）/word-repository（CRUD+过滤+分页）/word-mapper/transaction/setup（initializeDatabase）并依赖 @kotoba/shared。
- 文档：新增 docs/data-model.md（字段与 schema 说明）、docs/data-testing-plan.md（测试计划），更新 memory-bank/architecture.md 记录文件作用与默认值。
- 校验：运行 pnpm typecheck、pnpm test（暂无用例）；清理误生成的 src 下 .js/.d.ts 产物。

## 2026-01-22（主进程 API 与 ESM 兼容）

- 主进程 Fastify：新增 server 模块（app/config/plugins/routes/services/standalone）提供健康检查、词条 CRUD、复习队列/提交/撤销、统计摘要、设置读写；引入 CORS + Bearer 校验（http 模式）、按读写的限流、统一错误格式与 Zod 校验。
- 运行脚本：packages/main dev 现在编译后启动 standalone（API_MODE=http 默认），支持 env 配置 host/port/cors/token；添加 settings.json 本地持久化。
- ESM 规范：为 Node ESM 运行修复所有相对导入/导出为显式 .js 扩展，并修正目录引用到 index 文件，解决 pnpm dev 的 ERR_MODULE_NOT_FOUND。
- 校验：通过 pnpm --filter @kotoba/main lint/build、pnpm --filter @kotoba/shared lint/build，运行 pnpm test（暂无用例）；手动 smoke 启动 API_PORT=0 node dist/server/standalone.js 正常监听后退出。

## 2026-01-22（SM-2 算法与复习队列）

- SM-2 核心：在 packages/shared/src/sm2.ts 增加 computeSm2Review 纯函数（quality 映射、EF 更新、间隔计算、UTC 加天、最小 1 天），补充类型与测试。
- 复习服务：packages/main/src/server/services/review-service.ts 接入 SM-2 计算，更新 ef/interval/repetition/last/next 与 difficulty，缓存队列与指针，支持幂等提交检测与单步撤销回滚队列。
- 测试与配置：新增 Vitest 单元测试（shared 的 SM-2 逻辑，main 的队列/撤销/幂等），根级 vitest.config.ts 将 @kotoba/shared 指向源码；tsconfig 排除测试路径避免打包。
- 构建链路：main 包 build 改为 tsc -b，确保依赖的 shared 先行编译；pnpm --filter @kotoba/main run build 通过。

## 2026-01-22（AI 生成与 Provider 抽象）

- 抽象与配置：在 packages/main/src/server/ai 下新增 prompt（统一 JSON 输出提示）、audit（长度/安全检查）、config（env 解析与默认模型）、types/base（Normalized 请求与 Provider 接口）、service（超时、重试、降级、审计封装）。
- Provider 适配：实现 Gemini/OpenAI 官方 SDK 封装及 Mock provider，支持按设置/请求选择 provider，缺省回退顺序，超时自动 abort。
- API：新增 /api/v1/ai/generate-word 路由，使用共享 schema 校验并返回 provider/output/latency；限流增加 ai bucket；context 注入 aiService。
- 共享 schema：aiGenerateWordRequest provider 改为可选；默认 aiProvider 设为 gemini；新增 env 示例（OPENAI_MODEL/GEMINI_MODEL/AI_REQUEST_TIMEOUT_MS）。
- 依赖与测试：main 包加入 @google/genai、openai；添加 Vitest 用例覆盖 provider 降级与审计失败路径；lint/typecheck/test 通过。

## 2026-01-23（plan_06 渲染端基础框架与设计体系）

- 渲染端工具链：packages/renderer 迁移为 Vite 入口（index.html、src/main.tsx），新增 vite.config.ts（alias @kotoba/shared、端口 5173）、tailwind.config.ts/postcss.config.cjs（设计令牌注入），tsconfig/tsconfig.eslint.json 补充 Vite 类型与路径。
- 主题与样式：tokens.css 定义 light/dark 色板、阴影、圆角、字体与背景光晕；global.css 引入 Tailwind base/utility 与焦点/选区样式；ThemeProvider 支持 system/light/dark 解析并写入 dataset/color-scheme；Zustand UI store 持久化主题与侧栏状态。
- 布局与导航：AppShell/TopBar/Sidebar 组合左侧导航、顶部信息与快捷键（Cmd/Ctrl+B 折叠菜单、Cmd/Ctrl+J 切换主题）、移动端遮罩与 Skip link；routes.tsx 使用 HashRouter 挂载首页、今日学习、复习、词库、设置；providers.tsx 聚合 ThemeProvider 与 toast。
- UI 与动效：按钮/徽标/卡片/输入/选择/多行输入、导航链接、PageHeader、主题切换器、Framer Motion 淡入预设、sonner Toaster，统一色板与交互状态。
- 数据与表单基线：api-client.ts + use-api.ts 封装 fetch 与错误 toast；use-zod-form.ts 提供 Zod + RHF 组合；settings 页示例表单（主题偏好/复习批量/例句风格）带校验与提交提示。
- 页面占位：home/today/review/library/settings 以卡片文案说明即将接入的复习队列、AI 生成、过滤与设置等流程，为后续 API 接线留出骨架。
- 校验：pnpm lint、pnpm format:check、pnpm test、pnpm typecheck 通过；提交 “build renderer layout and theme baseline”。
