import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SEED_WORD_COUNT = 10_000
const OUTPUT_DIR = process.env.KOTOBA_BENCH_DIR?.trim() || '.tmp/bench'
const OUTPUT_PATH = join(OUTPUT_DIR, 'kotoba-library-10k.json')

const now_iso = new Date().toISOString()
const words = Array.from({ length: SEED_WORD_COUNT }, (_, index) => {
  const item_number = index + 1
  const id = item_number.toString().padStart(12, '0')
  const word =
    item_number % 3 === 0
      ? `カタカナ${item_number}`
      : item_number % 3 === 1
        ? `単語${item_number}`
        : `AI${item_number}`

  return {
    id: `00000000-0000-4000-8000-${id}`,
    word,
    reading_kana: item_number % 2 === 0 ? `たんご${item_number}` : `カタカナ${item_number}`,
    meaning_ja: `これは${item_number}番目の単語です。検索性能を確認するための説明文です。`,
    context_scene_ja: `学習中に${item_number}番目の単語を復習する文脈を想定しています。`,
    example_sentence_ja: `${item_number}番目の単語を使って練習します。`,
    source_provider: 'gemini',
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
})

const payload = {
  schema_version: 1,
  updated_at: now_iso,
  words,
  review_logs: [],
}

await mkdir(OUTPUT_DIR, { recursive: true })
await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

console.log(`[seed-10k] generated words=${SEED_WORD_COUNT}`)
console.log(`[seed-10k] output=${OUTPUT_PATH}`)
