# Kotoba

Kotoba 是一个为日语学习者打造的桌面单词记忆应用。

它把「查词、整理、记忆、复习」这条原本分散的流程收拢到一个本地优先的桌面体验里：输入一个单词，AI 生成日语读音与语境内容，用户确认后保存进个人词库，再通过 `SM-2` 复习机制把短期记忆持续推进成长期记忆。

当前版本已经具备可运行的开发闭环，覆盖单词新增、词库管理、复习调度、活动统计、设置管理与自动化测试基础设施。

## 为什么是 Kotoba

- 更少整理成本：输入单词后，直接生成 `reading_kana`、`meaning_ja`、`context_scene_ja`、`example_sentence_ja`
- 更强记忆闭环：生成、编辑、保存、复习在一个应用里完成，不再依赖多套工具切换
- 更适合长期积累：基于 `SM-2` 自动安排复习节奏，减少“记了又忘”的重复劳动
- 更看得见进步：`活動` 页面用最近 `40` 周 heat map 和记忆等级分布展示学习轨迹
- 更安心的数据策略：词库保存在本地 JSON，API Key 进入系统钥匙串，默认不上传词库

## 当前可用能力

- `AI 词卡生成`
  - 为输入的日语单词生成假名、日语解释、语境场景与例句
  - 支持失败重试与重新生成
- `单词库管理`
  - 支持新增、搜索、编辑、删除
  - 按 `word` 执行 `trim + Unicode NFKC` 去重，忽略 `reading_kana` 差异
- `复习系统`
  - 基于 `SM-2` 维护 `review_state`
  - 按评分 `0-5` 更新记忆状态与下一次复习时间
- `学习活动页`
  - 默认首页为 `活動`
  - 展示最近 `40` 周活跃度 heat map、连续天数、总活动次数与 `1-5` 级记忆等级分布
- `设置与稳定性`
  - 支持 Gemini `model / timeout / retries / API Key` 配置
  - 支持自动草稿、原子写入、每日备份、启动恢复与 schema 迁移

## 产品特性

### 1. AI 不是附加功能，而是主流程的一部分

Kotoba 不把 AI 当作一个孤立按钮，而是让它直接服务于记忆流程本身。你输入单词，系统会生成可以直接进入个人词库的结构化内容，减少手动补全释义、语境和例句的时间。

### 2. 复习不是事后补丁，而是词库的默认归宿

每个词条从保存开始就进入 `SM-2` 调度体系。新增不是终点，复习也不是单独维护的第二套系统，而是同一份词库数据的自然延伸。

### 3. 活动反馈更像“学习仪表盘”

`活動` 页面不是装饰性的统计页。它会把新增与复习行为按本地自然日聚合，直观看到学习热度、连续性与记忆等级分布，帮助用户判断自己是在持续积累，还是只是短期冲刺。

## 当前状态

- 当前仓库已经不是文档原型，而是可运行的桌面应用开发版本
- 默认 AI provider 为 Gemini，默认模型为 `gemini-2.5-flash`
- UI 文案、错误提示与主要交互文案为日语
- 单元测试与 Electron E2E 回归已经接入
- 打包、发布与最终验收仍是后续阶段，尚未在 README 中宣称为已完成能力

## 技术栈

- Electron `40.x`
- React `19.x`
- TypeScript `5.x`
- Vite `7.x`
- pnpm `9.x`
- `@google/genai`
- `zod`
- `keytar`
- Tailwind CSS `v4`
- shadcn/ui 基础组件
- Vitest
- Playwright

## 快速开始

### 环境要求

- Node.js `22 LTS`
- pnpm `9.x`
- macOS 或 Windows
- 可用的 Gemini API Key

### 安装与启动

```bash
pnpm install
pnpm dev
```

首次启动后的建议顺序：

1. 进入 `設定`
2. 配置 Gemini API Key
3. 根据需要调整 `model`、`timeout`、`retries`
4. 进入 `単語追加` 生成并保存第一批词条
5. 回到 `活動` 与 `復習` 查看学习状态与待复习队列

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

## CI/CD

仓库已接入 GitHub Actions：

- `CI`（`.github/workflows/ci.yml`）
  - 触发：`pull_request`、`push`
  - 执行：
    - `pnpm verify`
    - `pnpm test`
    - 文档默认值关键字一致性检查（`design-doc.md` / `tech-stack.md`）
    - `xvfb-run -a pnpm test:e2e`
- `CD`（`.github/workflows/cd.yml`）
  - 触发：`main` 分支 `push`、手动 `workflow_dispatch`
  - 执行：
    - 在 `ubuntu-latest`、`macos-latest`、`windows-latest` 三平台执行 `pnpm build`
    - 上传 `dist/` 与 `dist-electron/` 为构建产物 artifact（保留 14 天）

## 数据与运行时约束

- 词库主文件位于 Electron `userData` 目录下的 `kotoba-library.json`
- 备份目录位于 Electron `userData` 目录下的 `backups/`
- API Key 不写入 JSON，由 `keytar` 存入系统钥匙串
- 词库使用 `schema_version` 管理迁移
- `review_logs` 默认保留最近 `50000` 条

默认生成配置：

- `model`: `gemini-2.5-flash`
- `timeout`: `15s`
- `retries`: `2`
- `backoff`: `500ms -> 1500ms`，带 jitter

## 测试与本地隔离

仓库内置若干用于自动化和 E2E 的环境变量：

- `KOTOBA_USER_DATA_DIR`
- `KOTOBA_FAKE_KEYTAR_FILE`
- `KOTOBA_FAKE_GENERATE_CARD_JSON`
- `KOTOBA_FAKE_GENERATE_ERROR_CODE`

## 项目结构

```text
src/
  main/        Electron 主进程、服务、存储、IPC
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

- `memory-bank/design-doc.md`：产品需求与行为规则
- `memory-bank/tech-stack.md`：技术选型与默认值快照
- `memory-bank/architecture.md`：当前仓库结构与职责
- `memory-bank/progress.md`：实施进度与最近交付状态
- `prompts/coding-principles.md`：开发原则

## 适合谁

- 想持续积累日语词汇的学习者
- 不想手动维护复杂 Anki 前处理流程的用户
- 希望把“新增单词”和“定期复习”统一到一个桌面应用中的人
- 偏好本地优先、可控数据存储方式的个人学习者

## 后续方向

当前实现重点已经覆盖单词生成、词库管理、复习闭环和活动统计。若继续推进产品主线，下一阶段重点将转向打包、回归和发布验收。
