# 日语单词记忆桌面 App 设计文档

## 1. 文档信息
- 文档名称：`design-doc.md`
- 项目代号：Kotoba
- 目标平台：Windows、macOS
- 文档版本：v0.5
- 日期：2026-03-24

## 2. 背景与目标
### 2.1 背景
用户希望通过桌面 App 高效积累并复习日语词汇，减少手动查词和整理成本，并结合 AI 生成语义上下文与 SM-2 复习算法提升长期记忆效果。

### 2.2 产品目标
- 支持输入日语单词并由 AI 自动生成：
  - 假名读音
  - 日语解释
  - 日语语境场景
  - 日语例句
- 支持将生成结果保存为个人词库（JSON 文件存储）。
- 支持词库编辑、复习，并使用 SM-2 安排复习计划。
- 支持跨平台（Windows/macOS）稳定运行。

### 2.3 非目标（当前阶段）
- 不做移动端（iOS/Android）适配。
- 不做多人协作/云同步（先本地单机）。
- 不做复杂社交功能（排行榜、社区）。

## 3. 用户与核心流程
### 3.1 目标用户
- 日语初学者到中级学习者
- 需要长期积累与定期复习词汇的人群

### 3.2 主流程（MVP）
1. 用户输入一个日语单词。
2. App 调用 AI provider（默认 Gemini）生成结构化内容（日语）。
3. 用户预览并可手动修改内容。
4. 用户保存，形成词条并写入本地 JSON 词库文件。
5. 用户在复习页面完成当日到期词条复习。
6. 系统按 SM-2 更新下次复习时间并持久化到 JSON。

## 4. 功能需求
### 4.1 词条生成
- 输入：日语单词（必填）
- 输出字段：
  - `reading_kana`（假名）
  - `meaning_ja`（日语解释）
  - `context_scene_ja`（日语语境场景）
  - `example_sentence_ja`（日语例句）
- 要求：
  - AI 输出为固定 JSON 结构，便于存储与校验
  - 提供“重新生成”按钮
  - 失败时提供可重试提示（网络/额度/解析失败）

### 4.2 词库管理
- 保存词条（以标准化后的 `word` 为唯一键，忽略 `reading_kana` 差异；若已存在则以新内容直接覆盖旧内容）
- 标准化规则：对 `word` 执行 `trim + Unicode NFKC` 后比较
- 列表浏览、搜索（按单词/读音/解释）
- 搜索规则：默认包含匹配；查询词与索引值统一执行 `trim + Unicode NFKC`，拉丁字母转小写；假名搜索对平假名/片假名不敏感
- 编辑词条内容
- 删除词条（含二次确认）

### 4.3 复习系统（SM-2）
- 每个词条维护复习状态：
  - `repetition`（重复次数）
  - `interval_days`（间隔天数）
  - `easiness_factor`（易度系数，EF）
  - `next_review_at`（下次复习时间）
  - `last_review_at`
- 复习评分（0-5）
- 评分后即时更新下一次计划
- 提供“今日待复习”队列
- “今日待复习”判定：`next_review_at <= now` 的词条全部入队（含逾期词条）
- 时间基准：使用系统本地时区；“今日已完成”按本地自然日（00:00-23:59）统计
- 时间持久化统一使用 UTC ISO 8601；“今日”相关判定在本地时区计算；夏令时切换日仍按本地自然日边界统计

### 4.4 设置与 Provider 管理
- 默认 provider：Gemini
- 可配置项：
  - API Key
  - 模型名（默认：`gemini-2.5-flash`）
  - 超时（默认：15 秒）
  - 重试次数（默认：2 次）
- 重试策略：指数退避 `500ms -> 1500ms`（带抖动）；仅对网络错误、超时、429、5xx、JSON 解析失败、非日语输出触发重试；“非日语输出自动重试一次”计入 `retries` 配额
- 预留 provider 抽象，后续可扩展 OpenAI/Anthropic 等

### 4.5 语言规范
- App 内部界面文案全部为日语（按钮、页面名、提示、错误信息）。
- AI 生成字段内容全部为日语（包含解释、场景、例句）。

### 4.6 学习活动 Heat Map
- 提供 `活動` 页面，以 heat map 展示用户最近 `12` 周的学习活跃度。
- 活跃度统计口径：
  - `单词新增次数`：按词条 `created_at` 聚合到系统本地时区自然日
  - `复习次数`：按 `review_logs.reviewed_at` 聚合到系统本地时区自然日
  - 每日活跃度 = `单词新增次数 + 复习次数`
- Heat map 要求：
  - 按日展示强度分级，并突出今天
  - 显示统计摘要：总活动次数、活跃天数、当前连续天数、最长连续天数
  - 当最近 `12` 周无活动时，仍显示空 heat map 与引导文案

## 5. 非功能需求
- 性能：
  - 本地词库 1 万词条内保持流畅
  - 单次 AI 生成请求 UI 不阻塞
- 可用性：
  - AI 失败时不丢失用户输入
  - 自动保存草稿（默认开启）
  - 草稿触发：输入后 800ms 防抖保存；页面切换或窗口关闭前强制保存；词条成功保存后清理对应草稿
  - 草稿作用域：`単語追加` 页面仅维护单份草稿（覆盖式），不按单词保留多份
- 安全性：
  - API Key 本地加密存储（系统密钥链优先）
  - 默认不上传词库到第三方
- 可维护性：
  - AI provider 使用统一接口层
  - JSON 文件结构使用 `schema_version` 管理迁移

## 6. 技术方案（建议）
### 6.1 框架选型
建议采用 `Electron + React + TypeScript + JSON File Store`：
- Electron：生态成熟、跨平台稳定、文档完整，MVP 落地成本更低
- React + TypeScript：UI 迭代快，类型约束强
- JSON 文件：实现成本低，便于直接备份与导入导出

### 6.2 高层架构
- `UI 层`：输入、预览、保存、复习交互（全部日语文案）
- `应用服务层`：
  - WordService（词条 CRUD）
  - ReviewService（SM-2 调度）
  - AIService（统一调用 provider）
- `Provider 层`：GeminiProvider（默认实现）
- `数据层`：JsonRepository + 文件读写适配器（原子写入）

### 6.3 Provider 抽象接口（示例）
```ts
interface AIProvider {
  generateWordCard(input: {
    word: string;
    outputLanguage?: 'ja-JP';
  }): Promise<{
    reading_kana: string;
    meaning_ja: string;
    context_scene_ja: string;
    example_sentence_ja: string;
  }>;
}
```

### 6.4 运行时与依赖版本基线（MVP）
- Node.js：`22 LTS`
- pnpm：`9.x`
- 关键依赖主版本：
  - `electron`：`40.x`
  - `typescript`：`5.x`
  - `react`：`19.x`
  - `vite`：`7.x`
- 锁定策略：
  - `package.json` 使用锁 major 的范围（如 `^40.0.0`）
  - `pnpm-lock.yaml` 提交到仓库，锁定实际解析版本（含 patch）
  - 版本升级顺序：先更新本设计文档，再更新依赖声明与锁文件

## 7. 数据模型设计（JSON）
### 7.1 文件路径与命名
- 建议主文件：`<appDataDir>/kotoba-library.json`
- 建议备份目录：`<appDataDir>/backups/`

### 7.2 顶层结构（示例）
```json
{
  "schema_version": 1,
  "updated_at": "2026-03-02T00:00:00.000Z",
  "words": [],
  "review_logs": []
}
```

### 7.3 `words` 元素结构
```json
{
  "id": "uuid",
  "word": "食べる",
  "reading_kana": "たべる",
  "meaning_ja": "食物を口にして栄養を取ること。",
  "context_scene_ja": "食事の場面や、何かを比喩的に消費する場面。",
  "example_sentence_ja": "毎朝、パンを食べます。",
  "source_provider": "gemini",
  "review_state": {
    "repetition": 0,
    "interval_days": 0,
    "easiness_factor": 2.5,
    "next_review_at": "2026-03-02T00:00:00.000Z",
    "last_review_at": null,
    "last_grade": null
  },
  "created_at": "2026-03-02T00:00:00.000Z",
  "updated_at": "2026-03-02T00:00:00.000Z"
}
```

### 7.4 `review_logs` 元素结构（MVP 必选）
```json
{
  "id": "uuid",
  "word_id": "uuid",
  "grade": 4,
  "reviewed_at": "2026-03-02T00:00:00.000Z",
  "before_state": {},
  "after_state": {}
}
```

### 7.5 文件写入策略
- 采用临时文件 + 覆盖重命名（原子写入）避免中途崩溃导致文件损坏。
- 串行化写入请求，避免并发写冲突。
- 每日首次写入前自动备份一次。
- `review_logs` 从 M1 起记录，默认保留最近 50000 条，超出后按时间淘汰最旧记录。

### 7.6 `schema_version` 迁移策略
- 启动时先做 schema 校验；若版本落后则执行顺序迁移（`vN -> vN+1`）。
- 每次迁移前先创建备份；迁移失败自动恢复最近备份并提示用户。
- 迁移成功后更新 `schema_version` 与 `updated_at`。

## 8. SM-2 规则（落地版）
### 8.1 初始化
新词保存后默认：
- `repetition = 0`
- `interval_days = 0`
- `easiness_factor = 2.5`
- `next_review_at = 当天`

### 8.2 评分更新
输入评分 `q`（0-5）：
- 若 `q < 3`：
  - `repetition = 0`
  - `interval_days = 1`
- 若 `q >= 3`：
  - `repetition += 1`
  - 若 `repetition == 1`，`interval_days = 1`
  - 若 `repetition == 2`，`interval_days = 6`
  - 否则 `interval_days = max(1, round(previous_interval_days * updated_easiness_factor))`

### 8.3 EF 更新
- `easiness_factor = easiness_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`
- 下限保护：`easiness_factor >= 1.3`

### 8.4 下次复习时间
- `next_review_at = now + interval_days`
- `last_review_at = now`
- `last_grade = q`

### 8.5 计算顺序（固定）
1. 读取当前状态与评分 `q`。
2. 先计算 `updated_easiness_factor`（含下限 1.3）。
3. 再计算 `repetition` 与 `interval_days`（第三次及以后使用 `updated_easiness_factor`）。
4. 最后写入 `last_review_at`、`next_review_at`、`last_grade` 并持久化。

## 9. AI 生成策略
### 9.1 Prompt 约束
要求 Gemini 返回 JSON，不允许额外文本；并且所有内容字段使用日语。

示例结构：
```json
{
  "reading_kana": "たべる",
  "meaning_ja": "食物を口にして栄養を取ること。",
  "context_scene_ja": "食事の場面や、何かを比喩的に消費する場面。",
  "example_sentence_ja": "毎朝、パンを食べます。"
}
```

### 9.2 质量控制
- 前后端双重 JSON 校验
- 字段为空时提示用户重试或手动编辑
- 输出长度上限（字符数）：
  - `reading_kana`: 1-32
  - `meaning_ja`: 8-120
  - `context_scene_ja`: 12-160
  - `example_sentence_ja`: 8-80（单句）
- 如检测到非日语输出，自动触发一次重试（计入 `retries` 配额）

## 10. UI 信息架构（MVP）
- 画面 1：`単語追加`
  - 入力欄、生成ボタン、結果プレビュー、保存ボタン
- 画面 2：`単語帳`
  - 一覧、検索、編集、削除
- 画面 3：`復習`
  - 当日カード、評価ボタン（0-5）、進捗
- 画面 4：`設定`
  - Provider、API Key、モデルパラメータ

说明：以上页面名称与控件文案在实际产品中全部使用日语显示。

## 11. 错误处理与边界场景
- 网络错误：提示重试，不清空已输入内容
- API Key 无效：明确提示并引导到设置页
- 模型超时：可取消并重试
- 重复单词：按标准化后的 `word` 判重（忽略 `reading_kana` 差异）；命中时直接覆盖旧词条，并提示“既存の単語を更新しました”
- 无待复习词条：展示“今日已完成”状态
- JSON 文件损坏：自动回退最近备份并提示用户

## 12. 里程碑计划
### M1：可用 MVP（1-2 周）
- 单语（日语）UI
- 新增词条 + Gemini 生成 + JSON 本地保存
- 词库列表与编辑
- 基础 SM-2 复习流程
- review_logs 基础记录

### M2：稳定性增强（1 周）
- 错误重试、日志、备份/恢复
- 基于 review_logs 的统计（复习次数、正确率）
- JSON 迁移（`schema_version` 升级流程）

### M3：体验优化（1 周）
- 快捷键、批量导入导出（CSV/JSON）
- 多 provider 插件化

## 13. 验收标准（MVP）
- 用户可在 Windows 和 macOS 启动并使用应用
- App 内部界面文案为日语
- 输入单词后可获得四项日语 AI 生成内容并可保存
- 词库支持查询、编辑、删除
- 复习页面可按到期词条出题并按 SM-2 更新计划
- 关闭重启后 JSON 词库数据不丢失

## 14. 风险与应对
- AI 输出不稳定：使用严格 JSON schema 校验 + 手动编辑兜底
- Provider 费用/限流：增加请求节流与本地缓存策略
- 本地 JSON 数据损坏：定期自动备份 + 原子写入 + 启动时完整性检查
- 跨平台差异：CI 分别构建 Windows/macOS，关键流程回归测试
