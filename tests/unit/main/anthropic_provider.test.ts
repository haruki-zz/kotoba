import { describe, expect, it } from 'vitest'

import { AnthropicProvider } from '../../../src/main/anthropic_provider'

describe('anthropic_provider', () => {
  it('returns the required four json fields for a normal request', async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
    const provider = new AnthropicProvider({
      api_key: 'test-api-key',
      model: 'claude-sonnet-4-6',
      timeout_seconds: 15,
      retries: 2,
      fetch_fn: async (input, init) => {
        requests.push({ input, init })
        return new Response(
          JSON.stringify({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  reading_kana: 'たべる',
                  meaning_ja: '食物を口にして栄養を取ることです。',
                  context_scene_ja: '朝ごはんや昼ごはんを食べる場面で使います。',
                  example_sentence_ja: '私は毎朝パンを食べます。',
                }),
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      },
    })

    const generated = await provider.generate_word_card({ word: '食べる' })

    expect(generated.reading_kana).toBe('たべる')
    expect(generated.context_scene_ja).toContain('場面')
    expect(requests).toHaveLength(1)
    expect(String(requests[0]?.input)).toBe('https://api.anthropic.com/v1/messages')
    expect(String(requests[0]?.init?.body)).toContain('"model":"claude-sonnet-4-6"')
    expect(String(requests[0]?.init?.body)).toContain('食べる')
  })
})
