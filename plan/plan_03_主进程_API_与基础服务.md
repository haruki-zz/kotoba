# 计划：主进程 API 与基础服务

## 计划概述

### 计划目标
在主进程中搭建 Electron 壳与 Fastify 服务，提供词条、复习、统计、设置等核心 API，并完成基础中间件与错误处理，确保开发态 `pnpm dev` 可直接在 Electron 窗口查看 UI。

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

- sub_plan_01 - 建立 Electron 壳与窗口加载
  - 简述：在主进程创建 BrowserWindow，开发态优先 `loadURL` 指向 Vite dev server，生产态回退 `loadFile`，确保 `pnpm dev` 后可直接在 Electron 窗口查看 UI；renderer 禁止 Node 权限（`contextIsolation: true`、`nodeIntegration: false`），通过 preload + contextBridge 暴露最小白名单 API（含后端地址下发）；生产默认关闭 DevTools，提供受控开关（如启动参数）便于排障。
- sub_plan_02 - 初始化 Fastify 服务与插件框架
  - 简述：配置启动、路由注册、健康检查与日志，供主进程内服务使用。
- sub_plan_03 - 接入共享 schema 校验
  - 简述：为请求/响应增加类型与校验绑定。
- sub_plan_04 - 构建词条 CRUD 接口
  - 简述：提供创建、查询、更新、删除与批量读取。
- sub_plan_05 - 构建复习队列与记录接口
  - 简述：提供队列获取、结果提交、回退支持的入口。
- sub_plan_06 - 构建统计与设置接口
  - 简述：提供仪表盘统计、设置读写与默认值管理。
- sub_plan_07 - 实施错误处理与安全基础
  - 简述：统一错误格式、参数保护、限流与日志。

---

## 技术方案

### 架构设计
主进程内运行 Electron 壳与 Fastify：启动 BrowserWindow 载入渲染端（dev=Vite server，prod=打包产物），禁用 renderer 端 Node 权限（`contextIsolation: true`、`nodeIntegration: false`），以 preload + contextBridge 提供最小白名单 API（含后端地址下发）；Fastify 采用插件化路由与服务层分离，请求经校验后调用数据访问与业务逻辑。

### 核心技术选型
- Electron：桌面壳与主/渲染进程桥接
- Fastify：高性能插件化 HTTP 服务
- Zod/JSON schema 绑定：请求校验与类型安全
- contextBridge + preload：向渲染端暴露最小 API 与后端地址

### 数据模型
复用 plan_02 中的 words 模型，统计聚合基于相同数据源。

### 接口设计
抽象接口类别：
- 词条：创建、列表、详情、更新、删除
- 复习：获取待复习队列、提交结果、回退上一条
- 统计：连续天数、掌握度分布、近期新增/复习计数、高遗忘风险词
- 设置：读取与保存复习队列长度、例句风格、AI provider 等

---

## 执行摘要

### 输入
- 共享 schema 与数据访问约定
- 工作区与主进程运行环境

### 处理
- 启动 Electron 壳与 BrowserWindow，加载渲染端（开发/生产），通过 preload 暴露后端地址与最小 API
- 启动 Fastify 服务、注册插件
- 实现核心接口并绑定校验与日志
- 完成基础错误处理与安全控制

### 输出
- 可启动的 Electron 壳（含开发/生产入口）与主进程 API 服务
- 已定义的接口契约与错误规范

---

## 验收标准
**验收标准必须清晰明确**

### 功能验收
- 主进程服务可启动，健康检查可用
- 词条、复习、统计、设置接口可返回示例数据
- 请求与响应均通过共享 schema 校验
- 运行 `pnpm dev` 时可自动打开 Electron 窗口并加载渲染端 UI（无需浏览器）
- renderer 运行在无 Node 权限环境，preload 提供后端地址与最小 API，DevTools 默认关闭但可受控开启

### 质量验收
- 错误格式统一，日志记录关键事件
- 路由插件化，依赖边界清晰

---

## 交付物清单

### 代码文件
- Electron 启动与 BrowserWindow 管理：1 套
- 主进程服务与路由模块：1 套

### 配置文件
- 服务启动与端口配置：1 份

### 文档
- 接口契约与错误规范说明：1 份

### 测试文件
- API 层测试计划：1 份
