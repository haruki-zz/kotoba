# Kotoba

Kotoba 是一个面向日语学习的桌面应用，帮助用户生成、保存、管理并复习日语单词。应用基于 `Electron + React + TypeScript` 构建，采用本地优先的数据模型：词库持久化到本机 JSON 文件，API Key 存储在系统钥匙串中。

当前仓库已经具备可运行的开发版本，覆盖单词新增、词库管理、SM-2 复习、学习活动 heat map、设置管理与基础自动化测试。

## 核心能力

- AI 生成日语词卡：输出 `reading_kana`、`meaning_ja`、`context_scene_ja`、`example_sentence_ja`
- 本地词库管理：新增、搜索、编辑、删除，按 `word` 标准化去重
- SM-2 复习闭环：按评分 `0-5` 更新 `review_state` 与下次复习时间
- 学习活动页：展示最近 `40` 周 heat map、连续活跃天数和 `1-5` 级记忆等级分布
- 设置页：管理 Gemini 模型、超时、重试次数与 API Key
- 自动草稿：`単語追加` 页面支持 `800ms` 防抖保存、切页保存、关窗前保存
- 本地安全与稳定性：原子写入、每日备份、启动恢复、schema 迁移、系统钥匙串存储 API Key

## 当前状态

- 默认主界面为 `活動`
- UI 文案与错误提示为日语
- 默认 AI provider 为 Gemini
- 已完成单元测试与 Electron E2E 基础回归
- 打包、发布与最终验收仍属于后续阶段

## 技术栈

- Electron `40.x`
- React `19.x`
- TypeScript `5.x`
- Vite `7.x`
- pnpm `9.x`
- `@google/genai`
- `zod`
- `keytar`
- Tailwind CSS `v4` + shadcn/ui 基础组件
- Vitest + Playwright

## 开发环境

- Node.js `22 LTS`
- pnpm `9.x`
- macOS 或 Windows
- 可用的 Gemini API Key

## 快速开始

```bash
pnpm install
pnpm dev
```

启动后：

1. 打开 `設定` 页面。
2. 配置 Gemini API Key。
3. 按需调整 `model`、`timeout`、`retries`。
4. 前往 `単語追加` 页面生成并保存词条。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm verify
pnpm make:seed-10k
pnpm bench:search
```

## 数据与配置

- 词库主文件位于 Electron `userData` 目录下的 `kotoba-library.json`
- 备份目录位于 Electron `userData` 目录下的 `backups/`
- API Key 不写入 JSON，由 `keytar` 存到系统钥匙串
- 词库使用 `schema_version` 管理迁移
- `review_logs` 默认保留最近 `50000` 条

默认生成配置：

- `model`: `gemini-2.5-flash`
- `timeout`: `15s`
- `retries`: `2`
- backoff: `500ms -> 1500ms`，带 jitter

## 测试与隔离

仓库内置若干测试隔离环境变量，主要用于本地自动化和 E2E：

- `KOTOBA_USER_DATA_DIR`
- `KOTOBA_FAKE_KEYTAR_FILE`
- `KOTOBA_FAKE_GENERATE_CARD_JSON`
- `KOTOBA_FAKE_GENERATE_ERROR_CODE`

## 项目结构

```text
src/
  main/        Electron 主进程、存储、服务、IPC
  preload/     安全桥接层
  renderer/    React UI、页面 feature、共享组件
  shared/      IPC 契约与领域 schema
tests/unit/    单元测试
e2e/           Electron 端到端测试
memory-bank/   设计、技术栈、架构、进度文档
prompts/       开发原则
scripts/       基准数据与性能脚本
```

## 文档入口

- 产品与行为规则：`memory-bank/design-doc.md`
- 默认值与技术选型：`memory-bank/tech-stack.md`
- 当前架构快照：`memory-bank/architecture.md`
- 开发进度：`memory-bank/progress.md`
- 开发原则：`prompts/coding-principles.md`

## 备注

- 项目采用本地优先设计，默认不上传词库到第三方服务
- 搜索与去重基于 `trim + Unicode NFKC`，搜索额外支持拉丁小写化与假名不敏感匹配
- 若要继续推进产品主线，当前文档入口是 `plan.md` 的后续步骤
