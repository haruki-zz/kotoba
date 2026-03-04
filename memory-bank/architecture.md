# Kotoba 仓库结构与职责说明（当前快照）

## 1. 架构阶段说明
- 当前仓库仍处于“文档驱动 + 计划执行”阶段。
- 业务代码目录（如 `src/`）尚未创建，当前重点是规格冻结、计划执行与可追踪记录。

## 2. 顶层文件结构
- `AGENTS.md`
  - 仓库协作规范与 AI 开发约束（读取顺序、文档更新规则、技能说明）。
- `plan.md`
  - 实施计划主文档，定义 14 个步骤的目标、命令和通过指标。
- `package.json`
  - 当前仅用于版本基线冻结与依赖主版本约束。
  - 包含 `engines`、`packageManager`、`check:versions` 脚本。
- `pnpm-lock.yaml`
  - 锁定依赖解析结果（patch 级别），保证团队和 CI 结果可复现。
- `.nvmrc`
  - 声明本项目目标 Node 主版本（`22`）。
- `prompts/`
  - 存放编码原则等提示文档，当前含 `coding-principles.md`。
- `memory-bank/`
  - 存放长期记忆文档（需求、技术、架构、进度）。

## 3. memory-bank 文档职责
- `memory-bank/design-doc.md`
  - 产品需求与行为规范的事实来源（source of truth）。
  - 当前版本：`v0.4`（`2026-03-04`）。
- `memory-bank/tech-stack.md`
  - 技术栈与实现默认值快照，需与 `design-doc.md` 保持一致。
- `memory-bank/progress.md`
  - 记录“已完成步骤、验证证据、下一步入口”，供后续 AI 快速接续工作。
- `memory-bank/architecture.md`
  - 记录仓库结构、文件职责、后续代码落位约定（本文档）。

## 4. 当前信息流与更新规则
- 需求或行为变更：先改 `memory-bank/design-doc.md`，再同步 `memory-bank/tech-stack.md`。
- 执行步骤完成后：必须更新 `memory-bank/progress.md`，写明命令与验证结果。
- 架构或目录变化后：更新 `memory-bank/architecture.md`，避免后续 AI 误判目录职责。

## 5. 下一阶段预计新增结构（步骤 2 起）
- 预计新增应用代码目录（待步骤 2 确定）：
  - `src/main`（Electron 主进程）
  - `src/preload`（预加载与 IPC 白名单）
  - `src/renderer`（React 界面层）
- 预计新增工程配置（待步骤 2/3）：
  - TypeScript、ESLint、Prettier、Electron Forge/Vite 相关配置文件
  - 测试目录与脚本（Vitest/Playwright）
