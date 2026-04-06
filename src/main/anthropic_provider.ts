import {
  AiProviderError,
  build_generation_prompt,
  ensure_generated_word_card_is_japanese,
  parse_generated_word_card_json,
  type AiProvider,
  type GenerateWordCardInput,
  type GeneratedWordCard,
} from './ai_provider'
import { compute_retry_backoff_ms } from './gemini_provider'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'

interface AnthropicMessagesResponse {
  content?: Array<{
    type?: string
    text?: string
  }>
  error?: {
    message?: string
  }
}

export interface AnthropicProviderOptions {
  api_key: string
  model: string
  timeout_seconds: number
  retries: number
  fetch_fn?: typeof fetch
  sleep_fn?: (duration_ms: number) => Promise<void>
  random_fn?: () => number
}

export class AnthropicProvider implements AiProvider {
  private readonly api_key: string
  private readonly model: string
  private readonly timeout_seconds: number
  private readonly retries: number
  private readonly fetch_fn: typeof fetch
  private readonly sleep_fn: (duration_ms: number) => Promise<void>
  private readonly random_fn: () => number

  constructor(options: AnthropicProviderOptions) {
    const api_key = options.api_key.trim()
    const model = options.model.trim()

    if (api_key.length === 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Anthropic API key must not be empty.')
    }
    if (model.length === 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Anthropic model must not be empty.')
    }
    if (Number.isFinite(options.timeout_seconds) === false || options.timeout_seconds <= 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Anthropic timeout_seconds must be > 0.')
    }
    if (Number.isInteger(options.retries) === false || options.retries < 0) {
      throw new AiProviderError('AI_CONFIG_INVALID', 'Anthropic retries must be an integer >= 0.')
    }

    this.api_key = api_key
    this.model = model
    this.timeout_seconds = options.timeout_seconds
    this.retries = options.retries
    this.fetch_fn = options.fetch_fn ?? fetch
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
        const response_text = await this.request_anthropic_once(word)
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

        const delay_ms = compute_retry_backoff_ms(attempt_index, this.random_fn)
        await this.sleep_fn(delay_ms)
      }
    }

    if (last_error !== null) {
      throw new AiProviderError(
        'AI_RETRY_EXHAUSTED',
        `Anthropic request failed after retries: ${last_error.message}`,
        {
          cause: last_error,
          status_code: last_error.status_code ?? undefined,
        }
      )
    }

    throw new AiProviderError('AI_UNKNOWN_ERROR', 'Anthropic request failed for unknown reason.')
  }

  private async request_anthropic_once(word: string): Promise<string> {
    const abort_controller = new AbortController()
    const timeout_id = setTimeout(
      () => {
        abort_controller.abort()
      },
      Math.round(this.timeout_seconds * 1000)
    )

    try {
      const response = await this.fetch_fn(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.api_key,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 600,
          system: 'Return only JSON for Japanese vocabulary cards.',
          messages: [
            {
              role: 'user',
              content: build_generation_prompt(word),
            },
          ],
        }),
        signal: abort_controller.signal,
      })

      const response_json = (await response
        .json()
        .catch(() => null)) as AnthropicMessagesResponse | null
      if (response.ok === false) {
        throw new AiProviderError(
          'AI_UPSTREAM_STATUS',
          response_json?.error?.message ??
            `Anthropic request failed with status ${response.status}.`,
          {
            retryable: response.status === 429 || response.status >= 500,
            status_code: response.status,
          }
        )
      }

      const response_text = response_json?.content
        ?.find((item) => item.type === 'text')
        ?.text?.trim()
      if (response_text === undefined || response_text.length === 0) {
        throw new AiProviderError('AI_JSON_INVALID', 'Anthropic response text is empty.', {
          retryable: true,
        })
      }

      return response_text
    } catch (error) {
      if (is_abort_error(error)) {
        throw new AiProviderError(
          'AI_TIMEOUT',
          `Anthropic request timed out after ${this.timeout_seconds} seconds.`,
          {
            cause: error,
            retryable: true,
          }
        )
      }

      throw error
    } finally {
      clearTimeout(timeout_id)
    }
  }
}

const classify_provider_error = (error: unknown): AiProviderError => {
  if (error instanceof AiProviderError) {
    return error
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
