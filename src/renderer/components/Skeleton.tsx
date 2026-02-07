import React from 'react';

type Props = {
  lines?: number;
};

export function Skeleton({ lines = 3 }: Props) {
  return (
    <div className="skeleton">
      {Array.from({ length: lines }).map((_, idx) => (
        <span key={idx} className="skeleton-line" />
      ))}
    </div>
  );
}
