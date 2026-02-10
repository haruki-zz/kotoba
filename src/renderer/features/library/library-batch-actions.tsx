import React, { useMemo, useState } from 'react';

import { TagRecord } from '@shared/types';

type Props = {
  selectedIds: number[];
  tags: TagRecord[];
  disabled: boolean;
  onSetDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onSoftDelete: () => void;
  onRestore: () => void;
  onAddTags: (tagNames: string[]) => void;
  onRemoveTags: (tagNames: string[]) => void;
};

function split_tags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    )
  );
}

export function LibraryBatchActions({
  selectedIds,
  tags,
  disabled,
  onSetDifficulty,
  onSoftDelete,
  onRestore,
  onAddTags,
  onRemoveTags,
}: Props) {
  const [tagInput, setTagInput] = useState('');
  const selectedCount = selectedIds.length;

  const allTagNames = useMemo(() => tags.map((tag) => tag.name), [tags]);

  const apply_add_tags = () => {
    const names = split_tags(tagInput).filter((name) => allTagNames.includes(name));
    if (names.length > 0) {
      onAddTags(names);
      setTagInput('');
    }
  };

  const apply_remove_tags = () => {
    const names = split_tags(tagInput);
    if (names.length > 0) {
      onRemoveTags(names);
      setTagInput('');
    }
  };

  return (
    <div className="library-batch">
      <p className="muted">已选 {selectedCount} 项</p>
      <div className="library-batch-row">
        <button type="button" className="btn ghost" onClick={() => onSetDifficulty('easy')} disabled={disabled || selectedCount === 0}>
          批量设为 Easy
        </button>
        <button type="button" className="btn ghost" onClick={() => onSetDifficulty('medium')} disabled={disabled || selectedCount === 0}>
          批量设为 Medium
        </button>
        <button type="button" className="btn ghost" onClick={() => onSetDifficulty('hard')} disabled={disabled || selectedCount === 0}>
          批量设为 Hard
        </button>
        <button type="button" className="btn ghost" onClick={onSoftDelete} disabled={disabled || selectedCount === 0}>
          批量删除
        </button>
        <button type="button" className="btn ghost" onClick={onRestore} disabled={disabled || selectedCount === 0}>
          批量恢复
        </button>
      </div>
      <div className="library-batch-row">
        <input
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          placeholder="输入标签，逗号分隔"
          list="library-tag-options"
        />
        <datalist id="library-tag-options">
          {allTagNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button type="button" className="btn ghost" onClick={apply_add_tags} disabled={disabled || selectedCount === 0}>
          批量加标签
        </button>
        <button type="button" className="btn ghost" onClick={apply_remove_tags} disabled={disabled || selectedCount === 0}>
          批量移除标签
        </button>
      </div>
    </div>
  );
}
