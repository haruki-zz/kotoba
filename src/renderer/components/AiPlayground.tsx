import React, { useEffect, useMemo, useState } from 'react';

import { AiGenerateResponse, AiProviderName, AiScenario } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8787/api';
const defaultPayload = {
  word: 'sakura',
  contextHint: 'Casual chat about cherry blossoms in the park.',
  tone: 'casual',
};

const fallbackResult = {
  reading: '',
  contextExpl: '',
  sceneDesc: '',
  example: '',
  difficulty: 'medium',
  tips: '',
};

const scenarioLabels: Record<AiScenario, string> = {
  wordEnrich: 'Word enrichment',
  exampleOnly: 'Example only',
};

const providerLabels: Record<AiProviderName, string> = {
  mock: 'Mock (offline)',
  openai: 'ChatGPT',
  gemini: 'Gemini',
};

type EditableResult = {
  reading?: string;
  contextExpl?: string;
  sceneDesc?: string;
  example?: string;
  difficulty?: string;
  tips?: string;
};

function AiPlayground() {
  const [scenario, setScenario] = useState<AiScenario>('wordEnrich');
  const [provider, setProvider] = useState<AiProviderName>('mock');
  const [providers, setProviders] = useState<AiProviderName[]>(['mock', 'openai', 'gemini']);
  const [payload, setPayload] = useState(defaultPayload);
  const [result, setResult] = useState<AiGenerateResponse | null>(null);
  const [editable, setEditable] = useState<EditableResult>(fallbackResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(`${API_BASE}/ai/providers`);
        if (!res.ok) return;
        const data = await res.json();
        setProviders(data.items);
        if (!data.items.includes(provider)) {
          setProvider(data.items[0]);
        }
      } catch {
        // ignore, keep defaults
      }
    };
    fetchProviders();
  }, [provider]);

  const scenarioHint = useMemo(() => {
    return scenario === 'wordEnrich'
      ? 'Let AI enrich the word with reading, context, scene, and example.'
      : 'Ask AI for a single example sentence for the word and scene.';
  }, [scenario]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          provider,
          payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'AI request failed');
        return;
      }

      setResult(data);
      setEditable(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualReset = () => {
    setEditable(fallbackResult);
    setResult(null);
    setError(null);
  };

  return (
    <section className="card ai-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">AI Playground</p>
          <h2>Prompt &amp; Enrich</h2>
          <p className="lede muted">{scenarioHint}</p>
        </div>
        <div className="badge">Plan 05</div>
      </div>

      <div className="control-grid">
        <div>
          <label className="label">Scenario</label>
          <select value={scenario} onChange={(e) => setScenario(e.target.value as AiScenario)}>
            {Object.entries(scenarioLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value as AiProviderName)}>
            {providers.map((value) => (
              <option key={value} value={value}>
                {providerLabels[value] ?? value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Word</label>
          <input
            value={payload.word}
            onChange={(e) => setPayload({ ...payload, word: e.target.value })}
            placeholder="The target vocab, e.g., 'sakura'"
          />
        </div>
        <div>
          <label className="label">Context hint</label>
          <input
            value={payload.contextHint ?? ''}
            onChange={(e) => setPayload({ ...payload, contextHint: e.target.value })}
            placeholder="Where should this word appear? (scene, tone, audience)"
          />
        </div>
      </div>

      <div className="actions">
        <div className="action-left">
          <button type="button" className="ghost" onClick={handleManualReset}>
            Clear result
          </button>
        </div>
        <div className="action-right">
          <button type="button" onClick={handleGenerate} disabled={loading || !payload.word.trim()}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="error-box">
          <p>{error}</p>
          <p className="muted">Check API logs and provider configuration, then try again.</p>
        </div>
      ) : null}

      <div className="result-grid">
        <div className="result-column">
          <label className="label">Reading</label>
          <input
            value={editable.reading ?? ''}
            onChange={(e) => setEditable({ ...editable, reading: e.target.value })}
            placeholder="‚©‚È or romaji"
          />
        </div>
        <div className="result-column">
          <label className="label">Context explanation</label>
          <textarea
            value={editable.contextExpl ?? ''}
            onChange={(e) => setEditable({ ...editable, contextExpl: e.target.value })}
            rows={2}
            placeholder="One or two sentences describing when to use it"
          />
        </div>
        <div className="result-column">
          <label className="label">Scene description</label>
          <textarea
            value={editable.sceneDesc ?? ''}
            onChange={(e) => setEditable({ ...editable, sceneDesc: e.target.value })}
            rows={2}
            placeholder="Short scene where the word appears"
          />
        </div>
        <div className="result-column">
          <label className="label">Example sentence</label>
          <textarea
            value={editable.example ?? ''}
            onChange={(e) => setEditable({ ...editable, example: e.target.value })}
            rows={2}
            placeholder="A natural example sentence"
          />
        </div>
        <div className="result-column">
          <label className="label">Difficulty</label>
          <input
            value={editable.difficulty ?? ''}
            onChange={(e) => setEditable({ ...editable, difficulty: e.target.value })}
            placeholder="easy / medium / hard"
          />
        </div>
        <div className="result-column">
          <label className="label">Tips</label>
          <textarea
            value={editable.tips ?? ''}
            onChange={(e) => setEditable({ ...editable, tips: e.target.value })}
            rows={2}
            placeholder="Tone or nuance reminders"
          />
        </div>
      </div>

      {result ? (
        <div className="meta">
          <p>
            Provider: {result.provider} ? Trace ID: {result.traceId} ? {result.latencyMs ?? 0} ms
          </p>
          <p className="muted">Results are editable before saving back to the word.</p>
        </div>
      ) : (
        <p className="muted meta">Run a scenario to see AI output here.</p>
      )}
    </section>
  );
}

export default AiPlayground;