# 日语单词记忆桌面应用设计文档

## 应用定位与目标
- 面向希望系统化记忆日语词汇的用户，提供新增、复习、活跃度可视化的跨平台桌面工具（macOS/Windows）。
- 以本地存储为核心，数据可离线访问；AI 仅在生成词条内容时调用。
- 设计偏扁平、简洁，卡片实时渲染、不落地图片。

## 核心功能
1) 新增单词（AI/手动）：用户输入单词，默认调用 AI 生成平假名读音、日文释义、例句；若 AI 不可用/超时，允许用户手动填写并保存。结果以 JSON 持久化。  
2) 单词卡片：正面仅显示单词；背面含单词、平假名读音、日文释义、日文例句；点击翻面。  
3) 复习单词：按 SM-2 抽取待复习词，队列呈现卡片，用户标记记忆程度。  
4) 单词库：列表浏览全部单词，按 50 音顺排序；可选择单词，修改读音/释义/例句，或删除该单词。  
5) 每日活跃度：GitHub 贡献度式方格，展示每日新增量与复习 session 次数（session 定义为一次复习流程的开始/结束，而非单词数）。

## 用户流（简要）
- 新增（AI/手动）：输入单词 -> 触发 AI，若失败/离线则提示手动填写 -> 展示生成/手填内容 -> 用户确认保存（允许编辑） -> 写入本地 JSON。
- 复习：进入复习 -> 系统用 SM-2 生成队列 -> 卡片翻面/打分 -> 更新 SM-2 字段、记录 session。
- 单词库：进入列表（50 音顺） -> 点选单词 -> 编辑读音/释义/例句并保存，或删除该词（从词库与复习队列移除）。
- 活跃度：按日聚合新增/复习 session -> 方格热力展示。

## 技术架构
- 框架：Electron + React/Vite（固定栈），Node 主进程管理文件读写、AI 请求。
- 渲染进程：前端状态管理（如 Zustand/Recoil），组件化卡片与统计视图。
- 主进程：文件系统访问、AI API 调用、进程间通信（IPC）。
- 打包：electron-builder 生成 macOS dmg/zip 与 Windows nsis/portable。

## 数据与存储
- 存储位置：应用数据目录（Electron `app.getPath('userData')`），使用人类可读的 JSON 文件。
- 词库文件 `words.jsonl`（一行一条 JSON，便于 append；编辑/删除时全量重写到临时文件再替换；删除会同步清理该 `word_id` 的复习记录）示例：
  ```json
  {
    "id": "uuid",
    "word": "勉強",
    "hiragana": "べんきょう",
    "definition_ja": "学ぶこと。ある分野について学習する行為。",
    "example_ja": "試験の前夜に友達と図書館で勉強した。",
    "created_at": "2024-05-01T12:00:00Z",
    "source": "user-input+ai",
    "sm2": {
      "repetition": 0,
      "interval": 1,
      "ef": 2.5,
      "next_review_at": "2024-05-02T12:00:00Z",
      "last_score": null
    }
  }
  ```
- 复习日志 `reviews.jsonl`（记录 session 与单词打分）示例：
  ```json
  {
    "session_id": "uuid",
    "word_id": "uuid",
    "score": 4,
    "reviewed_at": "2024-05-01T12:30:00Z"
  }
  ```
- 复习 Session 记录 `sessions.jsonl`（记录 session 开始/结束与数量）示例：
  ```json
  {
    "session_id": "uuid",
    "started_at": "2024-05-01T12:00:00Z",
    "ended_at": "2024-05-01T12:10:00Z",
    "review_count": 12
  }
  ```
- 活跃度数据 `activity.json`：按日聚合 `{ "2024-05-01": { "added": 5, "sessions": 2 } }`。
- 时间统一使用秒级 UTC ISO 字符串（`YYYY-MM-DDTHH:mm:ssZ`），字段含 `created_at/reviewed_at/next_review_at/started_at/ended_at` 等，活跃度展示按本地日归档（渲染时将 UTC 转为本地日）。
- 导入/导出：支持 JSON（含 JSONL）导入，导出支持 JSON 与 CSV。导入时去重规则：`id` 冲突则跳过新记录；若 `word+hiragana` 已存在则提示冲突并默认跳过（用户可选择覆盖），新建记录缺失 `id` 时自动生成。
- 活跃度重算：导入或批量修改后，可依据 `words.jsonl` 与 `sessions.jsonl` 重新聚合生成 `activity.json` 以矫正计数。

## AI 生成流程
- 输入：用户提供原始单词（允许汉字/假名/外来语）。
- 提示词要点：生成平假名、日文释义（含语境/用法说明）、一条自然的日文例句；保持简洁，避免罗马音。
- API：首批支持 OpenAI 与 Google（实现时需按官方 API 文档规范调用），主进程封装，并保留可扩展的提供商列表接口以便后续接入更多模型。
- 质量控制：前端允许用户在保存前编辑生成内容；限制响应长度，超时/错误提供降级提示。AI 不可用时提供纯手动录入表单并提示用户。

## 复习与 SM-2 细节
- 评分区间 0-4（0 完全不会，4 完全熟练）。
- 更新规则：
  - 初始：`repetition=0, interval=1, ef=2.5`。
  - 若 score < 3：`repetition=0, interval=1`；否则按 SM-2 公式更新 `ef` 与 `interval`，`ef` 下限 1.3。
  - 间隔向上取整天数，`interval = max(1, ceil(interval))`。
  - 计算 `next_review_at = now + interval(days)`。
- 队列生成：优先筛选 `next_review_at <= now` 的词按时间升序；若数量不足，按 `next_review_at` 距当前时间最近的顺序补足队列（使用秒级 UTC）。
- Session 计数：每次进入复习流程即创建 session_id，结束（或退出）时记录一次；session 详情写入 `sessions.jsonl`，活跃度按 session 条目计数。

## UI 与交互（简要）
具体参见 UI 设计文档。(UI-design-document.md)

## 错误处理与稳定性
- AI 请求失败/超时：提示重试，保持用户已输入内容，允许手工填写并直接保存。
- 文件写入失败：提示检查磁盘权限/空间；写入采用临时文件+替换以防损坏。
- 数据校验：保存前验证必填字段；防止空字段进入词库。导入时校验格式并输出重复/覆盖的统计。

## 安全与隐私
- 数据默认仅存本地；不自动上传。
- API Key 加密存储于系统安全存储（macOS Keychain / Windows Credential Vault），IPC 不回传完整 key。
- 允许用户导出/删除全部数据。

## 非功能与性能
- 启动时间控制在 2-3 秒内；词库规模数万条仍应流畅（JSONL 流式加载 + 内存索引）。
- 主进程与渲染进程通信保持幂等接口；关键写入有简单日志方便调试。
