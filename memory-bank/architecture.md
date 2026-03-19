# Kotoba 仓库结构与职责说明（当前快照）

## 1. 架构阶段说明
- 当前已完成实施计划步骤 14，且步骤 13 与步骤 14 均已通过用户验证。
- 仓库处于“新增单词闭环可用 + 草稿机制可用 + 词库管理 CRUD 可用 + 复习闭环可用 + review_logs 基础记录可用 + 全日语错误提示可用 + 启动恢复提示可用 + 设置页/API Key 管理可用 + E2E 回归已接入”阶段。
- 已具备主进程、预加载、渲染层、共享契约、单测与 E2E 的最小闭环。
- 已具备安全基线、JSON 原子写入、备份恢复、迁移、设置与密钥管理、AI Provider、单词新增链路、词库管理链路、复习链路、`review_logs` 基础审计链路、启动恢复提示链路、设置页配置链路。
- 后续开发入口是 `plan.md` 的 `步骤 15（打包、回归与发布验收）`。

## 2. 顶层文件结构与职责
- `AGENTS.md`
  - 仓库协作规范、文档读取顺序、AI 执行约束。
- `plan.md`
  - 实施计划主文档（步骤目标、验收命令、通过指标）。
- `package.json`
  - 依赖与脚本入口。
  - 关键脚本：`dev`、`build`、`lint`、`typecheck`、`test:unit`、`test:e2e`、`test`、`verify`、`make:seed-10k`、`bench:search`。
  - `dev:main` 与 `build:main` 使用 `--external:keytar` 以避免原生模块打包错误。
  - `test:e2e` 会先执行 `pnpm build`，再运行 Playwright。
- `scripts/`
  - `make_seed_10k.mjs`：生成 1 万词条基准数据。
  - `bench_search.mjs`：执行搜索性能基准并输出 `P50/P95`。
- `pnpm-lock.yaml`
  - 锁定依赖 patch 版本，保证可复现安装结果。
- `tsconfig.json`
  - TypeScript 类型检查配置（strict/noEmit）。
- `vite.config.ts`
  - 渲染层构建配置；`base: './'` 以支持 `file://` 加载生产资源。
- `vitest.config.ts`
  - 单元测试范围配置；仅包含 `src` 下测试并排除 `e2e/**`。
- `playwright.config.ts`
  - E2E 配置入口；`testDir=./e2e`、单 worker、失败保留 trace。
- `index.html`
  - 渲染层 HTML 入口，挂载 React 根节点。
- `.eslintrc.cjs` / `.prettierrc.json` / `.prettierignore`
  - 代码质量与格式化配置。
- `.husky/pre-commit`
  - 提交前执行 `pnpm lint-staged`。
- `prompts/coding-principles.md`
  - 开发原则约束文档。
- `memory-bank/`
  - 长期记忆文档目录（需求、技术栈、进度、架构）。
  - `progress.md` 记录步骤完成度与验证证据。
  - `architecture.md` 记录文件职责与运行快照。
- `e2e/`
  - Electron 端到端测试目录。

## 3. src 目录结构与职责
### 3.1 主进程（`src/main`）
- `main.ts`
  - Electron 主进程入口。
  - 创建窗口并加载渲染页面。
  - 设置安全基线：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。
  - 启动时初始化 `LibraryRepository`、`SettingsRepository`、`WordAddDraftRepository`、共享 `api_key_secret_store`、`WordEntryService`、`LibraryService`、`ReviewService` 并注册 IPC。
  - 支持 `KOTOBA_USER_DATA_DIR` 覆盖 `userData` 目录（用于测试隔离）。
- `ipc_router.ts`
  - IPC 统一路由与错误映射。
  - 支持频道：
    - `app:ping`
    - `app:startup-status`
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
- `review_service.ts`
  - 第 11 步核心服务：待复习队列读取与评分持久化。
  - 规则：`next_review_at <= now` 入队；“今日完成”按系统本地自然日统计。
  - 第 12 步补充：每次评分追加 `review_log`，并保留最近 `50000` 条。
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
- `domain_schema.ts`
  - 领域 schema 与类型定义（`Word`、`ReviewState`、`ReviewLog`、`LibraryRoot`、`Settings`）。
  - 固化 `schema_version=1`、`REVIEW_LOG_RETENTION_LIMIT=50000` 与 AI 字段长度约束。

### 3.4 渲染层（`src/renderer`）
- `main.tsx`
  - React 挂载入口。
- `app.tsx`
  - 当前 UI 主页面。
  - 已实现：
    - 顶部标签页：`単語追加`、`単語帳`、`復習`、`設定`
    - `単語追加` 输入/生成/编辑/保存流程
    - 草稿机制：`800ms` 防抖自动保存、切页强制保存、`beforeunload` 强制保存、保存成功后清理
    - `単語帳` 列表、搜索、行内编辑、删除确认
    - `復習` 到期卡片、评分按钮 `0-5`、剩余/今日完成统计
    - `設定`：`model / timeout / retries` 编辑、API Key 状态展示、更新与删除
    - 生成/保存/编辑/删除状态与错误提示（日语）
    - 启动恢复/迁移时的顶部全局通知
- `style.css`
  - 页面样式（表单、标签、状态提示样式）。
- `window.d.ts`
  - `window.kotoba` 类型定义。

## 4. 测试文件结构与职责
### 4.1 单元测试（Vitest）
- `src/shared/domain_schema.test.ts`
  - 领域 schema 校验测试。
- `src/main/library_repository.repository.test.ts`
  - 并发更新串行化测试。
- `src/main/library_repository.backup.test.ts`
  - 每日备份触发规则测试。
- `src/main/library_repository.recovery.test.ts`
  - 启动损坏恢复测试。
- `src/main/library_repository.migration.test.ts`
  - 迁移成功路径测试。
- `src/main/library_repository.rollback.test.ts`
  - 迁移失败回滚测试。
- `src/main/settings_repository.test.ts`
  - 设置默认值、更新、设置概览/API Key 删除与缺失引导测试。
- `src/main/keytar_secret_store.test.ts`
  - keytar/文件型密钥存取删与 API Key 不落盘测试。
- `src/main/gemini_provider_ai_provider.test.ts`
  - Gemini 正常输出路径测试。
- `src/main/gemini_provider_ai_retry.test.ts`
  - Gemini 重试/退避与非日语自动重试测试。
- `src/main/library_service.test.ts`
  - 搜索标准化与词库编辑/删除行为测试。
- `src/main/sm2.test.ts`
  - SM-2 算法顺序、EF 下限、评分 `0-5` 覆盖测试。
- `src/main/review_queue.test.ts`
  - 待复习队列、本地时区今日统计、评分持久化测试。
- `src/main/review_logs.test.ts`
  - 评分后写入 `before_state/after_state/grade/reviewed_at` 的测试。
- `src/main/log_retention.test.ts`
  - `review_logs` 超过 `50000` 条时淘汰最旧记录的测试。

### 4.2 端到端测试（Playwright + Electron）
- `e2e/word_add.spec.ts`
  - 覆盖用例：
    - `word-create`：新增词条、重启后持久化、保存后草稿清理
    - `draft`：输入后防抖自动保存可恢复
    - `draft`：切页前强制保存可恢复
    - `duplicate-word`：`trim + NFKC` 判重覆盖
    - `library-crud`：词库列表/搜索/编辑/删除
    - `review-flow`：复习页评分与 `review_state` 持久化
    - `settings`：设置页保存、API Key 更新/删除、重启后回读
    - `i18n-ja`：主页面、标签、按钮、搜索占位、删除确认弹窗均为日语
    - `error-handling`：API Key 缺失/无效、网络失败、超时、损坏回退提示
  - 使用临时 `userData` 目录与 `KOTOBA_FAKE_KEYTAR_FILE`，避免污染本地真实数据与钥匙串。

## 5. 当前运行流程（步骤 14 快照）
1. `pnpm dev` 启动 Vite、main/preload watch、Electron。
2. 渲染层通过 `window.kotoba.invoke` 调用 IPC。
3. 主进程 `ipc_router` 校验 channel/payload 后分发到 `WordEntryService`、`WordAddDraftRepository`、`LibraryService`、`ReviewService` 与设置服务。
4. 启动提示流程：
  - `LibraryRepository.initialize_on_startup()` 返回 `ok/created/recovered/migrated`。
  - 主进程把 `recovered/migrated` 转换为 `app:startup-status` 的日语通知。
  - 渲染层启动时读取该状态，并在页面顶部显示通知。
5. 生成流程：
  - 若未配置 API Key，返回 `APP_API_KEY_MISSING`。
  - 若 API Key 无效、网络失败、超时、429、解析失败，则返回日语错误提示，并保留当前输入。
  - 若配置有效，调用 Gemini 生成并回填四字段。
6. 保存流程：
  - 执行字段校验与日语校验。
  - 按 `word(trim + NFKC)` 判重，命中则覆盖，否则新增。
  - 成功后清理草稿文件。
7. 词库管理流程：
  - `library:list`：返回按 `updated_at` 倒序的词条列表，并按规范执行搜索标准化匹配。
  - `library:update`：更新词条字段并保留 `review_state`，发生冲突返回可定位错误。
  - `library:delete`：按 `word_id` 删除词条并更新 `updated_at`。
8. 设置流程：
  - `settings:get`：返回当前 `provider / model / timeout / retries` 与 `has_api_key`。
  - `settings:save`：保存非敏感设置；若提交了新的 API Key，则写入密钥存储且不回显。
  - `settings:delete-api-key`：删除 API Key，并使后续生成恢复为“未设置”引导错误。
9. 复习流程：
  - `review:queue`：返回所有 `next_review_at <= now` 的词条，并统计本地自然日内已完成词条数。
  - `review:grade`：按 SM-2 纯函数计算新 `review_state`，追加一条 `review_log`，并立即持久化到词库。
  - `review_logs` 保留最近 `50000` 条，超限时删除最旧记录。

## 6. 当前交接重点
- 已通过用户验证的最后一步是步骤 14，因此后续开发默认从步骤 15 开始。
- 若后续修改 `単語帳`、IPC 契约、词库存储或搜索规则，必须同步更新对应单测、E2E 与 `memory-bank` 文档。
- 当前 `単語帳` 已不是占位页，任何后续 AI 开发者都应将其视为已稳定实现的基础能力。
- 当前 `復習` 页面已在不破坏既有评分与队列行为的前提下补齐 `review_logs` 基础记录。
- 当前第 13 步新增的全局启动提示与日语错误提示不应在后续步骤中被回退。
- 当前第 14 步新增的 `設定` 页面、设置 IPC 与 API Key 不回显规则不应在后续步骤中被回退；步骤 15 主要应聚焦打包与最终回归。

## 7. 当前质量门禁流程
1. 代码质量：`pnpm lint`、`pnpm format:check`、`pnpm typecheck`。
2. 单元测试：`pnpm test`（实际执行 `pnpm test:unit`，仅覆盖 `src`）。
3. E2E 测试：`pnpm exec playwright test -g "word-create|draft|duplicate-word|library-crud|review-flow|settings|i18n-ja|error-handling"`。
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

## 9. 信息流更新规则
- 需求或行为变更：先更新 `design-doc.md`，再同步 `tech-stack.md`。
- 每完成一个实施步骤：更新 `progress.md`。
- 文件结构或职责变化：同步更新 `architecture.md`。
