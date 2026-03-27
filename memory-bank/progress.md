# Kotoba 开发进度记录

## 1. 当前状态
- 记录日期：`2026-03-28`
- 当前阶段：实施计划 `步骤 1` 到 `步骤 14` 已完成，且其后活动 heat map 已完成用户验证通过的补充迭代；最新一轮迭代已将 `活動` 调整为默认主界面。此后已新增 `ui-plan.md`，并完成其中第 `1` 步与第 `2` 步：`Tailwind CSS v4 + shadcn/ui` 基础设施接入，以及 `AppShell + 通用 UI 组件` 落地。
- 项目形态：已从“可运行壳工程”推进到“可新增单词并持久化 + 草稿自动保存 + 词库管理 CRUD + 复习闭环可用 + review_logs 基础记录可用 + 活动 heat map 可用且已扩展到 `40` 周跨度 + 活动页固定 `1-5` 级记忆等级统计可用 + 活动页作为默认主界面 + 全日语错误提示与启动恢复提示可用 + 设置页/API Key 管理可用 + E2E 可回归 + 渲染层已具备 Tailwind/shadcn 迁移前置条件 + 应用壳与共享 UI 组件已完成”阶段。

## 2. 已完成事项
### 2.1 对应 plan.md 步骤 1（环境与版本基线冻结）
- 完成版本基线冻结：
  - `Node.js` 目标：`22 LTS`
  - `pnpm` 目标：`9.x`
  - 依赖主版本：`electron@40.x`、`typescript@5.x`、`react@19.x`、`vite@7.x`
- 新增/更新版本相关文件：
  - 根目录 `package.json`（`engines`、`packageManager`、版本校验脚本）
  - 根目录 `.nvmrc`（值：`22`）
  - 根目录 `pnpm-lock.yaml`（锁定 patch 解析结果）
- 同步文档：
  - `memory-bank/design-doc.md` 升级到 `v0.4`
  - `memory-bank/tech-stack.md` 同步 `pnpm` 基线与锁定策略

### 2.2 对应 plan.md 步骤 2（项目脚手架与安全基线）
- 已创建应用骨架目录：
  - `src/main`
  - `src/preload`
  - `src/renderer`
  - `src/shared`
- 已实现 Electron 安全基线：
  - `contextIsolation: true`
  - `sandbox: true`
  - `nodeIntegration: false`
- 已实现 IPC 白名单与参数校验入口：
  - 单一桥接通道：`kotoba:invoke`
  - 初始白名单频道：`app:ping`
  - 统一错误码：`IPC_ENVELOPE_INVALID`、`IPC_CHANNEL_NOT_ALLOWED`、`IPC_PAYLOAD_INVALID`、`IPC_INTERNAL_ERROR`
- 已补齐步骤 2 所需工程脚本：
  - `pnpm dev`
  - `pnpm lint`
  - `pnpm typecheck`

### 2.3 对应 plan.md 步骤 3（工程质量门禁）
- 已补齐质量工具链：
  - `prettier`
  - `husky`
  - `lint-staged`
- 已新增/更新质量门禁配置：
  - `package.json` 新增 `format`、`format:check`、`verify`、`prepare`
  - `package.json` 新增 `lint-staged` 规则
  - 新增 `.prettierrc.json` 与 `.prettierignore`
  - 新增 `.husky/pre-commit`（执行 `pnpm lint-staged`）

### 2.4 对应 plan.md 步骤 4（领域模型与 Schema 固化）
- 已新增领域模型与 schema 文件：
  - `src/shared/domain_schema.ts`
  - 覆盖 `Word`、`ReviewState`、`ReviewLog`、`LibraryRoot`、`Settings`
- 已使用 `zod` 固化字段约束：
  - AI 四字段长度上限：`reading_kana 1-32`、`meaning_ja 8-120`、`context_scene_ja 12-160`、`example_sentence_ja 8-80`
  - `schema_version` 固定为 `1`
  - UTC ISO 8601 时间格式约束（`...Z`）
- 已新增 schema 单测：`tests/unit/shared/domain_schema.test.ts`

### 2.5 对应 plan.md 步骤 5（JSON 存储与原子写入）
- 已新增仓储实现：`src/main/library_repository.ts`
- 已实现能力：
  - 临时文件写入 + `rename` 原子替换
  - 串行写队列
  - 每日首次写入备份
  - 启动损坏检测与最近有效备份回退
- 已新增步骤 5 单测：
  - `tests/unit/main/library_repository.repository.test.ts`
  - `tests/unit/main/library_repository.backup.test.ts`
  - `tests/unit/main/library_repository.recovery.test.ts`

### 2.6 对应 plan.md 步骤 6（迁移机制）
- 已扩展仓储启动流程：
  - 主文件存在且非当前 schema 时，先识别 `schema_version` 再执行顺序迁移（当前已落地 `v0 -> v1`）
  - 迁移前强制备份
  - 迁移失败自动回滚
- 已新增步骤 6 单测：
  - `tests/unit/main/library_repository.migration.test.ts`
  - `tests/unit/main/library_repository.rollback.test.ts`

### 2.7 对应 plan.md 步骤 7（设置模块与密钥管理）
- 已新增设置仓储：`src/main/settings_repository.ts`
- 已新增 keytar 密钥适配层：`src/main/keytar_secret_store.ts`
- 已新增设置服务：`src/main/settings_service.ts`
- 已实现能力：
  - 默认设置自动生效并落盘（`gemini-2.5-flash`、`15s`、`retries=2`）
  - API Key 使用系统密钥链存储，不进入 JSON
  - API Key 缺失时抛出可引导错误
- 已新增步骤 7 单测：
  - `tests/unit/main/settings_repository.test.ts`
  - `tests/unit/main/keytar_secret_store.test.ts`

### 2.8 对应 plan.md 步骤 8（AI Provider 抽象与 Gemini 接入）
- 已新增 Provider 抽象：`src/main/ai_provider.ts`
- 已新增 Gemini 实现：`src/main/gemini_provider.ts`
- 已实现能力：
  - 四字段 JSON 解析 + schema 双重校验
  - 超时控制
  - `500ms -> 1500ms` 指数退避（含 jitter）
  - 非日语输出自动重试（计入 `retries`）
- 已新增步骤 8 单测：
  - `tests/unit/main/gemini_provider_ai_provider.test.ts`
  - `tests/unit/main/gemini_provider_ai_retry.test.ts`

### 2.9 对应 plan.md 步骤 9（单词新增页与草稿机制）
- 已新增主进程能力：
  - `src/main/word_entry_service.ts`
    - 生成与保存单词入口
    - 判重规则：`trim + NFKC`（忽略 `reading_kana`）
    - 重复词命中时直接覆盖并返回 `既存の単語を更新しました`
    - 新词保存时初始化 `review_state`
  - `src/main/word_add_draft_repository.ts`
    - 单份草稿读写与清理
    - 原子写入
- 已扩展 IPC 契约与路由：
  - `src/shared/ipc.ts`
  - `src/main/ipc_router.ts`
  - 新增频道：`word-add:generate`、`word-add:save`、`word-add:draft:load`、`word-add:draft:save`、`word-add:draft:clear`
- 已完成主进程 wiring：
  - `src/main/main.ts` 启动时初始化 `library/settings/draft` 仓储并注入路由
- 已完成渲染层页面：
  - `src/renderer/app.tsx`
  - `src/renderer/style.css`
  - 页面：`単語追加` + `単語帳(占位)`
  - 交互：输入 -> 生成 -> 编辑 -> 保存
  - 草稿：`800ms` 防抖保存、切页强制保存、窗口关闭前保存、保存成功清理

### 2.10 第 9 步的测试与稳定性补齐
- 已新增 E2E 测试基础设施：
  - `playwright.config.ts`
  - `e2e/word_add.spec.ts`
  - `package.json` 新增脚本：`test:e2e`
  - 依赖新增：`@playwright/test`
- 已修复运行/测试边界问题：
  - `vite.config.ts` 新增 `base: './'`，支持生产模式下 `file://` 资源加载
  - `package.json` 的 `dev:main/build:main` 增加 `--external:keytar`，避免 `.node` 打包错误
  - `src/main/main.ts` 支持 `KOTOBA_USER_DATA_DIR`（E2E 隔离数据目录）
  - `src/main/word_entry_service.ts` 支持 `KOTOBA_FAKE_GENERATE_CARD_JSON`（E2E 固定生成桩）
  - 新增 `vitest.config.ts`，确保 `pnpm test` 只跑 `src` 下单测，不误跑 `e2e`

### 2.11 对应 plan.md 步骤 10（词库管理页：列表/搜索/编辑/删除）
- 已新增主进程词库服务：
  - `src/main/library_service.ts`
  - 能力：
    - 列表与搜索（`word / reading_kana / meaning_ja`）
    - 搜索标准化：`trim + Unicode NFKC + 拉丁小写 + 假名不敏感`
    - 词条编辑（含字段校验、日语校验、重复单词冲突校验）
    - 词条删除（按 `word_id`）
- 已扩展 IPC 契约与路由：
  - `src/shared/ipc.ts`
  - `src/main/ipc_router.ts`
  - 新增频道：`library:list`、`library:update`、`library:delete`
  - 新增错误码：`APP_NOT_FOUND`
- 已完成主进程 wiring：
  - `src/main/main.ts` 注入 `LibraryService`
- 已完成渲染层 `単語帳` 页面：
  - `src/renderer/app.tsx`
  - `src/renderer/style.css`
  - 交互：列表展示、关键词搜索、行内编辑、删除确认
- 已补齐步骤 10 验收脚本：
  - `scripts/make_seed_10k.mjs`
  - `scripts/bench_search.mjs`
  - `package.json` 新增脚本：`make:seed-10k`、`bench:search`
- 已新增步骤 10 测试：
  - 单测：`tests/unit/main/library_service.test.ts`
  - E2E：`e2e/word_add.spec.ts` 新增 `library-crud` 用例

### 2.12 对应 plan.md 步骤 11（SM-2 复习引擎与复习页）
- 已新增纯函数算法模块：
  - `src/main/sm2.ts`
  - 能力：
    - 固定计算顺序：先 EF，再 repetition/interval，最后写入时间字段
    - 覆盖评分 `0-5`
    - 第三次及以后按 `round(previous_interval_days * updated_easiness_factor)` 计算
    - EF 下限保护 `1.3`
- 已新增复习服务：
  - `src/main/review_service.ts`
  - 能力：
    - 待复习队列：`next_review_at <= now`
    - 逾期词条与当下到期词条全部入队
    - 本地时区“今日已完成”统计
    - 评分后即时更新 `review_state` 并持久化
- 已扩展 IPC 契约与路由：
  - `src/shared/ipc.ts`
  - `src/main/ipc_router.ts`
  - 新增频道：`review:queue`、`review:grade`
- 已完成主进程 wiring：
  - `src/main/main.ts` 注入 `ReviewService`
- 已完成渲染层 `復習` 页面：
  - `src/renderer/app.tsx`
  - `src/renderer/style.css`
  - 交互：待复习卡片展示、评分按钮 `0-5`、剩余数量、今日完成数量、完成态提示
- 已新增步骤 11 测试：
  - 单测：`tests/unit/main/sm2.test.ts`
  - 单测：`tests/unit/main/review_queue.test.ts`
  - E2E：`e2e/word_add.spec.ts` 新增 `review-flow` 用例

### 2.13 对应 plan.md 步骤 12（review_logs 与统计基础）
- 已扩展复习服务：
  - `src/main/review_service.ts`
  - 能力：
    - 每次评分都写入一条 `review_log`
    - 记录字段：`before_state`、`after_state`、`grade`、`reviewed_at`
    - 日志写入与 `review_state` 更新在同一次词库持久化内完成
    - `review_logs` 超过 `50000` 条时自动淘汰最旧记录
- 已补充共享常量：
  - `src/shared/domain_schema.ts`
  - 新增 `REVIEW_LOG_RETENTION_LIMIT = 50000`
- 已新增步骤 12 测试：
  - 单测：`tests/unit/main/review_logs.test.ts`
  - 单测：`tests/unit/main/log_retention.test.ts`

### 2.14 对应 plan.md 步骤 13（全日语 UI 与错误处理收敛）
- 已扩展共享 IPC 契约：
  - `src/shared/ipc.ts`
  - 新增频道：`app:startup-status`
  - 新增返回类型：`AppStartupStatusResult`
- 已扩展主进程启动与错误映射：
  - `src/main/main.ts`
    - 启动时把词库恢复/迁移状态转换为可展示的日语通知
  - `src/main/ipc_router.ts`
    - `word-add:generate` 的 AI 错误映射收敛为日语提示
- 已完成渲染层全日语收敛：
  - `src/renderer/app.tsx`
  - `src/renderer/style.css`
  - 页面、标签、按钮、空态、提示、删除确认均统一为日语
- 已新增步骤 13 验证：
  - E2E：`e2e/word_add.spec.ts` 新增 `i18n-ja` 与 `error-handling` 用例

### 2.15 对应 plan.md 步骤 14（设置页面与 API Key 配置闭环）
- 已扩展共享 IPC 契约：
  - `src/shared/ipc.ts`
  - 新增频道：`settings:get`、`settings:save`、`settings:delete-api-key`
  - 新增类型：`SettingsGetResult`、`SettingsSavePayload`、`SettingsSaveResult`、`SettingsDeleteApiKeyResult`
- 已扩展设置与密钥管理能力：
  - `src/main/settings_service.ts`
    - 新增设置概览读取、设置保存、API Key 删除能力
    - 新增 `SettingsValidationError`
  - `src/main/keytar_secret_store.ts`
    - 保留系统密钥链存储
    - 新增 `KOTOBA_FAKE_KEYTAR_FILE` 文件型密钥测试桩，避免 E2E 污染真实钥匙串
  - `src/main/ipc_router.ts`
    - 新增设置读取/保存/删除路由与日语错误映射
  - `src/main/main.ts`
    - 统一复用同一个 `api_key_secret_store` 实例给 `WordEntryService` 与设置 IPC
- 已完成渲染层 `設定` 页面：
  - `src/renderer/app.tsx`
  - `src/renderer/style.css`
  - 交互：
    - 读取当前 `model / timeout / retries`
    - 显示 API Key 是否已设置
    - 支持录入并更新 API Key
    - 支持删除 API Key
    - 保存后不回显既有 API Key，只清空输入框
- 已补齐步骤 14 测试：
  - 单测：`tests/unit/main/settings_repository.test.ts`
  - 单测：`tests/unit/main/keytar_secret_store.test.ts`
  - E2E：`e2e/word_add.spec.ts` 新增 `settings` 用例

### 2.16 对应 ui-plan.md 第 1 步（Tailwind CSS 与 shadcn/ui 基础设施接入）
- 已新增 UI 重写计划文档：
  - 根目录 `ui-plan.md`
  - 明确 UI 重写范围、阶段拆分、迁移顺序、验证计划与风险控制
- 已完成渲染层基础设施接入：
  - `package.json`
    - 新增运行时依赖：`clsx`、`tailwind-merge`
    - 新增开发依赖：`tailwindcss`、`@tailwindcss/vite`、`tw-animate-css`
  - `vite.config.ts`
    - 接入 `@tailwindcss/vite`
    - 新增 `@ -> ./src` 路径别名
  - `tsconfig.json`
    - 新增 `baseUrl` 与 `@/*` 路径映射
  - 根目录 `components.json`
    - 新增 `shadcn/ui` 配置文件
    - 约定组件目录别名：
      - `components -> @/renderer/components`
      - `ui -> @/renderer/components/ui`
      - `lib -> @/renderer/lib`
      - `utils -> @/renderer/lib/utils`
  - `src/renderer/style.css`
    - 升级为 `Tailwind CSS v4` 全局样式入口
    - 新增 `@theme inline` 设计 token、CSS variables 与基础 layer
    - 保留既有页面样式，尚未开始页面迁移
  - `src/renderer/lib/utils.ts`
    - 新增 `cn()` 工具函数，供后续 `shadcn/ui` 组件组合 class 使用
- 当前边界：
  - 仅完成 UI 基础设施接入
  - 尚未开始 `ui-plan.md` 第 `2` 步的应用壳与页面组件迁移
- 已完成验证：
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - 用户已明确验证通过

### 2.17 对应 ui-plan.md 第 2 步（应用壳与通用组件落地）
- 已新增渲染层组件目录：
  - `src/renderer/components/ui`
  - `src/renderer/components/layout`
  - `src/renderer/components/shared`
- 已新增通用 UI primitives：
  - `src/renderer/components/ui/button.tsx`
  - `src/renderer/components/ui/input.tsx`
  - `src/renderer/components/ui/textarea.tsx`
  - `src/renderer/components/ui/card.tsx`
  - `src/renderer/components/ui/badge.tsx`
  - `src/renderer/components/ui/alert.tsx`
  - `src/renderer/components/ui/separator.tsx`
  - `src/renderer/components/ui/scroll_area.tsx`
  - `src/renderer/components/ui/tabs.tsx`
- 已新增布局与共享状态组件：
  - `src/renderer/components/layout/app_shell.tsx`
  - `src/renderer/components/layout/app_navigation.tsx`
  - `src/renderer/components/layout/page_header.tsx`
  - `src/renderer/components/shared/status_message.tsx`
  - `src/renderer/components/shared/empty_state.tsx`
  - `src/renderer/components/shared/loading_state.tsx`
- 已完成顶层应用壳接入：
  - `src/renderer/app.tsx`
    - 顶层标题区改由 `PageHeader` 渲染
    - 主导航改由 `AppNavigation` 渲染
    - 页面外壳改由 `AppShell` 承载
    - 全局启动通知改由 `StatusMessage` 统一呈现
    - 页面内基础 `button / input / textarea / card` 已切换到通用组件
    - 页面业务流程、状态字段与 IPC 调用保持不变
  - `src/renderer/style.css`
    - 移除了已被壳层与 primitives 取代的旧顶层样式
    - 保留页面业务相关样式与 `活動` heat map 样式
- 当前边界：
  - 已完成应用壳、主导航、页面容器、全局通知、加载态、空态、错误/成功态的统一
  - 尚未开始 `ui-plan.md` 第 `3` 步的页面级迁移
  - 各页面的业务布局仍主要保留在 `src/renderer/app.tsx`
- 已完成验证：
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test`
  - 用户已明确验证通过

## 3. 下一步入口
- 若继续产品主线交付，入口仍是 `plan.md` 的 `步骤 15（打包、回归与发布验收）`。
- 若继续 UI 重写专项，入口是 `ui-plan.md` 的第 `3` 步：按页面从低风险到高风险逐步迁移。
- 结果：通过

### 3.2 步骤 9 验证（已通过用户验证）
- 执行命令：
  - `pnpm test:e2e --grep "word-create"`
  - `pnpm test:e2e --grep "draft"`
  - `pnpm test:e2e --grep "duplicate-word"`
- 结果：三条命令均通过（退出码 `0`）
- 额外校验：
  - `pnpm lint` 通过
  - `pnpm typecheck` 通过
  - `pnpm test` 通过（单测与 E2E 已解耦）
- 用户结论：
  - 第 9 步已验证通过，可进入步骤 10

### 3.3 步骤 10 验证（已通过用户验证）
- 执行命令：
  - `pnpm make:seed-10k`
  - `pnpm bench:search`
  - `pnpm test:e2e --grep "library-crud"`
- 结果：
  - 三条命令均通过（退出码 `0`）
  - `bench:search` 输出：`dataset_words=10000`，`p95_ms=0.317`（阈值 `150ms`）
- 额外校验：
  - `pnpm lint` 通过
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
- 用户结论：
  - 第 10 步已验证通过，可进入步骤 11

### 3.4 步骤 11 验证（已通过用户验证）
- 执行命令：
  - `pnpm test:unit -- sm2`
  - `pnpm test:unit -- review-queue`
  - `pnpm test:e2e --grep "review-flow"`
- 结果：
  - 三条命令均通过（退出码 `0`）
- 额外校验：
  - `pnpm format:check` 通过
  - `pnpm lint` 通过
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
- 用户结论：
  - 第 11 步已验证通过，可进入步骤 12

### 3.5 步骤 12 验证（已通过用户验证）
- 执行命令：
  - `pnpm test:unit -- review-logs`
  - `pnpm test:unit -- log-retention`
- 结果：
  - 两条命令均通过（退出码 `0`）
  - `log-retention` 用例在 `50000` 条既有日志基础上追加评分后仍保持总数 `50000`
- 备注：
  - 当前环境 Node 版本为 `v25.2.1`，与仓库 `22.x` 基线不一致，因此命令输出包含 engine warning；未影响测试通过
- 用户结论：
  - 第 12 步已验证通过，可进入步骤 13

### 3.6 步骤 13 验证（已通过用户验证）
- 执行命令：
  - `pnpm test:e2e --grep "i18n-ja"`
  - `pnpm test:e2e --grep "error-handling"`
  - `rg -n "[\u4e00-\u9fff]" src`
- 结果：
  - `i18n-ja` 通过（退出码 `0`）
  - `error-handling` 通过（退出码 `0`）
  - `rg` 已执行，用于人工排查用户可见文案；结果主要为日语 UI 文案与测试样例，不作为中文残留唯一判定
- 覆盖要点：
  - 全日语页面标签、按钮、搜索占位、删除确认弹窗
  - API Key 缺失、API Key 无效、网络失败、超时的日语错误提示与“输入内容保持”行为
  - JSON 主文件损坏后，从备份恢复并向用户展示日语启动提示
- 备注：
  - 当前环境 Node 版本为 `v25.2.1`，与仓库 `22.x` 基线不一致，因此命令输出包含 engine warning；未影响测试通过
- 用户结论：
  - 第 13 步已验证通过，可进入步骤 14

### 3.7 活动 heat map 补充迭代验证（已通过用户验证）
- 执行命令：
  - `pnpm typecheck`
  - `pnpm test:unit`
  - `pnpm build`
  - `pnpm exec playwright test -g "activity-heatmap"`
- 结果：
  - 四条命令均通过（退出码 `0`）
- 覆盖要点：
  - 活动页展示最近 `40` 周热力图，统计口径保持为“当日新增单词数 + 当日复习次数”
  - 通过扩展时间跨度而非拉伸格子来匹配主界面宽度
  - 小方格 hover 时不再显示详情弹窗或原生 tooltip，避免界面闪烁
- 备注：
  - 当前环境 Node 版本为 `v25.2.1`，与仓库 `22.x` 基线不一致，因此命令输出包含 engine warning；未影响测试通过
- 用户结论：
  - 当前活动 heat map 版本已验证通过，可作为后续开发基线

### 3.8 `活動` 默认主界面验证（已通过用户验证）
- 执行命令：
  - `pnpm typecheck`
  - `pnpm test:e2e`
- 结果：
  - 两条命令均通过（退出码 `0`）
  - `pnpm test:e2e` 共 `11` 个用例全部通过
- 覆盖要点：
  - 应用启动后默认进入 `活動` 页面
  - `活動` 标签位于导航首位，且首页可直接展示统计摘要与 heat map
  - 需要录入单词的 E2E 场景改为显式切换到 `単語追加`，避免测试对默认页产生隐式耦合
- 备注：
  - 当前环境 Node 版本为 `v25.2.1`，与仓库 `22.x` 基线不一致，因此命令输出包含 engine warning；未影响测试通过
- 用户结论：
  - `活動` 作为默认主界面的当前实现已验证通过，可作为后续 UI 信息架构调整的最新基线

## 4. 当前行为备注（与后续开发相关）
- 当前重复词保存策略为“直接覆盖并提示”，未实现确认弹窗。
- 当前已具备 `設定` 页面；API Key 通过 keytar/测试桩存储，不写入 JSON。
- `単語帳` 页面已支持列表/搜索/编辑/删除；删除使用确认弹窗。
- 词条编辑遵循“日语字段校验 + 重复单词冲突校验”。
- `復習` 页面已支持到期队列、评分 `0-5`、即时持久化和“今日完了”统计。
- `review_logs` 已接入评分持久化，并保留最近 `50000` 条。
- `活動` 页面当前展示最近 `40` 周 heat map；格子尺寸和间距固定，通过增加跨度扩展总宽度，且不显示 hover 详情窗。
- 用户启动 App 后，默认首先进入 `活動` 页面；`単語追加` 仍是完整可用的录入入口，但不再是默认落地页。
- 启动时若检测到词库恢复或迁移，页面顶部会显示全局日语通知。
- 当前 `test:e2e` 会先执行 `pnpm build`，避免 E2E 误跑旧产物。

## 5. 下一步入口
- 下一执行目标：`plan.md` 的 `步骤 15（打包、回归与发布验收）`。
- 若后续继续调整首页信息架构，必须同步更新：
  - `src/renderer/app.tsx`
  - `e2e/word_add.spec.ts`
  - `memory-bank/design-doc.md`
  - `memory-bank/architecture.md`
