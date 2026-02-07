import React from 'react';

import { WordView } from '@shared/types';

type Props = {
  word: WordView;
};

export function WordListItem({ word }: Props) {
  const nextDue = new Date(word.nextDueAt);
  const lastReview = new Date(word.lastReviewAt);

  return (
    <div className="list-row">
      <div>
        <p className="eyebrow">{word.difficulty.toUpperCase()}</p>
        <h3>{word.word}</h3>
        <p className="muted">{word.reading}</p>
      </div>
      <div className="list-meta">
        <span>下次复习：{nextDue.toLocaleString()}</span>
        <span>上次：{lastReview.toLocaleString()}</span>
        <span>EF {word.ef.toFixed(2)}</span>
      </div>
    </div>
  );
}
