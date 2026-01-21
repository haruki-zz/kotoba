# 数据模型与共享 Schema

## 概述

- 目标：统一词条、复习、设置与 AI 生成的数据定义，确保主进程 API、渲染端表单与校验一致。
- 组成：Zod schema（packages/shared）、SQLite 表结构与迁移（packages/main/src/db/migrations）、数据访问约定（packages/main/src/db/word-repository.ts）。

## 词条字段

- word：必填原词。
- reading/contextExpl/sceneDesc/example：可选，若提供需为非空字符串。
- difficulty：枚举 easy/medium/hard，默认 medium。
- ef：记忆因子，默认 2.5，最小 1.3。
- intervalDays/repetition：整数，默认 0。
- lastReviewAt/nextDueAt：ISO 字符串，可空。
- createdAt/updatedAt：ISO 字符串，必填。

## 共享校验 schema（Zod）

- Word：`wordCoreSchema`（基础字段+默认值）、`wordCreateSchema`、`wordUpdateSchema`、`wordQuerySchema`（search/difficulty/dueBefore/分页）。
- Review：`reviewRequestSchema`（wordId、grade 默认 medium、reviewedAt 默认当前时间）、`reviewResultSchema`（EF/间隔/重复次数/下次时间）。
- Settings：`appSettingsSchema`（reviewBatchSize 默认 30，aiProvider 枚举 openai/gemini/mock，exampleStyle 包含 tone、句长/场景长度范围、theme）。
- AI：`aiGenerateWordRequestSchema`（word、hint、locale、provider、exampleStyle）、`aiGenerateWordResponseSchema`（reading/contextExpl/sceneDesc/example 均为非空字符串）。
- SM-2 常量：EF_MIN/EF_DEFAULT、REVIEW_GRADE_TO_QUALITY（easy=5/medium=4/hard=3）、默认长度范围与批量大小。

## 数据库表与迁移

- 表：`words`（SQLite）
  - 主键：id INTEGER AUTOINCREMENT
  - 字段：word TEXT NOT NULL；reading/context_expl/scene_desc/example TEXT；difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (easy/medium/hard)；ef REAL NOT NULL DEFAULT 2.5 CHECK (>=1.3)；interval_days/repetition INTEGER NOT NULL DEFAULT 0；last_review_at/next_due_at TEXT；created_at/updated_at TEXT NOT NULL。
  - 索引：`idx_words_next_due_at`（next_due_at）、`idx_words_difficulty`（difficulty）。
- 迁移：`packages/main/src/db/migrations/0001_init.ts` 创建表+索引；`applyMigrations` 负责迁移表 `_migrations` 与幂等执行。

## 数据访问约定

- 初始化：`initializeDatabase()` → 打开数据库（env DATABASE_PATH 或默认 data/kotoba.sqlite），执行迁移，返回 { db, words }。
- 仓储：`WordRepository`（packages/main/src/db/word-repository.ts）
  - create(input)：校验+默认值，写入并返回完整记录。
  - getById(id)：按主键返回或 null。
  - list(query)：支持 search（word/reading 模糊）、difficulty 过滤、dueBefore、limit/offset，按 next_due_at（null 置后）+id 排序。
  - listDue(limit?, dueBefore?)：便捷取到期队列（默认 30，截止当前时间）。
  - update(id, partial)：部分更新，自动刷新 updated_at，若空更新则回传当前记录。
  - delete(id)：按主键删除。
- 事务约定：`runInTransaction`（packages/main/src/db/transaction.ts）包装 better-sqlite3 transaction 以复用。
