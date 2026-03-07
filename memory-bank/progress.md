# Kotoba 开发进度记录

## 1. 当前状态
- 记录日期：`2026-03-07`
- 当前阶段：实施计划 `步骤 1` 与 `步骤 2` 已完成，并均已通过用户验证。
- 项目形态：已从纯文档阶段进入“可运行壳工程”阶段（Electron + React + TypeScript + Vite）。

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
  - 白名单频道：`app:ping`
  - 统一错误码：`IPC_ENVELOPE_INVALID`、`IPC_CHANNEL_NOT_ALLOWED`、`IPC_PAYLOAD_INVALID`、`IPC_INTERNAL_ERROR`
  - 非白名单调用会在主进程日志输出拒绝记录并返回明确错误码
- 已补齐步骤 2 所需工程脚本：
  - `pnpm dev`
  - `pnpm lint`
  - `pnpm typecheck`

## 3. 步骤 2 验证结果快照
- 执行命令：
  - `pnpm dev`
  - `pnpm lint`
  - `pnpm typecheck`
- 结果：
  - `pnpm dev`：成功启动（Vite 服务与 main/preload watch 正常；Electron 进程可拉起）
  - `pnpm lint`：通过（退出码 `0`）
  - `pnpm typecheck`：通过（退出码 `0`）
  - 备注：本机仍为 `node v25.2.1`，会触发 `engines` 警告（目标仍是 `v22.x`）

## 4. 下一步入口
- 下一执行目标：`plan.md` 的 `步骤 3（工程质量门禁）`。
- 开始步骤 3 前建议先切换到 Node `22.x`，以消除 `engines` 警告并对齐后续 CI 基线。
