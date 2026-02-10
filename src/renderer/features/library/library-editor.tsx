import React, { useEffect, useMemo, useState } from 'react';

import { TagRecord, WordUpdateWithMetaInput, WordView } from '@shared/types';

type Props = {
  word: WordView | null;
  tags: TagRecord[];
  pending: boolean;
  onClose: () => void;
  onSave: (wordId: number, patch: WordUpdateWithMetaInput) => void;
  onSoftDelete: (wordId: number) => void;
  onRestore: (wordId: number) => void;
  onHardDelete: (wordId: number) => void;
  onCreateTag: (name: string) => void;
  onRenameTag: (tagId: number, name: string) => void;
  onDeleteTag: (tagId: number) => void;
};

type FormState = {
  word: string;
  reading: string;
  contextExpl: string;
  sceneDesc: string;
  example: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  sourceName: string;
  sourceUrl: string;
  sourceNote: string;
};

function to_form_state(word: WordView): FormState {
  return {
    word: word.word,
    reading: word.reading,
    contextExpl: word.contextExpl,
    sceneDesc: word.sceneDesc,
    example: word.example,
    difficulty: word.difficulty,
    tags: word.tags.map((tag) => tag.name).join(', '),
    sourceName: word.source?.name ?? '',
    sourceUrl: word.source?.url ?? '',
    sourceNote: word.source?.note ?? '',
  };
}

function parse_tags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

export function LibraryEditor({
  word,
  tags,
  pending,
  onClose,
  onSave,
  onSoftDelete,
  onRestore,
  onHardDelete,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [renameTagId, setRenameTagId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!word) {
      setForm(null);
      return;
    }
    setForm(to_form_state(word));
  }, [word]);

  const allTagNames = useMemo(() => tags.map((tag) => tag.name), [tags]);

  if (!word || !form) return null;

  return (
    <div className="library-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="library-modal" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="section-head">
          <div>
            <p className="eyebrow">编辑词条 #{word.id}</p>
            <h2>{word.word}</h2>
          </div>
          <button type="button" className="link-btn" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="library-editor-grid">
          <label className="label">单词</label>
          <input value={form.word} onChange={(event) => setForm({ ...form, word: event.target.value })} />

          <label className="label">假名</label>
          <input value={form.reading} onChange={(event) => setForm({ ...form, reading: event.target.value })} />

          <label className="label">难度</label>
          <select
            value={form.difficulty}
            onChange={(event) =>
              setForm({ ...form, difficulty: event.target.value as 'easy' | 'medium' | 'hard' })
            }
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <label className="label">情景解释</label>
          <textarea
            value={form.contextExpl}
            onChange={(event) => setForm({ ...form, contextExpl: event.target.value })}
          />

          <label className="label">场景描述</label>
          <textarea
            value={form.sceneDesc}
            onChange={(event) => setForm({ ...form, sceneDesc: event.target.value })}
          />

          <label className="label">例句</label>
          <textarea
            value={form.example}
            onChange={(event) => setForm({ ...form, example: event.target.value })}
          />

          <label className="label">标签（逗号分隔）</label>
          <input
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
            list="editor-tag-options"
          />
          <datalist id="editor-tag-options">
            {allTagNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <label className="label">来源名称</label>
          <input
            value={form.sourceName}
            onChange={(event) => setForm({ ...form, sourceName: event.target.value })}
          />

          <label className="label">来源 URL</label>
          <input
            value={form.sourceUrl}
            onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })}
          />

          <label className="label">来源备注</label>
          <input
            value={form.sourceNote}
            onChange={(event) => setForm({ ...form, sourceNote: event.target.value })}
          />
        </div>

        <div className="library-actions-row">
          <button
            type="button"
            className="btn primary"
            disabled={pending}
            onClick={() =>
              onSave(word.id, {
                word: form.word,
                reading: form.reading,
                contextExpl: form.contextExpl,
                sceneDesc: form.sceneDesc,
                example: form.example,
                difficulty: form.difficulty,
                tags: parse_tags(form.tags),
                source:
                  form.sourceName.trim().length > 0
                    ? {
                        name: form.sourceName.trim(),
                        url: form.sourceUrl.trim() || undefined,
                        note: form.sourceNote.trim() || undefined,
                      }
                    : null,
              })
            }
          >
            {pending ? '保存中…' : '保存修改'}
          </button>
          {word.deletedAt ? (
            <button type="button" className="btn ghost" onClick={() => onRestore(word.id)} disabled={pending}>
              恢复词条
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={() => onSoftDelete(word.id)} disabled={pending}>
              软删除
            </button>
          )}
          <button type="button" className="btn ghost" onClick={() => onHardDelete(word.id)} disabled={pending}>
            永久删除
          </button>
        </div>

        <section className="library-tag-manager">
          <h3>标签管理</h3>
          <div className="library-batch-row">
            <input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="新增标签名"
            />
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                if (!newTagName.trim()) return;
                onCreateTag(newTagName.trim());
                setNewTagName('');
              }}
            >
              新建标签
            </button>
          </div>
          <div className="library-tag-list">
            {tags.map((tag) => (
              <div key={tag.id} className="library-tag-row">
                {renameTagId === tag.id ? (
                  <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                ) : (
                  <span>{tag.name}</span>
                )}
                <div className="library-actions-row">
                  {renameTagId === tag.id ? (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        if (!renameValue.trim()) return;
                        onRenameTag(tag.id, renameValue.trim());
                        setRenameTagId(null);
                        setRenameValue('');
                      }}
                    >
                      保存
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setRenameTagId(tag.id);
                        setRenameValue(tag.name);
                      }}
                    >
                      重命名
                    </button>
                  )}
                  <button type="button" className="link-btn" onClick={() => onDeleteTag(tag.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
