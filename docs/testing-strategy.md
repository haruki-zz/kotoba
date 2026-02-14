# Testing Strategy (plan_10)

## 1. Test Layers

- `Unit`（高优先级）
  - 目标：纯函数、schema、设置工具等无 IO 逻辑。
  - 位置：`src/shared/__tests__`、`src/renderer/features/**/__tests__`。
- `Integration`（高优先级）
  - 目标：SQLite 仓储、服务层、Fastify 路由闭环。
  - 位置：`src/main/__tests__`、`src/main/services/__tests__`、`src/main/api/__tests__`。
- `UI Interaction`（高优先级）
  - 目标：Home/Today/Review/Library/Settings 关键交互路径。
  - 位置：`src/renderer/pages/__tests__`。
- `Performance Baseline`（中优先级）
  - 目标：以固定数据规模验证核心路径耗时不退化。
  - 命令：`pnpm perf:baseline`。
- `Stability Smoke`（中优先级）
  - 目标：循环调用 API 关键路径，发现长期运行异常和显著内存漂移。
  - 命令：`pnpm smoke:stability`。

## 2. Quality Gates

- 必须通过：
  - `pnpm lint`
  - `pnpm test:ci`
  - `pnpm build:renderer`
  - `pnpm perf:baseline`
  - `pnpm smoke:stability`
  - `pnpm quality:gate`
- 当前门禁阈值：
  - junit `failures=0` 且 `errors=0`
  - 最小测试数量：`QUALITY_MIN_TESTS`（默认 25）
  - perf/smoke 报告中的 `passed=true`

## 3. Reports

- `reports/junit.xml`：Vitest JUnit 结果（CI 归档）
- `reports/perf-baseline.json`：性能基线结果
- `reports/stability-smoke.json`：稳定性烟测结果
- `reports/quality-gate.md`：门禁汇总报告

## 4. CI Mapping

- workflow: `.github/workflows/ci.yml`
- 执行顺序：install -> lint -> test -> build -> perf -> smoke -> quality gate -> artifact upload
- 失败策略：任一门禁失败直接阻断合并。

## 5. Coverage Note

- 项目目前未安装 `@vitest/coverage-v8`，因此未在 CI 强制覆盖率阈值。
- 当安装 coverage provider 后，将在 `test:coverage` 基础上新增行/分支阈值，并并入 `quality:gate`。
