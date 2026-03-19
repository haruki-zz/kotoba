# Kotoba 实施计划（执行手册版，仅计划不写代码）

## 1. 文档定位
- 依据文档：`/Users/haruki/workspace/kotoba/memory-bank/design-doc.md`（v0.3）与 `/Users/haruki/workspace/kotoba/memory-bank/tech-stack.md`。
- 目标：交付 Windows/macOS 可用的 Electron 桌面应用 MVP，并具备可回归、可恢复、可发布能力。
- 受众假设：你有后端经验、前端经验较少。本计划优先给“可执行命令 + 预期结果”，减少主观判断。
- 约束：本次仅制定计划，不包含代码实现。

## 2. 统一执行约定（先定规矩，再开发）
- 所有步骤都使用同一套脚本名。若脚本不存在，则该步骤视为未完成。
- 约定脚本（后续开发中需逐步补齐）：
  - `pnpm dev`：本地开发运行（Electron + Renderer）
  - `pnpm lint`：ESLint 检查
  - `pnpm format:check`：Prettier 检查
  - `pnpm typecheck`：TypeScript 类型检查
  - `pnpm test:unit`：Vitest 单元测试
  - `pnpm test:e2e`：Playwright Electron 端到端测试
  - `pnpm test`：聚合测试（至少包含 unit）
  - `pnpm build`：生产构建
  - `pnpm package`：打包安装产物
  - `pnpm make:seed-10k`：生成 1 万词条测试数据
  - `pnpm bench:search`：搜索性能基准
  - `pnpm verify`：聚合校验（lint + typecheck + test）
- 建议在 CI 中至少执行：`pnpm lint && pnpm typecheck && pnpm test`。

## 3. 里程碑
- M1（1-2 周）：核心流程可用（新增、保存、复习、设置、review_logs 基础记录）。
- M2（1 周）：稳定性（重试、日志、备份恢复、迁移）。
- M3（1 周）：体验增强（导入导出、快捷键、Provider 扩展）。

## 4. 分步实施计划（每步含命令与指标）

### 步骤 1：环境与版本基线冻结
目标：保证所有人用同一套版本，避免“我这边能跑”的分歧。
执行动作：
1. 固定 Node 22 LTS、pnpm、Electron 40.x、TypeScript 5.x、React 19.x、Vite 7.x。
2. 将关键版本记录到文档与锁文件策略中（锁 major，跟 patch）。
完成判定命令：
1. `node -v`
2. `pnpm -v`
3. `pnpm list electron typescript react vite --depth 0`
通过指标：
- `node -v` 显示 `v22.x`。
- 依赖列表中 Electron/TS/React/Vite major 分别为 `40/5/19/7`。
- 团队机器执行同样命令结果一致（允许 patch 差异）。

### 步骤 2：项目脚手架与安全基线
目标：建立可运行壳工程，并落实 Electron 安全默认值。
执行动作：
1. 建立 Electron + React + TypeScript + Vite 工程结构。
2. 落实 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。
3. 建立 IPC 白名单与参数校验入口。
完成判定命令：
1. `pnpm dev`
2. `pnpm lint`
3. `pnpm typecheck`
通过指标：
- `pnpm dev` 可启动桌面窗口，控制台无未处理异常（`Uncaught`/`Unhandled`）。
- `pnpm lint` 与 `pnpm typecheck` 均退出码 `0`。
- 非白名单 IPC 调用在日志中被拒绝并返回明确错误码。

### 步骤 3：工程质量门禁
目标：把质量检查前置到提交阶段，减少后续返工。
执行动作：
1. 配置 ESLint、Prettier、Husky、lint-staged。
2. 增加聚合检查脚本 `verify`。
完成判定命令：
1. `pnpm lint`
2. `pnpm format:check`
3. `pnpm verify`
通过指标：
- 三条命令全部退出码 `0`。
- 人工制造一个 lint 错误时，`pnpm verify` 必须失败（证明门禁生效）。

### 步骤 4：领域模型与 Schema 固化
目标：把业务规则变成可验证结构，避免“口头约定”。
执行动作：
1. 定义 `Word/ReviewState/ReviewLog/LibraryRoot/Settings` 数据模型。
2. 使用 zod 固化 schema 与字段约束（含 AI 输出长度上限）。
3. 固化 `schema_version=1`。
完成判定命令：
1. `pnpm test:unit -- schema`
2. `pnpm typecheck`
通过指标：
- 合法样例全部通过校验；非法样例（缺字段、超长、类型错）全部被拒绝。
- `schema_version` 缺失或错误时返回可定位错误信息。

### 步骤 5：JSON 存储与原子写入
目标：确保写入不损坏、并发不覆盖、异常可恢复。
执行动作：
1. 实现“临时文件写入 + 原子替换 + 串行写队列”。
2. 实现每日首次写入自动备份。
3. 启动时校验并在损坏时回退最近备份。
完成判定命令：
1. `pnpm test:unit -- repository`
2. `pnpm test:unit -- backup`
3. `pnpm test:unit -- recovery`
通过指标：
- 并发写入测试中最终文件 JSON 可解析且无字段丢失。
- 模拟主文件损坏后，启动流程能恢复到最近备份并给出提示。
- 失败回退后应用可继续读取词库。

### 步骤 6：迁移机制（schema_version）
目标：支持后续版本演进，不破坏已有用户数据。
执行动作：
1. 实现顺序迁移 `vN -> vN+1`。
2. 迁移前强制备份，迁移失败自动回滚。
完成判定命令：
1. `pnpm test:unit -- migration`
2. `pnpm test:unit -- rollback`
通过指标：
- 旧版本样本可迁移到目标版本。
- 故意注入迁移异常时，系统回滚成功，原文件可用。
- 迁移完成后 `schema_version` 与 `updated_at` 正确更新。

### 步骤 7：设置模块与密钥管理
目标：让 Provider 配置可管理且 API Key 不落盘。
执行动作：
1. 实现设置项：`provider/model/timeout/retries`。
2. 默认值固定：`gemini-2.5-flash`、15s、2 次重试。
3. API Key 使用 keytar 存储，不写入词库 JSON。
完成判定命令：
1. `pnpm test:unit -- settings`
2. `pnpm test:unit -- keytar`
通过指标：
- 未配置 API Key 时返回“可引导到设置页”的错误。
- 词库 JSON 检查中不出现明文 API Key。
- 默认设置首次启动自动生效。

### 步骤 8：AI Provider 抽象与 Gemini 接入
目标：稳定产出固定四字段 JSON，失败可重试且可解释。
执行动作：
1. 定义统一 Provider 接口。
2. 实现 Gemini 调用、超时、重试、错误分级。
3. 实现“非日语输出自动重试一次”和双层 JSON 校验。
完成判定命令：
1. `pnpm test:unit -- ai-provider`
2. `pnpm test:unit -- ai-retry`
通过指标：
- 正常输入返回四字段完整 JSON。
- 可重试错误（网络、超时、429、5xx、解析失败）遵循 `500ms -> 1500ms` 退避。
- 非日语输出至少触发 1 次自动重试。

### 步骤 9：单词新增页与草稿机制
目标：打通“输入 -> 生成 -> 编辑 -> 保存”闭环，且失败不丢输入。
执行动作：
1. 完成 `単語追加` 页面与交互。
2. 草稿规则：800ms 防抖保存；切页/关窗前强制保存；保存成功后清理。
3. 保存判重基于标准化 `word`，忽略 `reading_kana`。
完成判定命令：
1. `pnpm test:e2e --grep "word-create"`
2. `pnpm test:e2e --grep "draft"`
3. `pnpm test:e2e --grep "duplicate-word"`
通过指标：
- 断网/超时时输入内容仍可恢复。
- 重复词出现确认弹窗；用户确认后可继续保存。
- 保存成功后重启应用，词条可见且草稿被清理。

### 步骤 10：词库管理页（列表/搜索/编辑/删除）
目标：在 1 万词条规模下保持可用和可维护。
执行动作：
1. 完成 `単語帳` 页面 CRUD。
2. 搜索按 `trim + NFKC + 拉丁小写 + 假名不敏感` 规则执行，字段范围固定为 `word / reading_kana / meaning_ja`。
完成判定命令：
1. `pnpm make:seed-10k`
2. `pnpm bench:search`
3. `pnpm test:e2e --grep "library-crud"`
通过指标：
- `make:seed-10k` 成功生成 1 万词条数据。
- 搜索性能目标：P95 < 150ms（本地开发机基线）。
- CRUD 关键路径 E2E 全通过。

### 步骤 11：SM-2 复习引擎与复习页
目标：算法正确、行为可预测、队列规则与文档一致。
执行动作：
1. 纯函数实现 SM-2，顺序固定（先 EF，再间隔，再时间字段）。
2. 队列规则固定 `next_review_at <= now`，含逾期词条。
3. 本地时区统计“今日完成”。
完成判定命令：
1. `pnpm test:unit -- sm2`
2. `pnpm test:unit -- review-queue`
3. `pnpm test:e2e --grep "review-flow"`
通过指标：
- 文档示例用例计算结果 100% 匹配。
- 评分 0-5 全档位均有测试覆盖。
- 评分后 `review_state` 与 `next_review_at` 立即更新并持久化。

### 步骤 12：review_logs 与统计基础
目标：保证审计可追溯，且日志容量可控。
执行动作：
1. 每次评分写 `before_state/after_state/grade/reviewed_at`。
2. 超过 50000 条后淘汰最旧日志。
完成判定命令：
1. `pnpm test:unit -- review-logs`
2. `pnpm test:unit -- log-retention`
通过指标：
- 任意一条评分操作都能在日志中追溯前后状态。
- 压测后日志总数不超过 50000。

### 步骤 13：全日语 UI 与错误处理收敛
目标：保证语言一致性和错误可恢复体验。
执行动作：
1. 页面、按钮、弹窗、错误文案全部使用日语。
2. 覆盖关键错误：网络失败、超时、API Key 无效、JSON 损坏回退。
完成判定命令：
1. `pnpm test:e2e --grep "i18n-ja"`
2. `pnpm test:e2e --grep "error-handling"`
3. `rg -n "[\u4e00-\u9fff]" src`（仅用于定位疑似 CJK 文案，需人工确认；不作为“中文残留”唯一判定）
通过指标：
- 用户可见文案以 `i18n-ja` E2E + 人工抽检判定为准（`rg` 结果仅作排查线索）。
- 每类关键错误均有明确下一步引导，不导致输入丢失。

### 步骤 14：设置页面与 API Key 配置闭环
目标：让用户可在应用内管理 Gemini 运行参数与 API Key，不再依赖外部写入系统钥匙串。
执行动作：
1. 新增 `設定` 页面，并提供 `API キー / モデル名 / タイムアウト / リトライ回数` 表单。
2. API Key 继续使用 keytar 存储；支持首次保存、更新、删除，并提供“已设置/未设置”状态反馈。
3. 新增设置读取/保存 IPC，保持参数校验、错误映射与全日语文案一致。
4. 覆盖关键回归：保存后重新打开应用仍能读取设置；未设置 API Key 时仍给出引导；删除后生成流程恢复为缺失提示。
完成判定命令：
1. `pnpm test:unit -- settings`
2. `pnpm test:e2e --grep "settings"`
3. `pnpm typecheck`
通过指标：
- 用户可在应用内完成 API Key 的新增、更新、删除。
- `kotoba-settings.json` 仅保存非敏感设置项，明文 API Key 不落盘。
- 设置保存后重启应用仍生效；删除 API Key 后生成请求返回设置引导错误。

### 步骤 15：打包、回归与发布验收
目标：形成可安装产物，并通过 MVP 验收清单。
执行动作：
1. 执行完整质量门禁与回归。
2. 生成 Windows/macOS 安装包。
3. 逐条执行 MVP 验收。
完成判定命令：
1. `pnpm verify`
2. `pnpm build`
3. `pnpm package`
4. `pnpm test:e2e`
通过指标：
- 所有命令退出码 `0`。
- 产物目录出现可安装文件（Windows: `.exe`/`.msi`；macOS: `.dmg`/`.zip`）。
- MVP 验收项全部通过：启动可用、全日语 UI、四字段生成可保存、词库 CRUD、复习更新、重启不丢数据。

## 5. 风险与应对（执行期）
- AI 输出不稳定：JSON 强校验 + 非日语自动重试 + 手动编辑兜底。
- Provider 限流：退避重试 + 错误分级提示 + 后续节流策略。
- 本地数据损坏：原子写入 + 每日备份 + 启动校验回退。
- 跨平台差异：Windows/macOS 双端 E2E 必跑。
- 文档漂移：默认值变更必须同时更新 memory-bank 文档。

## 6. 总体完成定义（DoD）
- 每一步必须同时满足三件事：`命令可执行`、`退出码正确`、`指标达标`。
- 任一步骤失败，不进入下一步开发。
- 合并代码前必须至少通过：`pnpm lint && pnpm typecheck && pnpm test`。
- 发布前必须通过：`pnpm verify && pnpm package && pnpm test:e2e`。
