import {
  ApiError,
  GoogleGenAI,
  type GenerateContentConfig,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from '@google/genai'

import {
  AiProviderError,
  ensure_generated_word_card_is_japanese,
  parse_generated_word_card_json,
  type AiProvider,
  type GenerateWordCardInput,
  type GeneratedWordCard,
} from './ai_provider'

const RETRY_BACKOFF_INITIAL_MS = 500
const RETRY_BACKOFF_MAX_MS = 1500

export interface GeminiClient {
  models: {
    generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse>
  }
}

export interface GeminiProviderOptions {
  api_key: string
  model: string
  timeout_seconds: number
  retries: number
  client?: GeminiClient
  sleep_fn?: (duration_ms: number) => Promise<void>
  random_fn?: () => number
}

export class GeminiProvider implements AiProvider {
  private readonly client: GeminiClient
  private readonly model: string
  private readonly timeout_seconds: number
  private readonly retries: number
  private readonly sleep_fn: (duration_ms: number) => Promise<void>
  private readonly random_fn: () => number

  constructor(options: GeminiProviderOptions) {
    const api_key = options.api_key.trim()
    const model = options.model.trim()

    if (api_key.length === 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Gemini API key must not be empty.')
    }
    if (model.length === 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Gemini model must not be empty.')
    }
    if (Number.isFinite(options.timeout_seconds) === false || options.timeout_seconds <= 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Gemini timeout_seconds must be > 0.')
    }
    if (Number.isInteger(options.retries) === false || options.retries < 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Gemini retries must be an integer >= 0.')
    }

    this.client = options.client ?? new GoogleGenAI({ apiKey: api_key })
    this.model = model
    this.timeout_seconds = options.timeout_seconds
    this.retries = options.retries
    this.sleep_fn = options.sleep_fn ?? sleep
    this.random_fn = options.random_fn ?? Math.random
  }

  async generate_word_card(input: GenerateWordCardInput): Promise<GeneratedWordCard> {
    const word = input.word.trim()
    if (word.length === 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'word must not be empty.')
    }

    let last_error: AiProviderError | null = null

    for (let attempt_index = 0; attempt_index <= this.retries; attempt_index += 1) {
      try {
        const response = await this.request_gemini_once(word)
        const response_text = response.text?.trim()
        if (response_text === undefined || response_text.length === 0) {
          throw new AiProviderError('AI_JSON_INVALID', 'Gemini response text is empty.', {
            retryable: true,
          })
        }

        const parsed = parse_generated_word_card_json(response_text)
        ensure_generated_word_card_is_japanese(parsed)
        return parsed
      } catch (error) {
        const classified = classify_provider_error(error)
        last_error = classified

        const can_retry = classified.retryable && attempt_index < this.retries
        if (can_retry === false) {
          break
        }

        const retry_index = attempt_index
        const delay_ms = compute_retry_backoff_ms(retry_index, this.random_fn)
        await this.sleep_fn(delay_ms)
      }
    }

    if (last_error !== null) {
      throw new AiProviderError(
        'AI_RETRY_EXHAUSTED',
        `Gemini request failed after retries: ${last_error.message}`,
        {
          cause: last_error,
          status_code: last_error.status_code ?? undefined,
        }
      )
    }

    throw new AiProviderError('AI_UNKNOWN_ERROR', 'Gemini request failed for unknown reason.')
  }

  private async request_gemini_once(word: string): Promise<GenerateContentResponse> {
    const abort_controller = new AbortController()
    const timeout_ms = Math.round(this.timeout_seconds * 1000)
    let timeout_triggered = false

    const timeout_id = setTimeout(() => {
      timeout_triggered = true
      abort_controller.abort()
    }, timeout_ms)

    const config: GenerateContentConfig = {
      responseMimeType: 'application/json',
      abortSignal: abort_controller.signal,
    }

    try {
      return await this.client.models.generateContent({
        model: this.model,
        contents: build_generation_prompt(word),
        config,
      })
    } catch (error) {
      if (timeout_triggered || is_abort_error(error)) {
        throw new AiProviderError(
          'AI_TIMEOUT',
          `Gemini request timed out after ${this.timeout_seconds} seconds.`,
          { cause: error, retryable: true }
        )
      }

      throw error
    } finally {
      clearTimeout(timeout_id)
    }
  }
}

export const build_generation_prompt = (word: string): string =>
  `
次の日本語単語に対して、必ず JSON のみを返してください。Markdown や説明文は不要です。

単語: ${word}

出力要件:
1. JSON のキーは次の4つのみ:
   - reading_kana
   - meaning_ja
   - context_scene_ja
   - example_sentence_ja
2. すべて日本語で出力すること。
3. example_sentence_ja は1文にすること。
4. null は使わないこと。
`
    .trim()
    .replace(/\n {2,}/g, '\n')

const classify_provider_error = (error: unknown): AiProviderError => {
  if (error instanceof AiProviderError) {
    return error
  }

  if (error instanceof ApiError) {
    const status_code = error.status
    const retryable = status_code === 429 || status_code >= 500
    return new AiProviderError('AI_UPSTREAM_STATUS', error.message, {
      cause: error,
      retryable,
      status_code,
    })
  }

  if (has_numeric_status(error)) {
    const status_code = error.status
    const retryable = status_code === 429 || status_code >= 500
    return new AiProviderError('AI_UPSTREAM_STATUS', error.message, {
      cause: error,
      retryable,
      status_code,
    })
  }

  if (is_network_error(error)) {
    return new AiProviderError('AI_NETWORK_ERROR', error.message, {
      cause: error,
      retryable: true,
    })
  }

  if (error instanceof Error) {
    return new AiProviderError('AI_UNKNOWN_ERROR', error.message, { cause: error })
  }

  return new AiProviderError('AI_UNKNOWN_ERROR', String(error))
}

const has_numeric_status = (value: unknown): value is { status: number; message: string } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { status?: unknown }).status === 'number' &&
  typeof (value as { message?: unknown }).message === 'string'

const is_network_error = (value: unknown): value is Error => {
  if (value instanceof Error === false) {
    return false
  }

  return /fetch failed|network|ENOTFOUND|ECONN|socket|timed out/i.test(value.message)
}

const is_abort_error = (value: unknown): boolean =>
  value instanceof Error && (value.name === 'AbortError' || /aborted|abort/i.test(value.message))

const sleep = (duration_ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, duration_ms)
  })

export const compute_retry_backoff_ms = (retry_index: number, random_fn: () => number): number => {
  const exponential = RETRY_BACKOFF_INITIAL_MS * Math.pow(3, retry_index)
  const base_ms = Math.min(RETRY_BACKOFF_MAX_MS, exponential)
  const jitter = 0.8 + random_fn() * 0.4
  return Math.round(base_ms * jitter)
}
