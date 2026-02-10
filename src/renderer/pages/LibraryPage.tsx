import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { WordUpdateWithMetaInput, WordView } from '@shared/types';

import { createTag, deleteTag, fetchTags, updateTag } from '../api/tags';
import {
  batchOperateWords,
  bulkImportWords,
  deleteWord,
  exportWords,
  fetchWords,
  restoreWord,
  updateWord,
  validateWordImport,
} from '../api/words';
import { Skeleton } from '../components/Skeleton';
import { parse_import_text, download_export_json } from '../features/library/import-export';
import { LibraryBatchActions } from '../features/library/library-batch-actions';
import { LibraryEditor } from '../features/library/library-editor';
import { LibraryFilters, TimeFilter } from '../features/library/library-filters';
import { LibraryImportExport } from '../features/library/library-import-export';
import { LibraryList } from '../features/library/library-list';

const PAGE_SIZE = 20;

function time_filter_to_iso(filter: TimeFilter): string | undefined {
  if (filter === 'all') return undefined;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (filter === 'last24h') return new Date(now - day).toISOString();
  if (filter === 'last7d') return new Date(now - 7 * day).toISOString();
  if (filter === 'last30d') return new Date(now - 30 * day).toISOString();
  return undefined;
}

function LibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activeWord, setActiveWord] = useState<WordView | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const updatedAfter = useMemo(() => time_filter_to_iso(timeFilter), [timeFilter]);

  const wordsQuery = useQuery({
    queryKey: [
      'library',
      'words',
      { search, difficulty, selectedTag, updatedAfter, includeDeleted, page },
    ],
    queryFn: () =>
      fetchWords({
        q: search.trim() || undefined,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        tag: selectedTag || undefined,
        updatedAfter,
        includeDeleted,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        orderBy: 'updatedAt',
        order: 'desc',
      }),
    keepPreviousData: true,
    onSuccess: (payload) => {
      const visible = new Set(payload.items.map((item) => item.id));
      setSelectedIds((previous) => {
        const next = new Set<number>();
        previous.forEach((id) => {
          if (visible.has(id)) next.add(id);
        });
        return next;
      });
    },
  });

  const tagsQuery = useQuery({
    queryKey: ['library', 'tags'],
    queryFn: fetchTags,
  });

  const reload_all = () => {
    queryClient.invalidateQueries({ queryKey: ['library', 'words'] });
    queryClient.invalidateQueries({ queryKey: ['library', 'tags'] });
    queryClient.invalidateQueries({ queryKey: ['stats', 'overview'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: WordUpdateWithMetaInput }) => updateWord(id, patch),
    onSuccess: (updated) => {
      setFeedback(`已保存词条：${updated.word}`);
      setActiveWord(updated);
      reload_all();
    },
    onError: (error: unknown) => setFeedback((error as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, hard }: { id: number; hard: boolean }) => deleteWord(id, { hard }),
    onSuccess: (_, variables) => {
      setFeedback(variables.hard ? '词条已永久删除。' : '词条已移入删除状态。');
      setActiveWord(null);
      reload_all();
    },
    onError: (error: unknown) => setFeedback((error as Error).message),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreWord(id),
    onSuccess: (updated) => {
      setFeedback(`已恢复词条：${updated.word}`);
      setActiveWord(updated);
      reload_all();
    },
    onError: (error: unknown) => setFeedback((error as Error).message),
  });

  const batchMutation = useMutation({
    mutationFn: batchOperateWords,
    onSuccess: (result) => {
      setFeedback(`批量操作 ${result.action} 完成，影响 ${result.affected} 条。`);
      setSelectedIds(new Set());
      reload_all();
    },
    onError: (error: unknown) => setFeedback((error as Error).message),
  });

  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: (tag) => {
      setFeedback(`标签已创建：${tag.name}`);
      reload_all();
    },
    onError: (error: unknown) => setFeedback((error as Error).message),
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateTag(id, { name }),
    onSuccess: (tag) => {
      setFeedback(`标签已更新：${tag.name}`);
      reload_all();
    },
    onError: (error: unknown) => setFeedback((error as Error).message),
  });

  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      setFeedback('标签已删除。');
      reload_all();
    },
    onError: (error: unknown) => setFeedback((error as Error).message),
  });

  const importMutation = useMutation({
    mutationFn: bulkImportWords,
    onSuccess: (result) => {
      setImportMessage(`成功导入 ${result.count} 条词条。`);
      setFeedback(`导入完成：${result.count} 条。`);
      reload_all();
    },
    onError: (error: unknown) => {
      setImportMessage((error as Error).message);
    },
  });

  const handle_import_file = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parse_import_text(text);

      if (parsed.errors.length > 0) {
        setImportMessage(
          parsed.errors.slice(0, 3).map((error) => `#${error.index}: ${error.message}`).join(' | ')
        );
        return;
      }

      const validation = await validateWordImport(parsed.rawItems);
      if (validation.invalidCount > 0) {
        setImportMessage(
          validation.errors
            .slice(0, 3)
            .map((issue) => `#${issue.index}: ${issue.message}`)
            .join(' | ')
        );
        return;
      }

      importMutation.mutate({ items: parsed.normalized });
    } catch (error) {
      setImportMessage((error as Error).message);
    }
  };

  const handle_export = async () => {
    const payload = await exportWords({
      q: search.trim() || undefined,
      difficulty: difficulty === 'all' ? undefined : difficulty,
      tag: selectedTag || undefined,
      updatedAfter,
      includeDeleted,
      orderBy: 'updatedAt',
      order: 'desc',
      limit: 5000,
      offset: 0,
    });

    download_export_json(payload.items, `kotoba-library-${new Date().toISOString().slice(0, 10)}.json`);
    setFeedback(`已导出 ${payload.count} 条。`);
  };

  const items = wordsQuery.data?.items ?? [];
  const selectedIdList = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const busy =
    wordsQuery.isFetching ||
    batchMutation.isPending ||
    deleteMutation.isPending ||
    restoreMutation.isPending ||
    updateMutation.isPending ||
    importMutation.isPending;

  return (
    <div className="page-grid">
      <section className="card hero">
        <div>
          <p className="eyebrow">Library</p>
          <h1>词库与内容管理</h1>
          <p className="lede">支持筛选、编辑、软删除恢复、标签管理，以及批量导入导出。</p>
        </div>
        <div className="hero-note">
          <p className="muted">当前结果 {wordsQuery.data?.page.total ?? 0} 条</p>
          <button type="button" className="link-btn" onClick={() => wordsQuery.refetch()}>
            刷新列表
          </button>
        </div>
      </section>

      <section className="card">
        <LibraryFilters
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={() => setPage(0)}
          difficulty={difficulty}
          onDifficultyChange={(value) => {
            setDifficulty(value);
            setPage(0);
          }}
          selectedTag={selectedTag}
          onTagChange={(value) => {
            setSelectedTag(value);
            setPage(0);
          }}
          timeFilter={timeFilter}
          onTimeFilterChange={(value) => {
            setTimeFilter(value);
            setPage(0);
          }}
          includeDeleted={includeDeleted}
          onIncludeDeletedChange={(value) => {
            setIncludeDeleted(value);
            setPage(0);
          }}
          tags={tagsQuery.data ?? []}
          isFetching={wordsQuery.isFetching}
        />

        {feedback ? <p className="muted">{feedback}</p> : null}
        {wordsQuery.isError ? <p className="error-box">加载失败，请稍后重试。</p> : null}
        {wordsQuery.isLoading ? <Skeleton lines={6} /> : null}

        {!wordsQuery.isLoading && items.length === 0 ? <p className="muted">暂无匹配词条。</p> : null}

        {items.length > 0 ? (
          <LibraryList
            items={items}
            selectedIds={selectedIds}
            onToggleSelect={(id) => {
              setSelectedIds((previous) => {
                const next = new Set(previous);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
            onToggleSelectAll={(checked) => {
              if (!checked) {
                setSelectedIds(new Set());
                return;
              }
              setSelectedIds(new Set(items.map((item) => item.id)));
            }}
            onOpenDetail={setActiveWord}
            onSoftDelete={(word) => {
              if (window.confirm(`确认删除词条 “${word.word}”？`)) {
                deleteMutation.mutate({ id: word.id, hard: false });
              }
            }}
            onRestore={(word) => restoreMutation.mutate(word.id)}
          />
        ) : null}

        <div className="pagination">
          <button
            type="button"
            className="btn ghost"
            disabled={page === 0 || wordsQuery.isFetching}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            上一页
          </button>
          <span className="muted">Page {page + 1}</span>
          <button
            type="button"
            className="btn ghost"
            disabled={!wordsQuery.data?.page.hasMore || wordsQuery.isFetching}
            onClick={() => setPage((value) => value + 1)}
          >
            下一页
          </button>
        </div>
      </section>

      <section className="card">
        <LibraryBatchActions
          selectedIds={selectedIdList}
          tags={tagsQuery.data ?? []}
          disabled={busy}
          onSetDifficulty={(value) => batchMutation.mutate({ action: 'setDifficulty', wordIds: selectedIdList, difficulty: value })}
          onSoftDelete={() => {
            if (!window.confirm('确认批量删除已选词条？')) return;
            batchMutation.mutate({ action: 'softDelete', wordIds: selectedIdList });
          }}
          onRestore={() => batchMutation.mutate({ action: 'restore', wordIds: selectedIdList })}
          onAddTags={(names) => batchMutation.mutate({ action: 'addTags', wordIds: selectedIdList, tags: names })}
          onRemoveTags={(names) =>
            batchMutation.mutate({ action: 'removeTags', wordIds: selectedIdList, tags: names })
          }
        />
      </section>

      <LibraryImportExport
        busy={busy}
        importMessage={importMessage}
        onImportFile={handle_import_file}
        onExport={handle_export}
      />

      <LibraryEditor
        word={activeWord}
        tags={tagsQuery.data ?? []}
        pending={busy}
        onClose={() => setActiveWord(null)}
        onSave={(id, patch) => updateMutation.mutate({ id, patch })}
        onSoftDelete={(id) => {
          if (!window.confirm('确认软删除该词条？')) return;
          deleteMutation.mutate({ id, hard: false });
        }}
        onRestore={(id) => restoreMutation.mutate(id)}
        onHardDelete={(id) => {
          if (!window.confirm('确认永久删除该词条？此操作不可恢复。')) return;
          deleteMutation.mutate({ id, hard: true });
        }}
        onCreateTag={(name) => createTagMutation.mutate({ name })}
        onRenameTag={(id, name) => updateTagMutation.mutate({ id, name })}
        onDeleteTag={(id) => {
          if (!window.confirm('确认删除该标签？关联关系将一并移除。')) return;
          deleteTagMutation.mutate(id);
        }}
      />
    </div>
  );
}

export default LibraryPage;
