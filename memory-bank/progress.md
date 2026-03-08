# Kotoba 开发进度记录

## 1. 当前状态
- 记录日期：`2026-03-08`
- 当前阶段：实施计划 `步骤 1`、`步骤 2`、`步骤 3`、`步骤 4` 已完成，且 `步骤 4` 已通过用户验证。
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

### 2.3 对应 plan.md 步骤 3（工程质量门禁）
- 已补齐质量工具链：
  - `prettier`
  - `husky`
  - `lint-staged`
- 已新增/更新质量门禁配置：
  - `package.json` 新增 `format`、`format:check`、`verify`、`prepare`
  - `package.json` 新增 `lint-staged` 规则
  - 新增 `.prettierrc.json` 与 `.prettierignore`
  - 新增 `.husky/pre-commit`（执行 `pnpm lint-staged`）
- 已完成“门禁有效性”验证：
  - 常规校验命令可通过
  - 人工制造 lint 错误时 `pnpm verify` 能按预期失败
  - 清理临时错误后 `pnpm verify` 恢复通过

### 2.4 对应 plan.md 步骤 4（领域模型与 Schema 固化）
- 已新增领域模型与 schema 文件：
  - `src/shared/domain_schema.ts`
  - 覆盖 `Word`、`ReviewState`、`ReviewLog`、`LibraryRoot`、`Settings`
- 已使用 `zod` 固化字段约束：
  - AI 四字段长度上限：`reading_kana 1-32`、`meaning_ja 8-120`、`context_scene_ja 12-160`、`example_sentence_ja 8-80`
  - `schema_version` 固定为 `1` 且错误信息可定位
  - UTC ISO 8601 时间格式约束（`...Z`）
- 已新增 schema 单测：
  - `src/shared/domain_schema.test.ts`
  - 覆盖合法样例通过、缺字段/超长/类型错误拒绝、`schema_version` 缺失/错误定位
- 已补齐测试脚本：
  - `package.json` 新增 `test:unit`、`test`
- 用户验证结论：
  - 第 4 步已确认通过，可作为后续步骤基线

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

## 4. 步骤 3 验证结果快照
- 执行命令：
  - `pnpm lint`
  - `pnpm format:check`
  - `pnpm verify`
- 结果：
  - 三条命令均通过（退出码 `0`）
  - 人工注入 lint 错误后 `pnpm verify` 按预期失败（退出码 `1`），证明门禁生效
  - 删除临时错误文件后，`pnpm verify` 再次通过（退出码 `0`）

## 5. 步骤 4 验证结果快照
- 执行命令：
  - `pnpm test:unit -- schema`
  - `pnpm typecheck`
- 结果：
  - 两条命令均通过（退出码 `0`）
  - `schema` 相关测试共 8 条，全部通过
  - 备注：本机仍为 `node v25.2.1`，会触发 `engines` 警告（目标仍是 `v22.x`）

## 6. 下一步入口
- 下一执行目标：`plan.md` 的 `步骤 5（JSON 存储与原子写入）`。
- 当前建议：
  - 开始步骤 5 前切换到 Node `22.x`，以消除 `engines` 警告并对齐 CI 预期环境。
  - 步骤 5 实现应以 `src/shared/domain_schema.ts` 作为数据校验唯一入口，避免重复定义。
