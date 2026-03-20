import type { GenerateContentResponse } from '@google/genai'
import { describe, expect, it } from 'vitest'

import { GeminiProvider, type GeminiClient } from '../../../src/main/gemini_provider'

const create_generated_text = (): string =>
  JSON.stringify({
    reading_kana: 'たべる',
    meaning_ja: '食物を口にして栄養を取ることです。',
    context_scene_ja: '朝ごはんや昼ごはんを食べる場面で使います。',
    example_sentence_ja: '私は毎朝パンを食べます。',
  })

describe('gemini_provider ai-provider', () => {
  it('returns the required four json fields for a normal request', async () => {
    const requests: unknown[] = []
    const client: GeminiClient = {
      models: {
        async generateContent(params) {
          requests.push(params)
          return { text: create_generated_text() } as GenerateContentResponse
        },
      },
    }

    const provider = new GeminiProvider({
      api_key: 'test-api-key',
      model: 'gemini-2.5-flash',
      timeout_seconds: 15,
      retries: 2,
      client,
    })

    const generated = await provider.generate_word_card({ word: '食べる' })

    expect(generated.reading_kana).toBe('たべる')
    expect(generated.meaning_ja.length).toBeGreaterThanOrEqual(8)
    expect(generated.context_scene_ja.length).toBeGreaterThanOrEqual(12)
    expect(generated.example_sentence_ja.length).toBeGreaterThanOrEqual(8)

    expect(requests).toHaveLength(1)
    const first_request = requests[0] as {
      model: string
      contents: string
      config: { responseMimeType: string }
    }
    expect(first_request.model).toBe('gemini-2.5-flash')
    expect(first_request.config.responseMimeType).toBe('application/json')
    expect(first_request.contents).toContain('食べる')
  })
})
