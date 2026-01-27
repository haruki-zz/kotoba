import React from 'react';
import { createRoot } from 'react-dom/client';
import { WordRecord } from '@kotoba/shared';

const sample: WordRecord = {
  word: 'kotoba',
  reading: 'ことば',
  contextExpl: 'placeholder context',
  sceneDesc: 'placeholder scene',
  example: 'これはプレースホルダーの例文です。',
  difficulty: 'medium',
  ef: 2.5,
  intervalDays: 1,
  repetition: 0,
  lastReviewAt: new Date().toISOString(),
  nextDueAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const App = () => (
  <main className="p-4">
    <h1>kotoba renderer bootstrap</h1>
    <p>{sample.word}</p>
  </main>
);

if (typeof document !== 'undefined') {
  const container =
    document.getElementById('root') ?? document.body.appendChild(document.createElement('div'));
  createRoot(container).render(<App />);
}

export default App;
