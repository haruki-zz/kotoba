# 数据校验与存储测试计划

## 目标

- 覆盖共享 Zod schema 默认值/非法输入，验证 SQLite 迁移幂等性与仓储 CRUD 行为，保障 SM-2 相关字段正确存储。

## 校验层（Vitest）

- wordCreateSchema：必填 word 非空，默认 difficulty=medium/ef=2.5/intervalDays=0/repetition=0；拒绝空字符串、ef<1.3。
- wordUpdateSchema：允许部分更新；空对象返回当前记录（由仓储测试覆盖）。
- wordQuerySchema：search 去空格、limit/offset 边界（正整数）。
- reviewRequestSchema：默认 grade=medium、reviewedAt 为 ISO；拒绝非法 grade。
- settings：reviewBatchSize 正数上限、exampleStyle 范围顺序校验，默认 tone/sentence/scene 范围。
- AI schema：必填 word，响应字段非空。

## 数据存储层（better-sqlite3，使用 :memory:）

- 迁移：`applyMigrations` 创建 words + 索引，重复执行无报错；\_migrations 记录正确递增。
- create：写入完整记录，自动填充 created_at/updated_at；可选字段缺省存 null；默认字段持久化（difficulty/ef/intervalDays/repetition）。
- getById：存在返回记录，非存在返回 null。
- list：search 模糊匹配 word/reading；difficulty 过滤；dueBefore 仅返回 next_due_at<=boundary；排序遵循 next_due_at 非空优先、id 次序；分页 limit/offset 生效。
- listDue：默认截止当前时间，尊重 limit；与 list(dueBefore) 一致。
- update：部分字段更新后 updated_at 变化；空 payload 不修改；非法 id 不抛错（仅 0 行受影响）；可写 lastReviewAt/nextDueAt 数值。
- delete：删除后 getById 返回 null，不影响其他记录。

## 事务

- runInTransaction 包裹多步写入（如 create+update）的原子性测试：故意抛错确认回滚、成功路径确认提交。
