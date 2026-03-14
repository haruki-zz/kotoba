import { z } from 'zod'

import {
  AiProviderError,
  ensure_generated_word_card_is_japanese,
  generated_word_card_schema,
  type GeneratedWordCard,
} from './ai_provider'
import { type LibraryRepository } from './library_repository'

export interface LibraryListWordsInput {
  query?: string
}

export interface LibraryWordListItem {
  id: string
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
  created_at: string
  updated_at: string
}

export interface LibraryListWordsResult {
  query: string
  total_count: number
  matched_count: number
  words: LibraryWordListItem[]
}

export interface LibraryUpdateWordInput {
  word_id: string
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

export interface LibraryUpdateWordResult {
  updated_word_id: string
  message_ja: string
}

export interface LibraryDeleteWordInput {
  word_id: string
}

export interface LibraryDeleteWordResult {
  deleted_word_id: string
  message_ja: string
}

export class LibraryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LibraryValidationError'
  }
}

export class LibraryWordNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LibraryWordNotFoundError'
  }
}

interface LibraryServiceDeps {
  library_repository: LibraryRepository
  now?: () => Date
}

const edit_payload_schema = z.object({
  word_id: z.string().uuid(),
  word: z.string().trim().min(1).max(128),
  reading_kana: generated_word_card_schema.shape.reading_kana,
  meaning_ja: generated_word_card_schema.shape.meaning_ja,
  context_scene_ja: generated_word_card_schema.shape.context_scene_ja,
  example_sentence_ja: generated_word_card_schema.shape.example_sentence_ja,
})

export class LibraryService {
  private readonly library_repository: LibraryRepository
  private readonly now: () => Date

  constructor(deps: LibraryServiceDeps) {
    this.library_repository = deps.library_repository
    this.now = deps.now ?? (() => new Date())
  }

  async list_words(input: LibraryListWordsInput = {}): Promise<LibraryListWordsResult> {
    const query = input.query ?? ''
    const normalized_query = normalize_search_text(query)
    const library = await this.library_repository.read_library()
    const sorted_words = [...library.words].sort((left, right) =>
      right.updated_at.localeCompare(left.updated_at)
    )
    const filtered_words =
      normalized_query.length === 0
        ? sorted_words
        : sorted_words.filter((word) => matches_search_query(word, normalized_query))

    return {
      query,
      total_count: library.words.length,
      matched_count: filtered_words.length,
      words: filtered_words.map((word) => ({
        id: word.id,
        word: word.word,
        reading_kana: word.reading_kana,
        meaning_ja: word.meaning_ja,
        context_scene_ja: word.context_scene_ja,
        example_sentence_ja: word.example_sentence_ja,
        created_at: word.created_at,
        updated_at: word.updated_at,
      })),
    }
  }

  async update_word(input: LibraryUpdateWordInput): Promise<LibraryUpdateWordResult> {
    const validated_input = validate_update_payload(input)
    const generated: GeneratedWordCard = {
      reading_kana: validated_input.reading_kana,
      meaning_ja: validated_input.meaning_ja,
      context_scene_ja: validated_input.context_scene_ja,
      example_sentence_ja: validated_input.example_sentence_ja,
    }
    try {
      ensure_generated_word_card_is_japanese(generated)
    } catch (error) {
      if (error instanceof AiProviderError && error.code === 'AI_NON_JAPANESE_OUTPUT') {
        throw new LibraryValidationError('編集内容は日本語で入力してください。')
      }
      throw error
    }

    const now_iso = this.now().toISOString()
    await this.library_repository.update_library((current_library) => {
      const target_index = current_library.words.findIndex(
        (word) => word.id === validated_input.word_id
      )
      if (target_index < 0) {
        throw new LibraryWordNotFoundError('指定された単語が見つかりません。')
      }

      const normalized_word_key = normalize_word_key(validated_input.word)
      const duplicated_word = current_library.words.find(
        (word) =>
          word.id !== validated_input.word_id &&
          normalize_word_key(word.word) === normalized_word_key
      )
      if (duplicated_word) {
        throw new LibraryValidationError('同じ単語がすでに存在します。')
      }

      const existing = current_library.words[target_index]
      const updated_word = {
        ...existing,
        word: validated_input.word,
        reading_kana: generated.reading_kana,
        meaning_ja: generated.meaning_ja,
        context_scene_ja: generated.context_scene_ja,
        example_sentence_ja: generated.example_sentence_ja,
        updated_at: now_iso,
      }

      const next_words = [...current_library.words]
      next_words[target_index] = updated_word

      return {
        ...current_library,
        updated_at: now_iso,
        words: next_words,
      }
    })

    return {
      updated_word_id: validated_input.word_id,
      message_ja: '単語を更新しました',
    }
  }

  async delete_word(input: LibraryDeleteWordInput): Promise<LibraryDeleteWordResult> {
    if (is_non_empty_string(input.word_id) === false) {
      throw new LibraryValidationError('削除対象の単語IDが不正です。')
    }

    const now_iso = this.now().toISOString()
    await this.library_repository.update_library((current_library) => {
      const existing_index = current_library.words.findIndex((word) => word.id === input.word_id)
      if (existing_index < 0) {
        throw new LibraryWordNotFoundError('指定された単語が見つかりません。')
      }

      const next_words = current_library.words.filter((word) => word.id !== input.word_id)
      return {
        ...current_library,
        updated_at: now_iso,
        words: next_words,
      }
    })

    return {
      deleted_word_id: input.word_id,
      message_ja: '単語を削除しました',
    }
  }
}

const validate_update_payload = (
  input: LibraryUpdateWordInput
): z.infer<typeof edit_payload_schema> => {
  const parsed = edit_payload_schema.safeParse(input)
  if (parsed.success) {
    return parsed.data
  }

  const first_issue = parsed.error.issues[0]
  const issue_path = first_issue.path.join('.') || '(root)'
  throw new LibraryValidationError(`編集内容が不正です: ${issue_path}: ${first_issue.message}`)
}

const normalize_word_key = (value: string): string => value.trim().normalize('NFKC')

const matches_search_query = (word: LibraryWordListItem, normalized_query: string): boolean => {
  const normalized_word = normalize_search_text(word.word)
  const normalized_reading = normalize_search_text(word.reading_kana)
  const normalized_meaning = normalize_search_text(word.meaning_ja)
  return (
    normalized_word.includes(normalized_query) ||
    normalized_reading.includes(normalized_query) ||
    normalized_meaning.includes(normalized_query)
  )
}

export const normalize_search_text = (value: string): string => {
  const normalized = value.trim().normalize('NFKC').toLowerCase()
  return normalize_katakana_to_hiragana(normalized)
}

const normalize_katakana_to_hiragana = (value: string): string => {
  let normalized = ''

  for (const char of value) {
    const code_point = char.codePointAt(0)
    if (code_point === undefined) {
      normalized += char
      continue
    }

    if (
      (code_point >= 0x30a1 && code_point <= 0x30f6) ||
      (code_point >= 0x30fd && code_point <= 0x30fe)
    ) {
      normalized += String.fromCodePoint(code_point - 0x60)
      continue
    }

    normalized += char
  }

  return normalized
}

const is_non_empty_string = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
