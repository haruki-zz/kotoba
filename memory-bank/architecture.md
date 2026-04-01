# Kotoba 仓库结构与职责说明（当前快照）

## 1. 架构阶段说明
- 当前已完成实施计划步骤 14；其后 `活動` heat map 已补充到最新交付状态并通过当前用户验证，最近一轮迭代新增了“`活動` 作为默认主界面”的入口调整。此后又新增了 `ui-plan.md`，并完成第 1 步到第 6 步：渲染层 `Tailwind CSS v4 + shadcn/ui` 基础设施接入、应用壳与通用组件落地、五个主页面迁移到独立 feature 组件、页面级重构细则落地、页面状态与 IPC 编排向各自 `*_feature.tsx` 下沉，以及旧样式清理与一致性收尾。
- 仓库处于“新增单词闭环可用 + 草稿机制可用 + 词库管理 CRUD 可用 + 复习闭环可用 + review_logs 基础记录可用 + 活动 heat map 可用且已扩展到 `40` 周跨度 + 活动页固定 `1-5` 级记忆等级统计可用 + 活动页默认主界面可用 + 全日语错误提示可用 + 启动恢复提示可用 + 设置页/API Key 管理可用 + E2E 回归已接入 + UI 基础设施已就绪 + 应用壳与共享 UI 组件已就绪 + 五个主页面已完成 feature 化迁移 + 页面级重构细则已完成 + 页面状态与 IPC 编排边界已完成整理 + 旧 CSS 已清理为全局样式层”阶段。
- 已具备主进程、预加载、渲染层、共享契约、单测与 E2E 的最小闭环。
- 已具备安全基线、JSON 原子写入、备份恢复、迁移、设置与密钥管理、AI Provider、单词新增链路、词库管理链路、复习链路、`review_logs` 基础审计链路、启动恢复提示链路、设置页配置链路。
- 若走产品主线，后续开发入口是 `plan.md` 的 `步骤 15（打包、回归与发布验收）`。
- `ui-plan.md` 的第 `1-6` 步已全部完成；若后续继续做 UI 工作，应按常规增量开发处理，而不是再按未完成专项阶段理解。

## 2. 顶层文件结构与职责
- `AGENTS.md`
  - 仓库协作规范、文档读取顺序、AI 执行约束。
- `plan.md`
  - 实施计划主文档（步骤目标、验收命令、通过指标）。
- `ui-plan.md`
  - `shadcn/ui` UI 重写专项计划。
  - 定义 UI 重写目标、阶段边界、页面迁移顺序与阶段性验收标准。
- `memory-bank/design-doc.md`
  - 产品需求、行为规则与主界面定义的 source of truth。
- `memory-bank/tech-stack.md`
  - 技术栈与默认值快照；实现默认值应与之保持一致。
- `memory-bank/progress.md`
  - 记录步骤完成情况、最新验证结果与下一步入口。
- `memory-bank/architecture.md`
  - 当前仓库结构、模块职责、运行流程与交接要点。
- `package.json`
  - 依赖与脚本入口。
  - 关键脚本：`dev`、`build`、`lint`、`typecheck`、`test:unit`、`test:e2e`、`test`、`verify`、`make:seed-10k`、`bench:search`。
  - `dev:main` 与 `build:main` 使用 `--external:keytar` 以避免原生模块打包错误。
  - `test:e2e` 会先执行 `pnpm build`，再运行 Playwright。
  - 当前已包含渲染层 UI 基础设施依赖：
    - `tailwindcss`
    - `@tailwindcss/vite`
    - `tw-animate-css`
    - `clsx`
    - `tailwind-merge`
- `scripts/`
  - `make_seed_10k.mjs`：生成 1 万词条基准数据。
  - `bench_search.mjs`：执行搜索性能基准并输出 `P50/P95`。
- `pnpm-lock.yaml`
  - 锁定依赖 patch 版本，保证可复现安装结果。
- `components.json`
  - `shadcn/ui` 配置文件。
  - 定义样式方案、全局 CSS 入口、图标库与渲染层别名映射。
- `tsconfig.json`
  - TypeScript 类型检查配置（strict/noEmit）。
  - `include` 覆盖 `src` 与 `tests`，保证测试文件也能做类型检查。
  - 当前补充了 `baseUrl` 与 `@/*` 路径别名，供渲染层组件与 `shadcn/ui` 使用。
- `vite.config.ts`
  - 渲染层构建配置；`base: './'` 以支持 `file://` 加载生产资源。
  - 当前额外接入 `@tailwindcss/vite` 并声明 `@` 路径别名到 `./src`。
- `vitest.config.ts`
  - 单元测试范围配置；仅包含 `tests/unit` 下测试并排除 `e2e/**`。
- `playwright.config.ts`
  - E2E 配置入口；`testDir=./e2e`、单 worker、失败保留 trace。
- `index.html`
  - 渲染层 HTML 入口，挂载 React 根节点。
- `.nvmrc`
  - 本地 Node 版本基线提示文件，当前目标为 `22`。
- `.eslintrc.cjs` / `.prettierrc.json` / `.prettierignore`
  - 代码质量与格式化配置。
- `.husky/pre-commit`
  - 提交前执行 `pnpm lint-staged`。
- `prompts/coding-principles.md`
  - 开发原则约束文档。
- `tests/`
  - 单元测试目录。
  - `tests/unit/main`：主进程相关单测。
  - `tests/unit/shared`：共享 schema 与契约单测。
- `e2e/`
  - Electron 端到端测试目录。
- `test-results/`
  - Playwright 运行结果目录，属于测试产物；除非用户明确要求，否则不应把其中变化当作业务改动的一部分。

## 3. src 目录结构与职责
### 3.1 主进程（`src/main`）
- `main.ts`
  - Electron 主进程入口。
  - 创建窗口并加载渲染页面。
  - 设置安全基线：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。
  - 启动时初始化 `LibraryRepository`、`SettingsRepository`、`WordAddDraftRepository`、共享 `api_key_secret_store`、`WordEntryService`、`LibraryService`、`ReviewService`、`ActivityService` 并注册 IPC。
  - 支持 `KOTOBA_USER_DATA_DIR` 覆盖 `userData` 目录（用于测试隔离）。
- `ipc_router.ts`
  - IPC 统一路由与错误映射。
  - 支持频道：
    - `app:ping`
    - `app:startup-status`
    - `activity:heatmap`
    - `settings:get`
    - `settings:save`
    - `settings:delete-api-key`
    - `word-add:generate`
    - `word-add:save`
    - `word-add:draft:load`
    - `word-add:draft:save`
    - `word-add:draft:clear`
    - `library:list`
    - `library:update`
    - `library:delete`
    - `review:queue`
    - `review:grade`
  - 将业务错误映射为 `APP_API_KEY_MISSING`、`APP_VALIDATION_ERROR`、`APP_GENERATION_FAILED`、`APP_STORAGE_ERROR`、`APP_NOT_FOUND`。
  - 第 13 步补充：把 AI 生成常见失败映射为带恢复引导的日语文案。
- `library_service.ts`
  - 第 10 步核心服务：词库列表/搜索/编辑/删除。
  - 搜索规则：`trim + NFKC + 拉丁小写 + 假名不敏感`，字段范围 `word/reading_kana/meaning_ja`。
  - 编辑规则：字段约束校验 + 日语校验 + 重复单词冲突校验。
- `sm2.ts`
  - 第 11 步核心纯函数模块。
  - 负责 SM-2 的 EF/interval/repetition/time 字段计算，不依赖 IO。
  - 当前额外负责把 `review_state` 映射到固定 `1-5` 级记忆等级（供 `活動` 页面统计使用）。
- `review_service.ts`
  - 第 11 步核心服务：待复习队列读取与评分持久化。
  - 规则：`next_review_at <= now` 入队；“今日完成”按系统本地自然日统计。
  - 第 12 步补充：每次评分追加 `review_log`，并保留最近 `50000` 条。
- `activity_service.ts`
  - 学习活动 heat map 统计服务。
  - 基于 `words.created_at` 与 `review_logs.reviewed_at` 按系统本地自然日聚合最近 `40` 周活动。
  - 额外基于当前 `SM-2` 状态统计固定 `1-5` 级记忆等级分布与百分比。
  - 当前保证返回的记忆等级列表固定包含 `1/2/3/4/5` 五档，即使某一档数量为 `0` 也不会省略。
  - 起点对齐到本地周起始日，用增加展示跨度而不是拉伸格子的方式扩展热力图整体宽度。
  - 输出总活动、活跃天数、当前连续天数、最长连续天数、记忆等级构成与每日强度等级。
- `library_repository.ts`
  - 词库 JSON 仓储。
  - 能力：原子写入、串行写、每日备份、启动恢复、`schema_version` 顺序迁移、失败回滚。
- `settings_repository.ts`
  - 设置 JSON 仓储。
  - 能力：默认设置初始化、原子写入、串行更新。
- `keytar_secret_store.ts`
  - API Key 系统密钥链适配。
  - keytar service/account：`kotoba` / `gemini_api_key`。
  - 支持 `KOTOBA_FAKE_KEYTAR_FILE` 文件型测试桩，用于 E2E 隔离。
- `settings_service.ts`
  - 组装 AI 运行时设置（settings + api key）。
  - 提供设置概览读取、设置保存、API Key 删除能力。
  - API Key 缺失时抛 `SETTINGS_API_KEY_MISSING`。
  - 缺失提示文案与设置校验文案均为纯日语。
- `ai_provider.ts`
  - Provider 抽象与生成输出校验。
  - 能力：四字段 schema 校验、JSON 解析错误分类、非日语输出检测。
- `gemini_provider.ts`
  - Gemini 默认实现。
  - 能力：超时、可重试错误分类、指数退避与重试。
- `word_entry_service.ts`
  - 第 9 步核心服务：生成词卡与保存词条。
  - 保存规则：`word` 按 `trim + NFKC` 判重，命中时直接覆盖旧词条并保留既有 `review_state`。
  - 新词保存时创建初始 `review_state`。
  - 支持 `KOTOBA_FAKE_GENERATE_CARD_JSON` 测试桩（E2E 用）。
  - 第 13 步补充：支持 `KOTOBA_FAKE_GENERATE_ERROR_CODE` 生成失败测试桩。
- `word_add_draft_repository.ts`
  - `単語追加` 单份草稿仓储。
  - 能力：草稿读取、写入、清理；原子写入；基础 schema 校验。

### 3.2 预加载层（`src/preload`）
- `preload.ts`
  - 通过 `contextBridge` 暴露 `window.kotoba.invoke`。
  - 渲染层只能通过白名单 IPC 与主进程通信。

### 3.3 共享契约层（`src/shared`）
- `ipc.ts`
  - IPC 通道常量、请求响应类型、错误码、payload 校验函数。
  - 为 main/preload/renderer 提供统一契约。
  - 第 13 步补充：新增 `app:startup-status` 与 `AppStartupStatusResult`。
  - 第 14 步补充：新增设置相关 IPC 契约与 payload 校验。
  - 后续补充：新增 `activity:heatmap` 与活动 heat map 返回类型。
  - 当前 `ActivityMemoryLevelStat.level` 固定为 `1 | 2 | 3 | 4 | 5`。
- `domain_schema.ts`
  - 领域 schema 与类型定义（`Word`、`ReviewState`、`ReviewLog`、`LibraryRoot`、`Settings`）。
  - 固化 `schema_version=1`、`REVIEW_LOG_RETENTION_LIMIT=50000` 与 AI 字段长度约束。

### 3.4 渲染层（`src/renderer`）
- `main.tsx`
  - React 挂载入口。
- `app.tsx`
  - 当前 UI 主页面。
  - 已实现：
    - 顶层应用壳接入：`AppShell`、`PageHeader`、`AppNavigation`
    - 顶部标签页：`活動`、`単語帳`、`復習`、`単語追加`、`設定`
    - App 启动后默认进入 `活動` 主界面
    - 全局通知统一改为 `StatusMessage`
    - 页面内加载态、空态、成功态、错误态统一复用共享组件
    - 五个主页面视图均已委托给各自 feature 组件
    - 当前只保留页面切换、页面元信息、启动通知与少量壳层状态
    - 不再持有五个业务页面的表单字段、页面级校验或具体 IPC 调用
- `style.css`
  - 当前渲染层全局样式入口。
  - 已接入 `Tailwind CSS v4` 与 `tw-animate-css`。
  - 已定义 `@theme inline` 设计 token、CSS variables、颜色语义与基础 layer。
  - 当前文件已收缩到 `116` 行。
  - 仅保留全局 token、root variables、base layer 与 reset，不再承载页面级视觉规则。
  - 后续若继续扩展样式，应优先使用 utility class；不要把页面局部布局重新回填到这里。
- `components/layout/app_shell.tsx`
  - 应用壳组件。
  - 负责整体背景、页面最大宽度、头部区域、导航区域与内容区域的外层布局。
- `components/layout/app_navigation.tsx`
  - 顶层主导航组件。
  - 基于 `Tabs + ScrollArea` 实现主页面切换入口。
  - 交互语义是 `tab` / `tablist`，不是传统 `button` 导航。
- `components/layout/page_header.tsx`
  - 顶部标题区组件。
  - 负责 App 名称、当前页面标签、标题与说明文案。
- `components/shared/status_message.tsx`
  - 统一的状态提示组件。
  - 负责 `info / success / warning / error` 四类消息的视觉表达。
- `components/shared/empty_state.tsx`
  - 通用空态组件。
- `components/shared/loading_state.tsx`
  - 通用加载态组件。
- `components/shared/confirm_dialog.tsx`
  - 通用确认弹窗组件。
  - 使用 `alertdialog` 语义与 `Escape` 关闭逻辑。
  - 当前用于 `単語帳` 页面删除确认。
- `components/ui/card.tsx`
  - 卡片基元。
  - 当前包含 `Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter`。
- `components/ui/button.tsx`
  - 基础按钮组件。
- `components/ui/input.tsx`
  - 基础单行输入组件。
- `components/ui/textarea.tsx`
  - 基础多行输入组件。
- `components/ui/badge.tsx`
  - 基础标签组件。
- `components/ui/alert.tsx`
  - 警示型提示容器。
- `components/ui/separator.tsx`
  - 分隔线组件。
- `components/ui/scroll_area.tsx`
  - 滚动容器组件，当前供导航区使用。
- `components/ui/tabs.tsx`
  - 标签页组件，当前作为顶层导航的交互底座。
- `features/settings/settings_page.tsx`
  - `設定` 页的页面级 feature 组件。
  - 负责 settings 视图结构，不直接持有 IPC 或业务状态。
  - 通过 props 接收：
    - `form`
    - `has_api_key`
    - `status_message / error_message`
    - `is_loading / is_saving / is_deleting_api_key`
    - `save_disabled / delete_disabled`
    - `on_field_change / on_save / on_delete_api_key`
  - 当前使用 `Card` 拆成“生成既定值”和“API キー管理”两个区域，并保留原有可访问标签与文案。
- `features/settings/settings_feature.tsx`
  - `設定` 页的容器组件。
  - 持有设置表单状态、加载/保存/删除状态、本地整数校验与设置相关 IPC 编排。
  - 负责把 `SettingsGetResult` 映射到页面表单结构，并将业务结果转换为日语状态提示。
- `features/word_add/word_add_page.tsx`
  - `単語追加` 页的页面级 feature 组件。
  - 负责输入区、生成结果区、操作按钮区与状态提示的布局。
  - 保留草稿自动保存、生成、保存等行为所需的 props 接口，但自身不直接发起 IPC。
- `features/word_add/word_add_feature.tsx`
  - `単語追加` 页的容器组件。
  - 持有草稿字段、生成/保存状态、草稿恢复状态与成功/错误提示。
  - 负责 `800ms` 防抖自动保存、卸载前保存、`beforeunload` 保存、AI 生成 IPC 与保存后清理草稿。
- `features/library/library_page.tsx`
  - `単語帳` 页的页面级 feature 组件。
  - 负责搜索栏、统计摘要、词条列表、行内编辑表单与删除确认弹窗。
  - 删除确认通过 `ConfirmDialog` 实现，避免依赖原生确认框。
  - 当前页面视觉已主要由 utility class 表达；`library_item` 仅作为 E2E 定位标记保留。
- `features/library/library_feature.tsx`
  - `単語帳` 页的容器组件。
  - 持有查询词、列表数据、编辑态、删除确认态、更新中状态与列表刷新逻辑。
  - 负责 `library:list`、`library:update`、`library:delete` 的 IPC 编排与编辑/删除状态收口。
- `features/review/review_page.tsx`
  - `復習` 页的页面级 feature 组件。
  - 负责摘要卡、当前复习卡、评分按钮组、空态与状态提示。
  - `review_due_stat / review_completed_stat / review_word` 等稳定类名仅服务当前 E2E 断言。
  - 视觉层已主要改为 utility class + `shadcn/ui` primitives 组合。
- `features/review/review_feature.tsx`
  - `復習` 页的容器组件。
  - 持有待复习队列、今日完成统计、评分中状态与复习结果提示。
  - 负责初始加载复习队列、发送评分 IPC，并在评分成功后刷新队列。
- `features/activity/activity_page.tsx`
  - `活動` 页的页面级 feature 组件。
  - 负责摘要卡、记忆等级构成、heat map 外围布局与空态/错误态。
  - heat map 本体继续使用自定义渲染，不依赖图表库。
  - heat map 格子颜色、尺寸与布局现在由组件内显式 class 组合控制，不再依赖 `style.css` 页面级类名。
  - `activity_summary_card / activity_memory_level_card` 仅作为 E2E 定位标记保留。
- `features/activity/activity_feature.tsx`
  - `活動` 页的容器组件。
  - 持有 heat map 数据、加载态与错误态。
  - 负责初次渲染后的 `activity:heatmap` IPC 调用与结果注入。
- `lib/utils.ts`
  - 渲染层共享工具。
  - 当前仅提供 `cn()`，用于组合 `clsx` 与 `tailwind-merge`，供后续 `shadcn/ui` 组件使用。
- `window.d.ts`
  - `window.kotoba` 类型定义。

### 3.5 当前渲染层 UI 基础设施状态
- 已完成：
  - `Tailwind CSS v4` 接入
  - `@tailwindcss/vite` 插件接入
  - `shadcn/ui` 配置文件落地
  - `@/*` 路径别名与 `cn()` 工具函数落地
  - `src/renderer/components/ui` 通用 primitives 落地
  - `AppShell`、主导航、标题区、共享状态组件落地
  - `src/renderer/features/*` 五个页面级 feature 组件全部落地
  - 页面级重构细则已完成，并通过当前用户验证
  - 页面状态、表单校验与 IPC 编排已下沉到各自 `*_feature.tsx`
  - `src/renderer/app.tsx` 已收缩为应用壳与页面切换入口
  - 旧样式清理与一致性收尾已完成
  - `src/renderer/style.css` 已缩减为全局样式层
- 因此当前 UI 实际运行方式仍是：
  - 顶层壳层与共享控件已切到 `shadcn/ui` 风格
  - 五个主页面的结构渲染与页面业务状态都已拆到各自 feature 组件
  - `App` 只负责页面壳层、导航与启动通知
  - 页面细节视觉主要在各自页面组件内通过 utility class 表达
  - 少量保留类名仅服务 E2E 断言，不再承担视觉样式职责
  - 因此当前可以把 `ui-plan.md` 视为已完成

## 4. 测试文件结构与职责
### 4.1 单元测试（Vitest）
- `tests/unit/shared/domain_schema.test.ts`
  - 领域 schema 校验测试。
- `tests/unit/main/library_repository.repository.test.ts`
  - 并发更新串行化测试。
- `tests/unit/main/library_repository.backup.test.ts`
  - 每日备份触发规则测试。
- `tests/unit/main/library_repository.recovery.test.ts`
  - 启动损坏恢复测试。
- `tests/unit/main/library_repository.migration.test.ts`
  - 迁移成功路径测试。
- `tests/unit/main/library_repository.rollback.test.ts`
  - 迁移失败回滚测试。
- `tests/unit/main/settings_repository.test.ts`
  - 设置默认值、更新、设置概览/API Key 删除与缺失引导测试。
- `tests/unit/main/keytar_secret_store.test.ts`
  - keytar/文件型密钥存取删与 API Key 不落盘测试。
- `tests/unit/main/gemini_provider_ai_provider.test.ts`
  - Gemini 正常输出路径测试。
- `tests/unit/main/gemini_provider_ai_retry.test.ts`
  - Gemini 重试/退避与非日语自动重试测试。
- `tests/unit/main/library_service.test.ts`
  - 搜索标准化与词库编辑/删除行为测试。
- `tests/unit/main/sm2.test.ts`
  - SM-2 算法顺序、EF 下限、评分 `0-5` 覆盖测试。
  - 额外覆盖固定 `1-5` 级记忆等级映射。
- `tests/unit/main/review_queue.test.ts`
  - 待复习队列、本地时区今日统计、评分持久化测试。
- `tests/unit/main/review_logs.test.ts`
  - 评分后写入 `before_state/after_state/grade/reviewed_at` 的测试。
- `tests/unit/main/log_retention.test.ts`
  - `review_logs` 超过 `50000` 条时淘汰最旧记录的测试。
- `tests/unit/main/activity_service.test.ts`
  - 活动 heat map 的本地自然日聚合、范围裁剪、连续天数与固定 `1-5` 级记忆等级统计测试。

### 4.2 端到端测试（Playwright + Electron）
- `e2e/word_add.spec.ts`
  - 覆盖用例：
    - `word-create`：新增词条、重启后持久化、保存后草稿清理
    - `draft`：输入后防抖自动保存可恢复
    - `draft`：切页前强制保存可恢复
    - `duplicate-word`：`trim + NFKC` 判重覆盖
    - `library-crud`：词库列表/搜索/编辑/删除
    - `review-flow`：复习页评分与 `review_state` 持久化
    - `activity-heatmap`：活动页按当日新增 + 复习展示最近 `40` 周 heat map，并校验固定 `1-5` 级记忆等级统计
    - `settings`：设置页保存、API Key 更新/删除、重启后回读
    - `i18n-ja`：主页面、标签、按钮、搜索占位、删除确认弹窗均为日语
    - `error-handling`：API Key 缺失/无效、网络失败、超时、损坏回退提示
  - 当前额外包含一个基于 `tab` 导航的页面切换辅助函数，用于隔离“默认主界面是 `活動`”与新导航语义，避免 E2E 用例对初始页面和 DOM 角色产生隐式耦合。
  - 使用临时 `userData` 目录与 `KOTOBA_FAKE_KEYTAR_FILE`，避免污染本地真实数据与钥匙串。

## 5. 当前运行流程（步骤 14 完成后 + `活動` 主界面快照）
1. `pnpm dev` 启动 Vite、main/preload watch、Electron。
2. 渲染层通过 `window.kotoba.invoke` 调用 IPC。
3. 主进程 `ipc_router` 校验 channel/payload 后分发到 `WordEntryService`、`WordAddDraftRepository`、`LibraryService`、`ReviewService`、`ActivityService` 与设置服务。
4. 启动提示流程：
   - `LibraryRepository.initialize_on_startup()` 返回 `ok/created/recovered/migrated`。
   - 主进程把 `recovered/migrated` 转换为 `app:startup-status` 的日语通知。
   - 渲染层启动时读取该状态，并在页面顶部显示通知。
5. 主界面入口流程：
   - `src/renderer/app.tsx` 初始 `active_page` 固定为 `activity`。
   - `src/renderer/features/activity/activity_feature.tsx` 在初次渲染后立即请求 `activity:heatmap`。
   - 用户首次进入应用时优先看到活动摘要、heat map 与记忆等级构成，而不是 `単語追加` 表单。
6. 生成流程：
   - 若未配置 API Key，返回 `APP_API_KEY_MISSING`。
   - 若 API Key 无效、网络失败、超时、429、解析失败，则返回日语错误提示，并保留当前输入。
   - 若配置有效，`src/renderer/features/word_add/word_add_feature.tsx` 调用 Gemini 生成并回填四字段。
7. 保存流程：
   - 执行字段校验与日语校验。
   - 按 `word(trim + NFKC)` 判重，命中则覆盖，否则新增。
   - 成功后由 `src/renderer/features/word_add/word_add_feature.tsx` 清理草稿文件。
8. 词库管理流程：
   - `library:list`：返回按 `updated_at` 倒序的词条列表，并按规范执行搜索标准化匹配。
   - `library:update`：更新词条字段并保留 `review_state`，发生冲突返回可定位错误。
   - `library:delete`：按 `word_id` 删除词条并更新 `updated_at`，渲染层删除确认由 `LibraryFeature + ConfirmDialog` 承接。
9. 设置流程：
  - `settings:get`：返回当前 `provider / model / timeout / retries` 与 `has_api_key`。
  - `settings:save`：保存非敏感设置；若提交了新的 API Key，则写入密钥存储且不回显。
  - `settings:delete-api-key`：删除 API Key，并使后续生成恢复为“未设置”引导错误。
10. 复习流程：
  - `review:queue`：返回所有 `next_review_at <= now` 的词条，并统计本地自然日内已完成词条数。
  - `review:grade`：按 SM-2 纯函数计算新 `review_state`，追加一条 `review_log`，并立即持久化到词库。
  - `review_logs` 保留最近 `50000` 条，超限时删除最旧记录。
11. 活动 heat map 流程：
  - `activity:heatmap`：读取词库后基于 `words.created_at` 与 `review_logs.reviewed_at` 按本地自然日聚合最近 `40` 周活动。
  - 主进程同时基于 `review_state` 计算固定 `1-5` 级记忆等级分布。
  - 渲染层展示总活动、活跃天数、连续天数、固定 `1-5` 级记忆等级卡片与按强度分级的日历格。
  - 当前渲染不显示 hover 详情弹窗或原生 tooltip，以避免界面闪烁。

## 6. 当前交接重点
- 当前已通过用户确认的最新 UI 状态是：`ui-plan.md` 第 `6` 步已经完成并通过验证；`ui-plan.md` 的第 `1-6` 步均已完成。
- 若当前目标是 UI 重写，不要把页面状态、表单校验和 IPC 编排重新塞回 `src/renderer/app.tsx`；当前这些职责已经正式下沉到各自 `*_feature.tsx`。
- 当前 `Tailwind CSS v4 + shadcn/ui` 已完成基础设施接入、应用壳收口、页面 feature 化、页面状态边界整理以及旧样式清理；后续工作不应再按“UI 重写专项未完成”来判断。
- 当前 `src/renderer/components/ui`、`src/renderer/components/layout`、`src/renderer/components/shared` 已是后续 UI 重写的正式落点，新增通用控件应优先放入这些目录。
- 当前 `src/renderer/features/*` 已形成统一的 `feature + page` 分层；后续新增页面逻辑应优先写入 `*_feature.tsx`，纯展示结构写入 `*_page.tsx`。
- 若后续修改 `単語帳`、IPC 契约、词库存储或搜索规则，必须同步更新对应单测、E2E 与 `memory-bank` 文档。
- 当前 `単語帳` 已不是占位页，任何后续 AI 开发者都应将其视为已稳定实现的基础能力。
- 当前 `復習` 页面已在不破坏既有评分与队列行为的前提下补齐 `review_logs` 基础记录。
- 当前第 13 步新增的全局启动提示与日语错误提示不应在后续步骤中被回退。
- 当前第 14 步新增的 `設定` 页面、设置 IPC 与 API Key 不回显规则不应在后续步骤中被回退；步骤 15 主要应聚焦打包与最终回归。
- `設定` 页现在已经是 `SettingsFeature + SettingsPage` 双层结构；后续不要再把整页 JSX 或设置状态回填进 `App`。
- 当前 `活動` 页面已确定采用“固定格子尺寸 + `40` 周跨度 + 无 hover 详情窗 + 固定 `1-5` 级记忆等级卡片”的实现方向，后续不应回退到原始 `repetition` 裸展示或会闪烁的浮层方案。
- 当前首页信息架构也已确定为“先看 `活動`，再进入 `単語追加` / `復習` / `単語帳` 做操作”，后续若要调整必须同步修改 E2E 的初始页面假设。
- 当前主导航采用 `Tabs` 语义；若后续维护 Playwright，用例选择器应优先匹配 `role=tab`，不要再默认导航项是 `button`。
- 当前 `src/renderer/style.css` 不再包含页面级旧类名；若后续需要测试定位器，可保留稳定 class，但不要让这些 class 再次承担视觉样式职责。

## 7. 当前质量门禁流程
1. 代码质量：`pnpm lint`、`pnpm format:check`、`pnpm typecheck`。
2. 单元测试：`pnpm test`（实际执行 `pnpm test:unit`，仅覆盖 `src`）。
3. E2E 测试：`pnpm exec playwright test -g "word-create|draft|duplicate-word|library-crud|review-flow|activity-heatmap|settings|i18n-ja|error-handling"`。
4. 提交门禁：`husky pre-commit -> pnpm lint-staged`。

## 8. memory-bank 文档职责
- `memory-bank/design-doc.md`
  - 需求与行为规则的 source of truth。
- `memory-bank/tech-stack.md`
  - 技术选型与默认值快照。
- `memory-bank/progress.md`
  - 执行进度、验证证据、下一步入口。
- `memory-bank/architecture.md`
  - 文件结构、模块职责与运行流程（本文档）。

## 9. UI 重写专项文件职责
- `ui-plan.md`
  - UI 重写阶段边界与迁移顺序的 source of truth。
- `components.json`
  - `shadcn/ui` 代码生成与路径映射配置。
- `src/renderer/components/ui/*.tsx`
  - `shadcn/ui` 基础控件层。
- `src/renderer/components/layout/*.tsx`
  - 应用壳、主导航、标题区等布局层。
- `src/renderer/components/shared/*.tsx`
  - 共享状态与通用展示层。
- `src/renderer/style.css`
  - 当前 Tailwind 全局入口与全局样式层。
- `src/renderer/lib/utils.ts`
  - `cn()` 工具函数；后续所有 `shadcn/ui` 组件应复用此文件。

## 10. 信息流更新规则
- 需求或行为变更：先更新 `design-doc.md`，再同步 `tech-stack.md`。
- 每完成一个实施步骤：更新 `progress.md`。
- 文件结构或职责变化：同步更新 `architecture.md`。
