import { readFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { join } from 'node:path'

const INPUT_DIR = process.env.KOTOBA_BENCH_DIR?.trim() || '.tmp/bench'
const INPUT_PATH = join(INPUT_DIR, 'kotoba-library-10k.json')
const P95_THRESHOLD_MS = Number(process.env.KOTOBA_BENCH_P95_THRESHOLD_MS ?? '150')
const BENCH_ITERATIONS = Number(process.env.KOTOBA_BENCH_ITERATIONS ?? '300')

const raw = await readFile(INPUT_PATH, 'utf8').catch(() => null)
if (raw === null) {
  console.error(`[bench-search] seed file not found: ${INPUT_PATH}`)
  console.error('[bench-search] run `pnpm make:seed-10k` first')
  process.exit(1)
}

const parsed = JSON.parse(raw)
if (!Array.isArray(parsed.words)) {
  console.error('[bench-search] invalid seed file: words is missing')
  process.exit(1)
}

const indexed_words = parsed.words.map((word) => ({
  searchable_word: normalize_search_text(String(word.word ?? '')),
  searchable_reading: normalize_search_text(String(word.reading_kana ?? '')),
  searchable_meaning: normalize_search_text(String(word.meaning_ja ?? '')),
}))

const query_pool = [
  '単語',
  'たんご',
  'ｶﾀｶﾅ',
  'ai',
  'AI1',
  '説明文',
  '存在しない検索語',
  'カタカナ100',
  '単語9999',
  '技術',
]

const timings_ms = []
let matched_checksum = 0

for (let index = 0; index < BENCH_ITERATIONS; index += 1) {
  const query = query_pool[index % query_pool.length]
  const normalized_query = normalize_search_text(query)

  const started_at = performance.now()
  const matched_count =
    normalized_query.length === 0
      ? indexed_words.length
      : indexed_words.filter(
          (word) =>
            word.searchable_word.includes(normalized_query) ||
            word.searchable_reading.includes(normalized_query) ||
            word.searchable_meaning.includes(normalized_query)
        ).length
  const elapsed_ms = performance.now() - started_at

  timings_ms.push(elapsed_ms)
  matched_checksum += matched_count
}

const p50 = percentile(timings_ms, 50)
const p95 = percentile(timings_ms, 95)
const max = Math.max(...timings_ms)

console.log(`[bench-search] dataset_words=${indexed_words.length}`)
console.log(`[bench-search] iterations=${BENCH_ITERATIONS}`)
console.log(`[bench-search] p50_ms=${p50.toFixed(3)}`)
console.log(`[bench-search] p95_ms=${p95.toFixed(3)}`)
console.log(`[bench-search] max_ms=${max.toFixed(3)}`)
console.log(`[bench-search] matched_checksum=${matched_checksum}`)

if (p95 >= P95_THRESHOLD_MS) {
  console.error(`[bench-search] FAIL: p95 ${p95.toFixed(3)}ms >= threshold ${P95_THRESHOLD_MS}ms`)
  process.exit(1)
}

console.log(`[bench-search] PASS: p95 ${p95.toFixed(3)}ms < threshold ${P95_THRESHOLD_MS}ms`)

function percentile(values, p) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const rank = Math.ceil((p / 100) * sorted.length) - 1
  const index = Math.min(sorted.length - 1, Math.max(0, rank))
  return sorted[index]
}

function normalize_search_text(value) {
  const normalized = value.trim().normalize('NFKC').toLowerCase()
  return normalize_katakana_to_hiragana(normalized)
}

function normalize_katakana_to_hiragana(value) {
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
