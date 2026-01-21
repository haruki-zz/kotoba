# 计划：工作区搭建与工程规范

## 计划概述

### 计划目标
建立符合 pnpm 工作区的工程骨架、目录与基础脚手架，统一格式、校验与运行指令。

### 在项目中的位置
为后续数据、主进程、渲染端、AI 能力与测试提供可用的开发环境与统一规范。

---

## 依赖关系

### 前置条件
- 前置任务：plan_00 - 总体实施计划
- 前置数据：目录约定、工具链版本确认
- 前置环境：Node.js、pnpm、Git 可用（版本采用当下 LTS，TypeScript/ESLint/Prettier/Vite 同步 LTS，不锁定具体号）

### 后续影响
- 后续任务：plan_02 - 数据模型与数据库；plan_03 - 主进程 API 与基础服务；plan_06 - 渲染端基础框架与设计体系；plan_12 - 测试与质量保障
- 产出数据：工作区配置、基础脚本、格式化与校验规则

---

## 子任务分解
**每一个子任务都必须小而具体**

- sub_plan_01 - 初始化工作区结构
  - 简述：创建 packages/main、packages/renderer、packages/shared 及 data、scripts 基础目录
- sub_plan_02 - 配置包管理与运行脚本
  - 简述：声明 workspace 配置、常用脚本（dev、build、lint、format、test），提交前自动跑检查
- sub_plan_03 - 设置代码规范与校验
  - 简述：接入 ESLint、Prettier、TypeScript 基线规则
- sub_plan_04 - 定义环境与变量管理
  - 简述：确定 .env.local 示例（包含 GEMINI_API_KEY、OPENAI_API_KEY，暂不区分环境）、敏感信息忽略策略
- sub_plan_05 - 文档化工程规范
  - 简述：记录目录约定、命名规范、提交流程与运行方式

---

## 技术方案

### 架构设计
单仓多包工作区，主进程、渲染端、共享类型分离；脚本统一由根目录调度。

### 核心技术选型
- pnpm 工作区：高效包管理与去重
- ESLint + Prettier：统一格式与语法规范（使用 LTS 版本，无版本锁定）

### 数据模型
无业务数据模型，仅约定目录与配置结构。

### 接口设计
无业务接口；定义常用脚本入口作为开发接口。

---

## 执行摘要

### 输入
- 总体计划指引
- 工具链版本与目录约束（Node/pnpm/TS/ESLint/Prettier/Vite 采用当前 LTS）

### 处理
- 创建目录与 workspace 配置
- 配置 lint/format/test 脚本与规则

### 输出
- 根级工作区配置、基础脚本与规范文档

---

## 验收标准
**验收标准必须清晰明确**

### 功能验收
- 存在 packages/main、packages/renderer、packages/shared、data、scripts 目录
- 根级可执行 dev、build、lint、format、test 脚本，提交前可自动运行 lint/format/test

### 质量验收
- ESLint 与 Prettier 规则可运行且无报错
- 环境变量示例与忽略策略明确，包含 GEMINI_API_KEY、OPENAI_API_KEY

---

## 交付物清单

### 代码文件
- 工作区配置文件：1 套，定义分包与脚本

### 配置文件
- 代码规范与环境变量示例：各 1 份

### 文档
- 工程规范说明：1 份

### 测试文件
- 无新增测试
