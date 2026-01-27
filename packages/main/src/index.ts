import { WordRecord } from '@kotoba/shared';

export const describeBootstrap = (word: Pick<WordRecord, 'word'>): string => {
  return `bootstrap main process for ${word.word}`;
};

console.log(describeBootstrap({ word: 'kotoba' }));
