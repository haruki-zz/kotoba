import { z } from 'zod'

import { AI_FIELD_LIMITS } from '../shared/domain_schema'

export interface GenerateWordCardInput {
  word: string
  output_language?: 'ja-JP'
}

export const generated_word_card_schema = z.object({
  reading_kana: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.reading_kana.min)
    .max(AI_FIELD_LIMITS.reading_kana.max),
  meaning_ja: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.meaning_ja.min)
    .max(AI_FIELD_LIMITS.meaning_ja.max),
  context_scene_ja: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.context_scene_ja.min)
    .max(AI_FIELD_LIMITS.context_scene_ja.max),
  example_sentence_ja: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.example_sentence_ja.min)
    .max(AI_FIELD_LIMITS.example_sentence_ja.max),
})

export type GeneratedWordCard = z.infer<typeof generated_word_card_schema>

export interface AiProvider {
  generate_word_card(input: GenerateWordCardInput): Promise<GeneratedWordCard>
}

export type AiProviderErrorCode =
  | 'AI_CONFIG_INVALID'
  | 'AI_NETWORK_ERROR'
  | 'AI_TIMEOUT'
  | 'AI_UPSTREAM_STATUS'
  | 'AI_JSON_INVALID'
  | 'AI_NON_JAPANESE_OUTPUT'
  | 'AI_RETRY_EXHAUSTED'
  | 'AI_UNKNOWN_ERROR'

export interface AiProviderErrorOptions {
  cause?: unknown
  retryable?: boolean
  status_code?: number
}

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode
  readonly retryable: boolean
  readonly status_code: number | null

  constructor(code: AiProviderErrorCode, message: string, options: AiProviderErrorOptions = {}) {
    super(message)
    this.name = 'AiProviderError'
    this.code = code
    this.retryable = options.retryable ?? false
    this.status_code = options.status_code ?? null

    if (options.cause !== undefined) {
      const error_with_cause = this as Error & { cause?: unknown }
      error_with_cause.cause = options.cause
    }
  }
}

export const parse_generated_word_card_json = (raw_text: string): GeneratedWordCard => {
  let parsed_json: unknown
  try {
    parsed_json = JSON.parse(raw_text)
  } catch (error) {
    throw new AiProviderError('AI_JSON_INVALID', 'Model output is not valid JSON.', {
      cause: error,
      retryable: true,
    })
  }

  const parsed = generated_word_card_schema.safeParse(parsed_json)
  if (parsed.success === false) {
    const first_issue = parsed.error.issues[0]
    const issue_path = first_issue.path.join('.') || '(root)'
    throw new AiProviderError(
      'AI_JSON_INVALID',
      `Model output schema validation failed: ${issue_path}: ${first_issue.message}`,
      { retryable: true }
    )
  }

  return parsed.data
}

export const ensure_generated_word_card_is_japanese = (card: GeneratedWordCard): void => {
  if (is_kana_text(card.reading_kana) === false) {
    throw new AiProviderError(
      'AI_NON_JAPANESE_OUTPUT',
      'reading_kana must contain Japanese kana only.',
      { retryable: true }
    )
  }

  const language_fields: Array<{ field: string; value: string }> = [
    { field: 'meaning_ja', value: card.meaning_ja },
    { field: 'context_scene_ja', value: card.context_scene_ja },
    { field: 'example_sentence_ja', value: card.example_sentence_ja },
  ]

  for (const item of language_fields) {
    if (is_japanese_sentence(item.value) === false) {
      throw new AiProviderError(
        'AI_NON_JAPANESE_OUTPUT',
        `${item.field} must contain Japanese text.`,
        { retryable: true }
      )
    }
  }
}

const KANA_TEXT_REGEX = /^[\p{Script=Hiragana}\p{Script=Katakana}ー・\s]+$/u
const HAS_JAPANESE_CHAR_REGEX = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u
const HAS_ASCII_LETTER_REGEX = /[A-Za-z]/

const is_kana_text = (value: string): boolean => KANA_TEXT_REGEX.test(value)

const is_japanese_sentence = (value: string): boolean =>
  HAS_JAPANESE_CHAR_REGEX.test(value) && HAS_ASCII_LETTER_REGEX.test(value) === false
