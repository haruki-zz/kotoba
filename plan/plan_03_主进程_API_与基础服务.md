# 计划：主进程 API 与基础服务

## 计划概述

### 计划目标
在主进程中搭建 Fastify 服务，提供词条、复习、统计、设置等核心 API，并完成基础中间件与错误处理。

### 在项目中的位置
连接数据层与渲染端，为 SM-2 队列、AI 调用、页面数据提供统一入口。

---

## 依赖关系

### 前置条件
- 前置任务：plan_01 - 工作区搭建与工程规范；plan_02 - 数据模型与数据库
- 前置数据：共享 schema 与字段规则
- 前置环境：Fastify、SQLite 驱动可用，Electron 主进程可启动

### 后续影响
- 后续任务：plan_04 - SM-2 算法与复习队列；plan_05 - AI 生成与 Provider 抽象；plan_07 - 今日学习流；plan_08 - 复习流；plan_09 - 词库管理；plan_10 - 统计与反馈；plan_11 - 设置与偏好
- 产出数据：API 契约、主进程服务骨架、插件化路由

---

## 子任务分解
**每一个子任务都必须小而具体**

- sub_plan_01 - 初始化 Fastify 服务与插件框架
  - 简述：配置启动、路由注册、健康检查与日志
- sub_plan_02 - 接入共享 schema 校验
  - 简述：为请求/响应增加类型与校验绑定
- sub_plan_03 - 构建词条 CRUD 接口
  - 简述：提供创建、查询、更新、删除与批量读取
- sub_plan_04 - 构建复习队列与记录接口
  - 简述：提供队列获取、结果提交、回退支持的入口
- sub_plan_05 - 构建统计与设置接口
  - 简述：提供仪表盘统计、设置读写与默认值管理
- sub_plan_06 - 实施错误处理与安全基础
  - 简述：统一错误格式、参数保护、限流与日志

---

## 技术方案

### 架构设计
主进程内运行 Fastify，采用插件化路由与服务层分离；请求经校验后调用数据访问与业务逻辑。默认桌面模式不对外 listen，渲染端通过 IPC 调用 fastify.inject；统一路由前缀 `/api/v1`，健康检查 `/healthz`。可选 dev/web 模式在 127.0.0.1 listen（严格 CORS allowlist 与鉴权）。

### 核心技术选型
- Fastify：高性能插件化 HTTP 服务
- Zod/JSON schema 绑定：请求校验与类型安全

### 数据模型
复用 plan_02 中的 words 模型，统计聚合基于相同数据源。

### 接口设计
抽象接口类别：
- 词条：创建、列表、详情、更新、删除
- 复习：获取待复习队列、提交结果、回退上一条
- 统计：连续天数、掌握度分布、近期新增/复习计数、高遗忘风险词
- 设置：读取与保存复习队列长度、例句风格、AI provider 等
- 路由前缀：`/api/v1/*`；健康检查：`/healthz`

### 错误与响应规范
- 统一错误响应 ErrorResponse：`{ ok: false, code, message, details?, requestId? }`，code 使用命名空间（VAL_/AUTH_/PERM_/RES_/SRS_/DB_/AI_/SYS_/REQ_/RULE_），消息短小可本地化，details 不含敏感信息。
- HTTP 状态与业务 code 固定映射：400→VAL_/REQ_；401→AUTH_；403→PERM_；404→RES_NOT_FOUND/WORD_NOT_FOUND/SETTINGS_NOT_FOUND；409→RES_CONFLICT/WORD_DUPLICATE/DB_CONSTRAINT；422→SRS_/RULE_；429→AI_RATE_LIMIT/REQ_RATE_LIMIT；502→AI_PROVIDER_BAD_GATEWAY；503→AI_PROVIDER_UNAVAILABLE；500→SYS_/DB_* 其他。
- Zod 校验错误（VAL_INVALID_BODY/QUERY/PARAMS）details：issues（path/code/message）与 fieldErrors（path.join('.') → string[]），保留索引。

### 安全与限流
- 默认 IPC 模式：不启用 CORS/鉴权；方法白名单 GET/POST/PUT/PATCH/DELETE（OPTIONS 仅在 listen+CORS 时）；body 全局 1MB，AI 相关 256KB；限流（按应用实例）：POST `/api/v1/ai/*` 10 次/分钟，其他写 120 次/分钟，读 600 次/分钟；记录 requestId/调用来源。
- 可选 dev/web listen 模式：127.0.0.1 listen，严格 CORS allowlist（Vite dev origin + Electron 协议），credentials=false，allowedHeaders 仅 content-type/authorization/x-request-id；鉴权要求 Bearer token（主进程生成并经 IPC 下发），无 token 返回 401；限流按 IP/token：AI 5 次/分钟/键，其余写 60 次/分钟/键，读 300 次/分钟/键；body/方法白名单同默认。

---

## 执行摘要

### 输入
- 共享 schema 与数据访问约定
- 工作区与主进程运行环境

### 处理
- 启动 Fastify 服务、注册插件
- 实现核心接口并绑定校验与日志
- 完成基础错误处理与安全控制

### 输出
- 可启动的主进程 API 服务
- 已定义的接口契约与错误规范

---

## 验收标准
**验收标准必须清晰明确**

### 功能验收
- 主进程服务可启动，健康检查可用
- 词条、复习、统计、设置接口可返回示例数据
- 请求与响应均通过共享 schema 校验

### 质量验收
- 错误格式统一，日志记录关键事件
- 路由插件化，依赖边界清晰

---

## 交付物清单

### 代码文件
- 主进程服务与路由模块：1 套

### 配置文件
- 服务启动与端口配置：1 份

### 文档
- 接口契约与错误规范说明：1 份

### 测试文件
- API 层测试计划：1 份
