# Kotoba 技术栈选型（最简单且健壮）

## 1. 选型原则
- 单一语言优先：尽量全链路 TypeScript，降低认知与维护成本。
- 本地优先：无后端服务，所有业务在本地完成，避免额外运维复杂度。
- 文件存储优先：严格采用 JSON 文件持久化（符合 `design-doc.md`）。
- 安全默认开启：桌面容器安全选项、API Key 系统级安全存储。
- 依赖最小化：只引入“直接解决需求”的库，避免过度工程。

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

## 4. 推荐版本基线（MVP）
- Node.js: 22 LTS（开发环境）
- Electron: 40.x（锁定同一 major）
- TypeScript: 5.x
- React: 19.x
- Vite: 7.x

说明：MVP 阶段建议“锁 major、跟 patch”，避免频繁升级引发不必要风险。

## 5. 为什么不选更复杂方案
- 不选数据库（SQLite/Postgres）：与你当前设计目标冲突，也增加迁移与维护复杂度。
- 不选 Tauri（当前阶段）：Tauri 很优秀，但会引入 Rust 维护面；对“最简单”目标不如 Electron 直接。
- 不引入重型状态管理（Redux 等）：当前业务规模下，React hooks + 小型 store 足够且更易维护。

## 6. 一句话结论
本项目最合适的技术栈是：**Electron + React + TypeScript + JSON（原子写入与 schema 校验）+ Gemini 官方 SDK**，在保证实现最简单的同时，能稳定覆盖跨平台、数据安全、可维护性和后续扩展需求。
