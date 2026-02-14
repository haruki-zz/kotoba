# Release Runbook (plan_10)

## 1. Scope

当前版本发布产物为 `dist/renderer` 静态构建及校验清单。Electron 壳（plan_06）未落地前，不执行桌面安装包签名。

## 2. Versioning

- 使用 `package.json` 中的 `version` 作为发布版本。
- 推荐 tag：`v<version>`，例如 `v0.1.0`。

## 3. Pre-release Checklist

1. `pnpm install --frozen-lockfile`
2. `pnpm ci:verify`
3. 确认 `reports/quality-gate.md` 为 `PASS`

## 4. Build Artifacts

1. `pnpm release:prepare`
2. 输出：
   - `dist/renderer/**`
   - `dist/release/manifest-v<version>.json`

`manifest` 包含文件路径、大小、SHA-256，可用于分发后完整性校验。

## 5. CI Release Flow

- workflow: `.github/workflows/release.yml`
- 触发：`push tags v*` 或手动 `workflow_dispatch`
- 阶段：install -> ci:verify -> release:prepare -> upload artifacts

## 6. Signing Plan (post plan_06)

待 Electron 打包接入后追加：

1. macOS: Developer ID Application + notarization
2. Windows: code signing certificate
3. 在 release workflow 中增加平台矩阵和签名密钥注入

## 7. Rollback

1. 保留最近三个稳定版本工件与 manifest
2. 回滚时切换到前一版本 tag 对应工件
3. 若发现数据兼容风险，优先发布修复版本，避免直接覆盖用户本地数据库
