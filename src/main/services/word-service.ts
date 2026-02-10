import { applyDifficultyReview } from '@shared/sm2';
import {
  BulkImportInput,
  ImportValidationIssue,
  ImportValidationRequest,
  ImportValidationResponse,
  ReviewQueueQuery,
  ReviewRequestInput,
  StatsOverview,
  WordBatchRequest,
  WordBatchResponse,
  WordCreateWithMetaInput,
  WordDeleteQuery,
  WordExportQuery,
  WordExportResponse,
  WordListQuery,
  WordView,
  WordUpdateWithMetaInput,
  wordCreateWithMetaSchema,
} from '@shared/types';

import { DatabaseClient } from '../db/connection';
import { SourceRepository } from '../db/repositories/source-repository';
import { TagRepository } from '../db/repositories/tag-repository';
import { WordRepository, WordSearchParams } from '../db/repositories/word-repository';
import { nowIso } from '../db/time';

const orderFieldMap: Record<WordListQuery['orderBy'], 'next_due_at' | 'created_at' | 'updated_at'> = {
  nextDueAt: 'next_due_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

type WordListResult = {
  items: WordView[];
  total: number;
  limit: number;
  offset: number;
};

export class WordService {
  constructor(
    private db: DatabaseClient,
    private wordRepo: WordRepository,
    private tagRepo: TagRepository,
    private sourceRepo: SourceRepository
  ) {}

  private attachRelations(words: ReturnType<WordRepository['getById']>[]): WordView[] {
    const validWords = words.filter((word): word is NonNullable<typeof word> => Boolean(word));
    if (validWords.length === 0) return [];

    const wordIds = validWords.map((word) => word.id);
    const tagMap = this.tagRepo.listByWordIds(wordIds);
    const sourceIds = Array.from(
      new Set(validWords.map((word) => word.sourceId).filter((id): id is number => typeof id === 'number'))
    );
    const sources = this.sourceRepo.findByIds(sourceIds);
    const sourceMap = new Map(sources.map((source) => [source.id, source] as const));

    return validWords.map((word) => ({
      ...word,
      tags: tagMap[word.id] ?? [],
      source: word.sourceId ? sourceMap.get(word.sourceId) ?? null : null,
    }));
  }

  private toSearchParams(query: WordListQuery): WordSearchParams {
    const difficulties = Array.isArray(query.difficulty)
      ? query.difficulty
      : query.difficulty
        ? [query.difficulty]
        : [];
    const tagNames = Array.isArray(query.tag) ? query.tag : query.tag ? [query.tag] : [];

    return {
      query: query.q?.trim() || undefined,
      difficulties: difficulties.length ? difficulties : undefined,
      tagNames: tagNames.length ? tagNames : undefined,
      sourceId: query.sourceId,
      dueBefore: query.dueBefore,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
      updatedAfter: query.updatedAfter,
      updatedBefore: query.updatedBefore,
      includeDeleted: query.includeDeleted,
      onlyDeleted: query.onlyDeleted,
      limit: query.limit,
      offset: query.offset,
      orderBy: orderFieldMap[query.orderBy],
      order: query.order === 'desc' ? 'DESC' : 'ASC',
    };
  }

  create(input: WordCreateWithMetaInput): WordView {
    const word = this.wordRepo.create(input, {
      tagNames: input.tags,
      sourceName: input.source?.name,
      sourceUrl: input.source?.url ?? null,
      sourceNote: input.source?.note,
    });
    return this.attachRelations([word])[0];
  }

  update(id: number, patch: WordUpdateWithMetaInput): WordView | undefined {
    const { tags, source, ...wordPatch } = patch;
    const options = source
      ? {
          sourceName: source.name,
          sourceUrl: source.url ?? null,
          sourceNote: source.note,
        }
      : undefined;

    if (source === null) {
      (wordPatch as { sourceId?: number | null }).sourceId = null;
    }

    const updated = this.wordRepo.update(id, wordPatch, {
      ...(options ?? {}),
      tagNames: tags !== undefined ? tags : undefined,
    });

    if (!updated) return undefined;
    return this.attachRelations([updated])[0];
  }

  delete(id: number, query: WordDeleteQuery): boolean {
    return query.hard ? this.wordRepo.hardDelete(id) : Boolean(this.wordRepo.softDelete(id));
  }

  restore(id: number): WordView | undefined {
    const restored = this.wordRepo.restore(id);
    if (!restored) return undefined;
    return this.attachRelations([restored])[0];
  }

  getById(id: number): WordView | undefined {
    const word = this.wordRepo.getById(id);
    return this.attachRelations([word])[0];
  }

  list(query: WordListQuery): WordListResult {
    const params = this.toSearchParams(query);
    const result = this.wordRepo.search(params);
    const items = this.attachRelations(result.items);
    return {
      items,
      total: result.total,
      limit: params.limit,
      offset: params.offset,
    };
  }

  queue(query: ReviewQueueQuery): WordView[] {
    const asOf = query.asOf ?? nowIso();
    const records = this.wordRepo.listDue(query.limit, asOf);
    return this.attachRelations(records);
  }

  review(id: number, payload: ReviewRequestInput): WordView | undefined {
    const existing = this.wordRepo.getById(id);
    if (!existing) return undefined;

    const next = applyDifficultyReview(
      payload.difficulty,
      {
        ef: existing.ef,
        intervalDays: existing.intervalDays,
        repetition: existing.repetition,
        lastReviewAt: existing.lastReviewAt,
        nextDueAt: existing.nextDueAt,
      },
      payload.reviewedAt
    );

    const updated = this.wordRepo.update(id, {
      difficulty: payload.difficulty,
      ef: next.ef,
      intervalDays: next.intervalDays,
      repetition: next.repetition,
      lastReviewAt: next.lastReviewAt,
      nextDueAt: next.nextDueAt,
    });

    if (!updated) return undefined;
    return this.attachRelations([updated])[0];
  }

  bulkImport(payload: BulkImportInput): WordView[] {
    const run = this.db.transaction((items: WordCreateWithMetaInput[]) =>
      items.map((item) =>
        this.wordRepo.create(item, {
          tagNames: item.tags,
          sourceName: item.source?.name,
          sourceUrl: item.source?.url ?? null,
          sourceNote: item.source?.note,
        })
      )
    );

    const inserted = run(payload.items);
    return this.attachRelations(inserted);
  }

  validateImport(payload: ImportValidationRequest): ImportValidationResponse {
    const errors: ImportValidationIssue[] = [];
    const invalidIndices = new Set<number>();

    payload.items.forEach((item, index) => {
      const parsed = wordCreateWithMetaSchema.safeParse(item);
      if (!parsed.success) {
        invalidIndices.add(index);
        parsed.error.issues.forEach((issue) => {
          const field = issue.path.map(String).join('.');
          errors.push({
            index,
            message: issue.message,
            field: field || undefined,
          });
        });
      }
    });

    const total = payload.items.length;
    return {
      total,
      validCount: total - invalidIndices.size,
      invalidCount: invalidIndices.size,
      errors,
    };
  }

  exportWords(query: WordExportQuery): WordExportResponse {
    const result = this.list(query);
    return {
      exportedAt: nowIso(),
      count: result.items.length,
      items: result.items,
    };
  }

  batchOperate(payload: WordBatchRequest): WordBatchResponse {
    const includeDeleted = payload.action === 'restore';
    const existingIds = this.wordRepo.findExistingIds(payload.wordIds, includeDeleted);
    const existingSet = new Set(existingIds);
    const missingIds = payload.wordIds.filter((id) => !existingSet.has(id));
    let affected = 0;

    if (existingIds.length > 0) {
      switch (payload.action) {
        case 'setDifficulty':
          affected = this.wordRepo.batchSetDifficulty(existingIds, payload.difficulty);
          break;
        case 'softDelete':
          affected = this.wordRepo.batchSoftDelete(existingIds);
          break;
        case 'restore':
          affected = this.wordRepo.batchRestore(existingIds);
          break;
        case 'addTags':
          affected = this.wordRepo.batchAddTags(existingIds, payload.tags);
          break;
        case 'removeTags':
          affected = this.wordRepo.batchRemoveTags(existingIds, payload.tags);
          break;
      }
    }

    return {
      action: payload.action,
      affected,
      missingIds,
    };
  }

  stats(asOfIso = nowIso()): StatsOverview {
    const totalWords = this.wordRepo.countAll();
    const dueCount = this.wordRepo.countDue(asOfIso);
    const difficultyCounts = this.wordRepo.countByDifficulty();

    const startOfDay = new Date(asOfIso);
    startOfDay.setHours(0, 0, 0, 0);
    const todayNewCount = this.wordRepo.countCreatedSince(startOfDay.toISOString());

    return {
      totalWords,
      dueCount,
      difficultyCounts,
      todayNewCount,
    };
  }
}
