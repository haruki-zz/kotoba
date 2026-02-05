import { DatabaseClient } from '../connection';

export type AiRequestStatus = 'success' | 'error';

export type AiRequestRecord = {
  id: number;
  traceId: string;
  scenario: string;
  provider: string;
  wordId: number | null;
  inputJson: unknown;
  outputJson: unknown | null;
  status: AiRequestStatus;
  errorMessage: string | null;
  latencyMs: number | null;
  createdAt: string;
  updatedAt: string;
};

type InsertRecord = {
  traceId: string;
  scenario: string;
  provider: string;
  wordId?: number | null;
  input: unknown;
  output?: unknown;
  status: AiRequestStatus;
  errorMessage?: string | null;
  latencyMs?: number | null;
};

export class AiRequestRepository {
  constructor(private db: DatabaseClient) {}

  logSuccess(data: Omit<InsertRecord, 'status'>) {
    return this.insert({ ...data, status: 'success' });
  }

  logError(data: Omit<InsertRecord, 'status'>) {
    return this.insert({ ...data, status: 'error' });
  }

  getLatestByTraceId(traceId: string): AiRequestRecord | undefined {
    const row = this.db
      .prepare('SELECT * FROM ai_requests WHERE trace_id = ? ORDER BY id DESC LIMIT 1')
      .get(traceId) as DbRow | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  private insert(record: InsertRecord): AiRequestRecord {
    const stmt = this.db.prepare(
      `INSERT INTO ai_requests (
        trace_id, scenario, provider, word_id, input_json, output_json, status, error_message, latency_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const outputJson = record.output ? JSON.stringify(record.output) : null;
    const info = stmt.run(
      record.traceId,
      record.scenario,
      record.provider,
      record.wordId ?? null,
      JSON.stringify(record.input),
      outputJson,
      record.status,
      record.errorMessage ?? null,
      record.latencyMs ?? null
    );

    const row = this.db
      .prepare('SELECT * FROM ai_requests WHERE id = ?')
      .get(info.lastInsertRowid) as DbRow | undefined;
    if (!row) {
      throw new Error('Failed to fetch inserted ai_requests row');
    }
    return this.mapRow(row);
  }

  private mapRow(row: DbRow): AiRequestRecord {
    return {
      id: row.id,
      traceId: row.trace_id,
      scenario: row.scenario,
      provider: row.provider,
      wordId: row.word_id,
      inputJson: this.safeParse(row.input_json),
      outputJson: this.safeParse(row.output_json),
      status: row.status as AiRequestStatus,
      errorMessage: row.error_message,
      latencyMs: row.latency_ms,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private safeParse(value: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}

type DbRow = {
  id: number;
  trace_id: string;
  scenario: string;
  provider: string;
  word_id: number | null;
  input_json: string;
  output_json: string | null;
  status: string;
  error_message: string | null;
  latency_ms: number | null;
  created_at: string;
  updated_at: string;
};
