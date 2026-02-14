# Kotoba

本仓库为单包（single-package）TypeScript 项目，包含 Fastify + SQLite 主进程能力与 React/Vite 渲染层。

## 快速开始

```bash
pnpm install
pnpm dev          # 渲染层开发
pnpm dev:api      # 本地 Fastify API（默认 127.0.0.1:8787）
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 质量与发布命令

```bash
pnpm test:ci         # 生成 JUnit 报告（reports/junit.xml）
pnpm perf:baseline   # 性能基线检查
pnpm smoke:stability # 稳定性烟测
pnpm quality:gate    # 聚合门禁并生成 reports/quality-gate.md
pnpm ci:verify       # 本地复现 CI 全流程
pnpm release:prepare # 构建 + release manifest
```

## 目录约定

- `src/main`：主进程、Fastify API、数据库与服务层
- `src/renderer`：React 页面、组件、状态与 API 客户端
- `src/shared`：跨进程共享 schema 与类型
- `scripts`：迁移、备份、质量门禁、发布脚本
- `docs/testing-strategy.md`：测试分层与门禁定义
- `docs/release-runbook.md`：发布与回滚流程

## 环境变量

复制 `.env.example` 为 `.env.local`，填写 `OPENAI_API_KEY` / `GEMINI_API_KEY` 等敏感信息；`DATABASE_PATH` 默认 `./data/kotoba.sqlite`。
