# 数据库与数据模型

SQLite 本地单库（默认 `data/kotoba.sqlite`，可用环境变量 `DATABASE_PATH` 覆盖）。所有表由 `pnpm db:migrate` 创建，迁移记录写入 `migrations` 表。

## 表结构
- `migrations`：`id`（PK）、`name`、`applied_at`
- `sources`：`id`（PK）、`name`（唯一）、`url`、`note`、`created_at`、`updated_at`
- `tags`：`id`（PK）、`name`（唯一）、`description`、`created_at`、`updated_at`
- `words`
  - 核心：`id`（PK）、`word`、`reading`、`context_expl`、`scene_desc`、`example`
  - 难度/调度：`difficulty`（`easy`/`medium`/`hard`，默认校验）、`ef`（默认 2.5，最低 1.3）、`interval_days`（默认 1）、`repetition`（默认 0）、`last_review_at`、`next_due_at`
  - 关联：`source_id`（nullable，FK→sources）
  - 元数据：`created_at`、`updated_at`
- `word_tags`：`word_id`（FK→words，级联删除）、`tag_id`（FK→tags，级联删除）、`created_at`；复合主键 `(word_id, tag_id)`
- `ai_requests`：`id`（PK）、`trace_id`、`scenario`、`provider`、`word_id`（nullable，FK→words）、`input_json`、`output_json`、`status`（`success`/`error`）、`error_message`、`latency_ms`、`created_at`、`updated_at`
- `app_meta`：`key`（PK）、`value`、`updated_at`（存储备份时间等元信息）

## 索引
- `idx_words_next_due_at`（`next_due_at`）
- `idx_words_difficulty`（`difficulty`）
- `idx_words_lookup`（`word`,`reading`）
- `idx_word_tags_word`（`word_id`）、`idx_word_tags_tag`（`tag_id`）
- `idx_ai_requests_word`（`word_id`）、`idx_ai_requests_created_at`（`created_at`）、`idx_ai_requests_trace`（`trace_id`）

## 数据访问抽象
- 连接与迁移：`src/main/db/connection.ts`、`src/main/db/migrations`、`createDbContext`（`src/main/db/index.ts`）。
- 仓储：`WordRepository`、`TagRepository`、`SourceRepository`（`src/main/db/repositories/`），使用 Zod 校验（`src/shared/schemas`）并输出类型（`src/shared/types`）。

## 备份与恢复
- 备份：`pnpm db:backup`，将当前数据库复制到 `data/backups/kotoba-<timestamp>.sqlite`。
- 恢复：关闭应用后，将备份文件复制回 `DATABASE_PATH`（默认 `data/kotoba.sqlite`），必要时先备份现有文件。
