import { applyDifficultyReview } from '@shared/sm2';
import {
  BulkImportInput,
  ReviewQueueQuery,
  ReviewRequestInput,
  StatsOverview,
  WordCreateWithMetaInput,
  WordListQuery,
  WordView,
  WordUpdateWithMetaInput,
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

  delete(id: number): boolean {
    return this.wordRepo.delete(id);
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
