import { ApiError, type GenerateContentResponse } from '@google/genai'
import { describe, expect, it } from 'vitest'

import { GeminiProvider, type GeminiClient } from './gemini_provider'

const create_japanese_generated_text = (): string =>
  JSON.stringify({
    reading_kana: 'たべる',
    meaning_ja: '食物を口にして栄養を取ることです。',
    context_scene_ja: '朝ごはんや昼ごはんを食べる場面で使います。',
    example_sentence_ja: '私は毎朝パンを食べます。',
  })

describe('gemini_provider ai-retry', () => {
  it('retries retryable upstream errors with 500ms -> 1500ms backoff', async () => {
    const sleep_calls: number[] = []
    let call_count = 0

    const client: GeminiClient = {
      models: {
        async generateContent() {
          call_count += 1
          if (call_count === 1) {
            throw new ApiError({ message: 'Too Many Requests', status: 429 })
          }
          if (call_count === 2) {
            throw new ApiError({ message: 'Internal Server Error', status: 500 })
          }
          return { text: create_japanese_generated_text() } as GenerateContentResponse
        },
      },
    }

    const provider = new GeminiProvider({
      api_key: 'test-api-key',
      model: 'gemini-2.5-flash',
      timeout_seconds: 15,
      retries: 2,
      client,
      random_fn: () => 0.5,
      sleep_fn: async (duration_ms: number) => {
        sleep_calls.push(duration_ms)
      },
    })

    const generated = await provider.generate_word_card({ word: '食べる' })

    expect(generated.reading_kana).toBe('たべる')
    expect(call_count).toBe(3)
    expect(sleep_calls).toEqual([500, 1500])
  })

  it('automatically retries once when the first response is non-japanese output', async () => {
    const sleep_calls: number[] = []
    let call_count = 0

    const client: GeminiClient = {
      models: {
        async generateContent() {
          call_count += 1
          if (call_count === 1) {
            return {
              text: JSON.stringify({
                reading_kana: 'taberu',
                meaning_ja: 'eat food',
                context_scene_ja: 'in a restaurant',
                example_sentence_ja: 'I eat bread every morning.',
              }),
            } as GenerateContentResponse
          }

          return { text: create_japanese_generated_text() } as GenerateContentResponse
        },
      },
    }

    const provider = new GeminiProvider({
      api_key: 'test-api-key',
      model: 'gemini-2.5-flash',
      timeout_seconds: 15,
      retries: 2,
      client,
      random_fn: () => 0.5,
      sleep_fn: async (duration_ms: number) => {
        sleep_calls.push(duration_ms)
      },
    })

    const generated = await provider.generate_word_card({ word: '食べる' })

    expect(generated.meaning_ja).toContain('食物')
    expect(call_count).toBe(2)
    expect(sleep_calls).toEqual([500])
  })
})
