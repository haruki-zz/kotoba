import { randomUUID } from 'node:crypto'

import {
  AiProviderError,
  ensure_generated_word_card_is_japanese,
  generated_word_card_schema,
  type AiProvider,
  type GeneratedWordCard,
} from './ai_provider'
import { GeminiProvider } from './gemini_provider'
import { type LibraryRepository } from './library_repository'
import {
  load_ai_runtime_settings,
  SettingsApiKeyMissingError,
  type AiRuntimeSettings,
  type SettingsServiceDeps,
} from './settings_service'

export interface SaveWordEntryInput {
  word: string
  reading_kana: string
  meaning_ja: string
  context_scene_ja: string
  example_sentence_ja: string
}

export interface SaveWordEntryResult {
  saved_word_id: string
  updated_existing: boolean
  message_ja: string
}

export class WordEntryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WordEntryValidationError'
  }
}

interface WordEntryServiceDeps extends SettingsServiceDeps {
  library_repository: LibraryRepository
  now?: () => Date
  provider_factory?: (runtime_settings: AiRuntimeSettings) => AiProvider
}

export class WordEntryService {
  private readonly library_repository: LibraryRepository
  private readonly settings_service_deps: SettingsServiceDeps
  private readonly now: () => Date
  private readonly provider_factory: (runtime_settings: AiRuntimeSettings) => AiProvider

  constructor(deps: WordEntryServiceDeps) {
    this.library_repository = deps.library_repository
    this.settings_service_deps = {
      settings_repository: deps.settings_repository,
      api_key_secret_store: deps.api_key_secret_store,
    }
    this.now = deps.now ?? (() => new Date())
    this.provider_factory = deps.provider_factory ?? create_default_provider
  }

  async generate_word_card(word: string): Promise<GeneratedWordCard> {
    const normalized_word = word.trim()
    if (normalized_word.length === 0) {
      throw new WordEntryValidationError('単語を入力してください。')
    }

    const fake_generated_word_card = load_fake_generated_word_card_from_env()
    if (fake_generated_word_card !== null) {
      return fake_generated_word_card
    }

    const fake_generate_error = load_fake_generate_error_from_env()
    if (fake_generate_error !== null) {
      throw fake_generate_error
    }

    const runtime_settings = await load_ai_runtime_settings(this.settings_service_deps)
    const provider = this.provider_factory(runtime_settings)
    const generated = await provider.generate_word_card({
      word: normalized_word,
      output_language: 'ja-JP',
    })
    ensure_generated_word_card_is_japanese(generated)
    return generated
  }

  async save_word_entry(input: SaveWordEntryInput): Promise<SaveWordEntryResult> {
    const normalized_word = input.word.trim()
    if (normalized_word.length === 0) {
      throw new WordEntryValidationError('単語を入力してください。')
    }

    const generated = validate_generated_fields({
      reading_kana: input.reading_kana,
      meaning_ja: input.meaning_ja,
      context_scene_ja: input.context_scene_ja,
      example_sentence_ja: input.example_sentence_ja,
    })
    ensure_generated_word_card_is_japanese(generated)

    const now_iso = this.now().toISOString()
    let updated_existing = false
    let saved_word_id = ''

    await this.library_repository.update_library((current_library) => {
      const target_key = normalize_word_key(normalized_word)
      const existing_index = current_library.words.findIndex(
        (word) => normalize_word_key(word.word) === target_key
      )

      if (existing_index >= 0) {
        const existing = current_library.words[existing_index]
        const updated_word = {
          ...existing,
          word: normalized_word,
          reading_kana: generated.reading_kana,
          meaning_ja: generated.meaning_ja,
          context_scene_ja: generated.context_scene_ja,
          example_sentence_ja: generated.example_sentence_ja,
          source_provider: 'gemini' as const,
          updated_at: now_iso,
        }

        const next_words = [...current_library.words]
        next_words[existing_index] = updated_word
        updated_existing = true
        saved_word_id = updated_word.id
        return {
          ...current_library,
          updated_at: now_iso,
          words: next_words,
        }
      }

      const created_word = {
        id: randomUUID(),
        word: normalized_word,
        reading_kana: generated.reading_kana,
        meaning_ja: generated.meaning_ja,
        context_scene_ja: generated.context_scene_ja,
        example_sentence_ja: generated.example_sentence_ja,
        source_provider: 'gemini' as const,
        review_state: {
          repetition: 0,
          interval_days: 0,
          easiness_factor: 2.5,
          next_review_at: now_iso,
          last_review_at: null,
          last_grade: null,
        },
        created_at: now_iso,
        updated_at: now_iso,
      }

      saved_word_id = created_word.id
      return {
        ...current_library,
        updated_at: now_iso,
        words: [...current_library.words, created_word],
      }
    })

    return {
      saved_word_id,
      updated_existing,
      message_ja: updated_existing ? '既存の単語を更新しました' : '単語を保存しました',
    }
  }
}

export { SettingsApiKeyMissingError }

const create_default_provider = (runtime_settings: AiRuntimeSettings): AiProvider =>
  new GeminiProvider({
    api_key: runtime_settings.api_key,
    model: runtime_settings.model,
    timeout_seconds: runtime_settings.timeout_seconds,
    retries: runtime_settings.retries,
  })

const validate_generated_fields = (fields: GeneratedWordCard): GeneratedWordCard => {
  const parsed = generated_word_card_schema.safeParse(fields)
  if (parsed.success === false) {
    const first_issue = parsed.error.issues[0]
    const issue_path = first_issue.path.join('.') || '(root)'
    throw new WordEntryValidationError(`保存内容が不正です: ${issue_path}: ${first_issue.message}`)
  }
  return parsed.data
}

const normalize_word_key = (word: string): string => word.trim().normalize('NFKC')

const load_fake_generated_word_card_from_env = (): GeneratedWordCard | null => {
  const raw_fake_card = process.env.KOTOBA_FAKE_GENERATE_CARD_JSON
  if (typeof raw_fake_card !== 'string' || raw_fake_card.trim().length === 0) {
    return null
  }

  let parsed_json: unknown
  try {
    parsed_json = JSON.parse(raw_fake_card)
  } catch {
    throw new WordEntryValidationError('生成テストデータが不正です。')
  }

  const parsed_card = generated_word_card_schema.safeParse(parsed_json)
  if (parsed_card.success === false) {
    const first_issue = parsed_card.error.issues[0]
    const issue_path = first_issue.path.join('.') || '(root)'
    throw new WordEntryValidationError(
      `生成テストデータが不正です: ${issue_path}: ${first_issue.message}`
    )
  }

  ensure_generated_word_card_is_japanese(parsed_card.data)
  return parsed_card.data
}

const load_fake_generate_error_from_env = (): Error | null => {
  const fake_error_code = process.env.KOTOBA_FAKE_GENERATE_ERROR_CODE?.trim()
  if (typeof fake_error_code !== 'string' || fake_error_code.length === 0) {
    return null
  }

  switch (fake_error_code) {
    case 'api-key-missing':
      return new SettingsApiKeyMissingError()
    case 'network':
      return new AiProviderError('AI_NETWORK_ERROR', 'fetch failed', {
        retryable: true,
      })
    case 'timeout':
      return new AiProviderError('AI_TIMEOUT', 'request timed out', {
        retryable: true,
      })
    case 'api-key-invalid':
      return new AiProviderError('AI_UPSTREAM_STATUS', 'Unauthorized', {
        status_code: 401,
      })
    default:
      throw new WordEntryValidationError('生成テストエラーコードが不正です。')
  }
}
