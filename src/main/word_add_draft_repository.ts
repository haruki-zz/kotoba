import { mkdir, readFile, rename, rm, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import type { WordAddDraftPayload } from '../shared/ipc'

const DRAFT_TEXT_ENCODING = 'utf8'
const UTC_ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

interface StoredWordAddDraft extends WordAddDraftPayload {
  updated_at: string
}

export interface WordAddDraftRepositoryOptions {
  draft_file_path: string
  now?: () => Date
}

export class WordAddDraftRepository {
  private readonly draft_file_path: string
  private readonly now: () => Date

  constructor(options: WordAddDraftRepositoryOptions) {
    this.draft_file_path = options.draft_file_path
    this.now = options.now ?? (() => new Date())
  }

  async load_draft(): Promise<WordAddDraftPayload | null> {
    try {
      const raw = await readFile(this.draft_file_path, DRAFT_TEXT_ENCODING)
      const parsed = parse_stored_draft(raw, this.draft_file_path)
      return {
        word: parsed.word,
        reading_kana: parsed.reading_kana,
        meaning_ja: parsed.meaning_ja,
        context_scene_ja: parsed.context_scene_ja,
        example_sentence_ja: parsed.example_sentence_ja,
      }
    } catch (error) {
      const node_error = error as NodeJS.ErrnoException
      if (node_error.code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  async save_draft(next_draft: WordAddDraftPayload): Promise<void> {
    const stored: StoredWordAddDraft = validate_stored_draft({
      ...next_draft,
      updated_at: this.now().toISOString(),
    })
    await this.write_draft_file_atomic(stored)
  }

  async clear_draft(): Promise<void> {
    await rm(this.draft_file_path, { force: true })
  }

  private async write_draft_file_atomic(stored_draft: StoredWordAddDraft): Promise<void> {
    await mkdir(dirname(this.draft_file_path), { recursive: true })
    const serialized = `${JSON.stringify(stored_draft, null, 2)}\n`
    const temp_path = `${this.draft_file_path}.tmp-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`

    await writeFile(temp_path, serialized, DRAFT_TEXT_ENCODING)
    try {
      await rename(temp_path, this.draft_file_path)
    } catch (error) {
      await unlink(temp_path).catch(() => undefined)
      throw error
    }
  }
}

const parse_stored_draft = (raw: string, source_path: string): StoredWordAddDraft => {
  let parsed_json: unknown
  try {
    parsed_json = JSON.parse(raw)
  } catch {
    throw new Error(`Invalid draft data in ${source_path}: malformed JSON`)
  }

  return validate_stored_draft(parsed_json)
}

const validate_stored_draft = (value: unknown): StoredWordAddDraft => {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Draft payload must be an object.')
  }

  const draft = value as Partial<StoredWordAddDraft>
  const word = read_required_string_field(draft, 'word')
  const reading_kana = read_required_string_field(draft, 'reading_kana')
  const meaning_ja = read_required_string_field(draft, 'meaning_ja')
  const context_scene_ja = read_required_string_field(draft, 'context_scene_ja')
  const example_sentence_ja = read_required_string_field(draft, 'example_sentence_ja')

  if (typeof draft.updated_at !== 'string' || UTC_ISO_8601_REGEX.test(draft.updated_at) === false) {
    throw new Error('Draft field "updated_at" must be a UTC ISO 8601 timestamp.')
  }

  return {
    word,
    reading_kana,
    meaning_ja,
    context_scene_ja,
    example_sentence_ja,
    updated_at: draft.updated_at,
  }
}

const read_required_string_field = (
  draft: Partial<StoredWordAddDraft>,
  field: keyof WordAddDraftPayload
): string => {
  const value = draft[field]
  if (typeof value !== 'string') {
    throw new Error(`Draft field "${field}" must be a string.`)
  }
  return value
}
