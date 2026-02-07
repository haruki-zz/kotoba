import React from 'react';

import { WordView } from '@shared/types';

type Props = {
  word: WordView;
  showDetails: boolean;
  progress: number;
};

export function ReviewCard({ word, showDetails, progress }: Props) {
  return (
    <div className="review-card">
      <div className="card-header spaced">
        <div>
          <p className="eyebrow">现在复习</p>
          <h1>{word.word}</h1>
          <p className="lede muted">按 1/2/3 打分，空格展开细节</p>
        </div>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="review-body">
        {showDetails ? (
          <div className="detail-grid">
            <div className="detail">
              <p className="label">读音</p>
              <p className="body-lg">{word.reading}</p>
            </div>
            <div className="detail">
              <p className="label">情景解释</p>
              <p>{word.contextExpl}</p>
            </div>
            <div className="detail">
              <p className="label">场景描述</p>
              <p>{word.sceneDesc}</p>
            </div>
            <div className="detail">
              <p className="label">例句</p>
              <p>{word.example}</p>
            </div>
          </div>
        ) : (
          <div className="word-only">
            <p className="muted">按空格展开释义 / 点击评分继续</p>
          </div>
        )}
      </div>
    </div>
  );
}
