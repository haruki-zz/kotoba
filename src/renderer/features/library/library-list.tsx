import React from 'react';

import { WordView } from '@shared/types';

type Props = {
  items: WordView[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onOpenDetail: (word: WordView) => void;
  onSoftDelete: (word: WordView) => void;
  onRestore: (word: WordView) => void;
};

function render_tags(word: WordView) {
  if (!word.tags.length) return <span className="muted">无标签</span>;
  return (
    <div className="library-tags">
      {word.tags.map((tag) => (
        <span className="library-tag" key={`${word.id}-${tag.id}`}>
          {tag.name}
        </span>
      ))}
    </div>
  );
}

export function LibraryList({
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDetail,
  onSoftDelete,
  onRestore,
}: Props) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  return (
    <div className="library-table-wrap">
      <table className="library-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onToggleSelectAll(event.target.checked)}
                aria-label="全选"
              />
            </th>
            <th>词条</th>
            <th>难度</th>
            <th>标签</th>
            <th>下次复习</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((word) => (
            <tr key={word.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(word.id)}
                  onChange={() => onToggleSelect(word.id)}
                  aria-label={`选择 ${word.word}`}
                />
              </td>
              <td>
                <div>
                  <strong>{word.word}</strong>
                  <p className="muted">{word.reading}</p>
                </div>
              </td>
              <td>{word.difficulty}</td>
              <td>{render_tags(word)}</td>
              <td>{new Date(word.nextDueAt).toLocaleDateString()}</td>
              <td>{word.deletedAt ? <span className="badge danger">已删除</span> : <span className="badge">正常</span>}</td>
              <td>
                <div className="library-actions-row">
                  <button type="button" className="link-btn" onClick={() => onOpenDetail(word)}>
                    详情/编辑
                  </button>
                  {word.deletedAt ? (
                    <button type="button" className="link-btn" onClick={() => onRestore(word)}>
                      恢复
                    </button>
                  ) : (
                    <button type="button" className="link-btn" onClick={() => onSoftDelete(word)}>
                      删除
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
