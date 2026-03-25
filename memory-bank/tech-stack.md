# Kotoba 技术栈选型（最简单且健壮）

## 1. 选型原则
- 单一语言优先：尽量全链路 TypeScript，降低认知与维护成本。
- 本地优先：无后端服务，所有业务在本地完成，避免额外运维复杂度。
- 文件存储优先：严格采用 JSON 文件持久化（符合 `design-doc.md`）。
- 安全默认开启：桌面容器安全选项、API Key 系统级安全存储。
- 依赖最小化：只引入“直接解决需求”的库，避免过度工程。
- 默认值集中管理：本文件仅保留“实现所需默认值”，业务语义细则以 `design-doc.md` v0.5 为准。

## 2. 最终技术栈
| 层级 | 技术 | 选择理由 |
|---|---|---|
| 桌面容器 | Electron 40.x（稳定分支） | 生态最成熟、跨平台稳定、文档完整；全 JS/TS，开发最简单。 |
| 语言 | TypeScript（strict） | 类型约束降低回归风险，长期维护更稳。 |
| 前端框架 | React + Vite | 迭代快、工程简单、社区成熟。 |
| 包管理 | pnpm | 安装快、锁文件稳定、磁盘占用低。 |
| 构建/打包 | Electron Forge（Vite 插件） | 官方路线，配置清晰，Windows/macOS 打包流程稳定。 |
| 本地数据存储 | JSON 文件 + `write-file-atomic` + `zod` | 满足“非数据库”；原子写入防损坏；schema 校验防脏数据。 |
| 密钥存储 | `keytar` | API Key 存系统钥匙串/凭据管理器，安全且跨平台。 |
| AI SDK | `@google/genai`（Gemini） | 官方 SDK，直接满足默认 Gemini provider。 |
| 日志 | `pino`（文件滚动可后续补） | 轻量且结构化，便于排查线上问题。 |
| 测试 | Vitest + Playwright（Electron） | 单测覆盖 SM-2/存储；端到端保障核心流程。 |
| 代码质量 | ESLint + Prettier + Husky + lint-staged | 在提交前阻断明显问题，保持风格一致。 |

## 3. 关键实现约束（保证健壮）
- Electron 安全基线：
  - `contextIsolation: true`
  - `sandbox: true`
  - `nodeIntegration: false`
  - IPC 白名单 + 参数校验
- JSON 存储基线：
  - 主文件：`<userData>/kotoba-library.json`
  - 写入策略：临时文件写入后原子替换
  - 每日首次写入自动备份：`<userData>/backups/`
  - 启动时执行 schema 校验，不合法则回退最近备份
- 复习算法基线：
  - SM-2 逻辑纯函数化（可单测）
  - 评分后先更新内存状态，再一次性持久化
- AI 调用基线：
  - 强制 JSON 输出
  - 非日语内容自动重试一次
  - 请求超时、重试、错误分级提示

## 4. 默认值快照（与 `design-doc.md` v0.5 同步）
- Provider 默认值：
  - model: `gemini-2.5-flash`
  - timeout: `15s`
  - retries: `2`
  - backoff: `500ms -> 1500ms`（jitter）
  - retry-on: 网络错误、超时、`429`、`5xx`、JSON 解析失败、非日语输出
- 词条判重与搜索：
  - 去重主键：`word`（忽略 `reading_kana` 差异）
  - 标准化：`trim + Unicode NFKC`
  - 搜索：包含匹配；拉丁字母小写化；平假名/片假名不敏感
- 复习调度：
  - 待复习队列：`next_review_at <= now`
  - 时区：系统本地时区；“今日”按本地自然日（00:00-23:59）
  - SM-2 计算顺序：先 EF，后 repetition/interval，最后写入时间与成绩
- 数据持久化：
  - `review_logs`：MVP 必选；保留最近 `50000` 条
  - `schema_version` 迁移：`vN -> vN+1` 顺序迁移，迁移前备份，失败自动回滚
- 活动 heat map：
  - 范围：最近 `40` 周，起始日对齐到本地周起始日
  - 统计口径：每日 `activity_count = added_word_count + review_count`
  - 日期边界：系统本地时区自然日
  - 数据来源：`words.created_at` 与 `review_logs.reviewed_at`
  - 活动页额外摘要：当前词库基于 `SM-2` 当前状态输出固定 `1-5` 级记忆等级分布，并显示各等级占总词数百分比
- 草稿与输出约束：
  - 自动草稿：默认开启；输入 `800ms` 防抖保存；切页/关窗前强制保存
  - AI 输出长度上限：
  - `reading_kana`: `1-32`
  - `meaning_ja`: `8-120`
  - `context_scene_ja`: `12-160`
  - `example_sentence_ja`: `8-80`（单句）

## 5. 推荐版本基线（MVP）
- Node.js: 22 LTS（开发环境）
- pnpm: 9.x
- Electron: 40.x（锁定同一 major）
- TypeScript: 5.x
- React: 19.x
- Vite: 7.x

说明：MVP 阶段采用“锁 major、跟 patch”策略，避免频繁升级引发不必要风险。
- 依赖声明使用锁 major 的范围（如 `^40.0.0`）。
- `pnpm-lock.yaml` 必须提交到仓库，用于锁定实际 patch 版本。
