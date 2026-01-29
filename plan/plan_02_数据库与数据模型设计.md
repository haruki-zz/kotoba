# 计划：数据库与数据模型设计

## 计划概述

### 计划目标
设计并落地本地 SQLite 数据库结构，覆盖词条、调度字段、标签、来源与元数据；以 Drizzle schema 作为单一事实源，生成迁移与 TypeScript 类型，建立访问约束与备份策略。

### 在项目中的位置
作为数据源核心，为调度算法、API、渲染层提供一致的数据模型与持久化能力；主进程集中访问，支撑上层 SM-2 算法与 Library/Review 等功能。

---

## 依赖关系

### 前置条件
- **前置任务**：plan_01 - 环境与基础框架搭建
- **前置数据**：需求中的字段、调度规则、SM-2 数据点
- **前置环境**：`better-sqlite3` 可用；Drizzle CLI/`drizzle-kit` 安装完成

### 后续影响
- **后续任务**：plan_03 - SM-2 调度核心；plan_04 - Fastify API 与数据访问层；plan_05 - AI 辅助功能与提示工程；plan_08 - Library 与内容管理
- **产出数据**：数据库模式定义（Drizzle schema）、迁移脚本、访问抽象接口、备份策略

---

## 子任务分解
**每一个子任务都必须小而具体**

- sub_plan_01 - 梳理实体与字段  
  简述：确认词条、调度、标签、来源等字段及约束（含软删与时间戳）
- sub_plan_02 - 设计表与索引  
  简述：基于 Drizzle schema 定义表结构、索引、唯一性与外键；明确一词一来源（`source_id`）方案
- sub_plan_03 - 迁移与初始化  
  简述：使用 `drizzle-kit` 生成/维护迁移；放置于 `packages/main/src/db/migrations/`，命名 `0001_init.sql` 递增；无需强制种子，仅可选 1~3 条演示词条
- sub_plan_04 - 数据访问抽象  
  简述：在主进程封装 `better-sqlite3` + Drizzle 的 CRUD/批量导入/事务/软删除接口；默认查询过滤 `deleted_at IS NULL`
- sub_plan_05 - 数据质量与备份策略  
  简述：启用 WAL、busy_timeout；制定每日备份与迁移前强制备份，备份到 `<appData>/backups/`，备份后运行 `PRAGMA quick_check`

---

## 技术方案

### 架构设计
本地 SQLite 单库，主进程单连接、串行写；开启 WAL、配置 `busy_timeout`，以 Drizzle schema 描述模式并驱动迁移/类型生成，`better-sqlite3` 提供同步访问。

### 核心技术选型
- **技术1**：SQLite + `better-sqlite3`（同步驱动，主进程内）
- **技术2**：Drizzle (sqlite) 作为查询构建/轻量 ORM 与模式事实源，配合 `drizzle-kit` 生成迁移与 TS 类型
- **运行时校验**：Zod 于 shared 层复用类型/校验

### 数据模型（v1 初稿）
- `words`（词条 + 调度字段合表）  
  - PK：`id INTEGER PRIMARY KEY`  
  - 字段：`word, reading, context_expl, scene_desc, example, difficulty, ef, interval_days, repetition, last_review_at, next_due_at, created_at, updated_at, source_id INTEGER NULL, deleted_at TEXT NULL`  
  - 约束：`UNIQUE(word, reading)`（reading NOT NULL，默认空串）；`FOREIGN KEY(source_id) REFERENCES sources(id)`  
  - 索引：`idx_words_next_due_at(next_due_at)`, `idx_words_difficulty(difficulty)`, `idx_words_updated_at(updated_at)`, `idx_words_deleted_at(deleted_at)`, `idx_words_source_id(source_id)`
- `tags`  
  - PK：`id INTEGER PRIMARY KEY`  
  - 字段：`name TEXT NOT NULL`  
  - 约束：`UNIQUE(name)`
- `word_tags`（词条-标签关联）  
  - PK：`PRIMARY KEY(word_id, tag_id)`  
  - 外键：`word_id → words(id)`, `tag_id → tags(id)`  
  - 索引：`idx_word_tags_tag_id(tag_id)`
- `sources`  
  - PK：`id INTEGER PRIMARY KEY`  
  - 字段：`name TEXT NOT NULL`（v1 可选 `type/meta` 暂不加入）  
  - 约束：`UNIQUE(name)`

### 接口设计
- 数据层提供抽象的读写接口（查询、插入、更新、软删除、批量导入、标签关联维护），默认过滤 `deleted_at IS NULL`
- 事务支持：批量导入/批量打标签/生成落库需事务封装
- 并发策略：单进程单连接，写串行；开启 WAL + `busy_timeout`

### 迁移与版本控制
- 工具：`drizzle-kit`  
- 位置：`packages/main/src/db/migrations/`（纳入版本控制）  
- 命名：有序版本号 + slug（例 `0001_init.sql`, `0002_add_tags.sql`）  
- SQLite 文件：`data/kotoba.sqlite`（gitignored）
- 种子：默认不强制；如需仅提供 1~3 条演示词条 seed

### 备份与一致性
- 频率：每日 1 次自动备份 + 每次迁移前强制备份  
- 存放：`<appData>/backups/`（本地，不上云）  
- 校验：备份后运行 `PRAGMA quick_check`；失败则标记该备份不可用并保留上一次可用备份

---

## 执行摘要

### 输入
- 需求字段列表、SM-2 所需数据点
- Drizzle/`better-sqlite3`/`drizzle-kit` 已可用的开发环境

### 处理
- 建模与约束设计（Drizzle schema）
- 迁移生成与版本化
- 数据访问抽象实现（含事务、软删、批量导入）
- 备份与一致性策略落地

### 输出
- 已版本化的数据库模式与迁移
- 数据访问抽象接口/类型定义
- 备份计划与校验流程

---

## 验收标准
**验收标准必须清晰明确**

### 功能验收
- 数据库模式覆盖调度字段、时间戳、标签、来源与软删字段
- 迁移可在空库上成功创建所有表、索引与约束，命名/位置符合约定
- 数据访问抽象提供 CRUD、批量导入、软删除、事务封装；默认查询排除软删记录

### 质量验收
- 字段类型、默认值、约束、索引定义齐全且与 Drizzle schema/生成类型一致
- 迁移脚本可重复执行并具备有序版本号；Drizzle schema 为单一事实源
- 备份流程按计划可执行，`PRAGMA quick_check` 通过；失败备份被标记不可用

---

## 交付物清单

### 代码文件
- Drizzle schema 定义与 TypeScript 推导（主事实源）
- 迁移文件：`packages/main/src/db/migrations/*.sql`
- 数据访问抽象接口/实现（含事务、批量导入、软删策略）

### 配置文件
- Drizzle/`drizzle-kit` 配置（若需）
- 数据库路径配置与环境变量占位（`data/kotoba.sqlite`，`.env.example` 已含）

### 文档
- 模式说明与字段含义（含索引、约束、软删规则）
- 备份与恢复流程说明（含 quick_check 校验）

### 测试文件
- 数据层验证用例：创建、查询、更新、删除、软删过滤、批量导入、约束校验
