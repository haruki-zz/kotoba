import { access, mkdtemp, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test'

const FAKE_GENERATED_CARD = {
  reading_kana: 'たべる',
  meaning_ja: '食物を口にして栄養を取る行為のことです。',
  context_scene_ja: '日常の食事や外食などの場面で使う表現です。',
  example_sentence_ja: '私は毎朝パンを食べます。',
} as const

interface LaunchedApp {
  electron_app: ElectronApplication
  page: Page
}

interface LibraryWordRecord {
  word: string
  meaning_ja: string
}

interface LibraryFileRecord {
  words: LibraryWordRecord[]
}

const launch_app = async (user_data_dir: string): Promise<LaunchedApp> => {
  const electron_app = await electron.launch({
    args: ['.'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      KOTOBA_USER_DATA_DIR: user_data_dir,
      KOTOBA_FAKE_GENERATE_CARD_JSON: JSON.stringify(FAKE_GENERATED_CARD),
    },
  })

  await electron_app.firstWindow()
  const page = await wait_for_kotoba_window(electron_app)
  return { electron_app, page }
}

const close_app = async (electron_app: ElectronApplication): Promise<void> => {
  await electron_app.close().catch(() => undefined)
}

const create_temp_user_data_dir = async (prefix: string): Promise<string> =>
  mkdtemp(path.join(tmpdir(), `${prefix}-`))

const read_library_file = async (user_data_dir: string): Promise<LibraryFileRecord> => {
  const library_path = path.join(user_data_dir, 'kotoba-library.json')
  const content = await readFile(library_path, 'utf8')
  return JSON.parse(content) as LibraryFileRecord
}

const file_exists = async (target_path: string): Promise<boolean> => {
  try {
    await access(target_path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

const wait_for_kotoba_window = async (electron_app: ElectronApplication): Promise<Page> => {
  const timeout_ms = 15_000
  const poll_interval_ms = 250
  const started_at = Date.now()

  while (Date.now() - started_at < timeout_ms) {
    const windows = electron_app.windows()
    for (const page of windows) {
      await page.waitForLoadState('domcontentloaded').catch(() => undefined)
      const body_text = await page
        .locator('body')
        .innerText()
        .catch(() => '')
      if (body_text.includes('Kotoba')) {
        return page
      }
    }
    await new Promise((resolve) => setTimeout(resolve, poll_interval_ms))
  }

  const window_urls = electron_app.windows().map((page) => page.url())
  throw new Error(`Kotoba window did not load in time. urls=${window_urls.join(',')}`)
}

const create_word_by_generate_then_save = async (
  page: Page,
  word: string,
  meaning_ja: string
): Promise<void> => {
  await page.getByLabel('単語').fill(word)
  await page.getByRole('button', { name: '生成' }).click()
  await expect(page.getByLabel('読み仮名')).toHaveValue(FAKE_GENERATED_CARD.reading_kana)
  await page.getByLabel('意味').fill(meaning_ja)
  await page.getByRole('button', { name: '保存' }).click()
}

test('word-create: create word and persist after restart', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-word-create')
  const first_launch = await launch_app(user_data_dir)

  try {
    await create_word_by_generate_then_save(
      first_launch.page,
      '食べる',
      '食物を口にして栄養を取る基本的な行為です。'
    )
    await expect(first_launch.page.getByRole('status')).toHaveText('単語を保存しました')
    await expect(first_launch.page.getByLabel('単語')).toHaveValue('')
  } finally {
    await close_app(first_launch.electron_app)
  }

  const second_launch = await launch_app(user_data_dir)
  try {
    await expect(second_launch.page.getByLabel('単語')).toHaveValue('')
  } finally {
    await close_app(second_launch.electron_app)
  }

  const library = await read_library_file(user_data_dir)
  expect(library.words).toHaveLength(1)
  expect(library.words[0]?.word).toBe('食べる')
  expect(library.words[0]?.meaning_ja).toBe('食物を口にして栄養を取る基本的な行為です。')

  const draft_file_path = path.join(user_data_dir, 'kotoba-word-add-draft.json')
  await expect.poll(() => file_exists(draft_file_path)).toBe(false)
})

test('draft: recover unsaved inputs after debounce autosave', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-draft-debounce')
  const first_launch = await launch_app(user_data_dir)

  try {
    await first_launch.page.getByLabel('単語').fill('散歩')
    await first_launch.page.getByLabel('意味').fill('近所をゆっくり歩いて気分転換することです。')
    await first_launch.page.waitForTimeout(900)
  } finally {
    await close_app(first_launch.electron_app)
  }

  const second_launch = await launch_app(user_data_dir)
  try {
    await expect(second_launch.page.getByLabel('単語')).toHaveValue('散歩')
    await expect(second_launch.page.getByLabel('意味')).toHaveValue(
      '近所をゆっくり歩いて気分転換することです。'
    )
  } finally {
    await close_app(second_launch.electron_app)
  }
})

test('draft: save draft on page switch before debounce timeout', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-draft-page-switch')
  const first_launch = await launch_app(user_data_dir)

  try {
    await first_launch.page.getByLabel('単語').fill('猫')
    await first_launch.page.getByRole('button', { name: '単語帳' }).click()
    await first_launch.page.waitForTimeout(200)
  } finally {
    await close_app(first_launch.electron_app)
  }

  const second_launch = await launch_app(user_data_dir)
  try {
    await expect(second_launch.page.getByLabel('単語')).toHaveValue('猫')
  } finally {
    await close_app(second_launch.electron_app)
  }
})

test('duplicate-word: overwrite existing word by normalized word key', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-duplicate-word')
  const launched = await launch_app(user_data_dir)

  try {
    await create_word_by_generate_then_save(
      launched.page,
      ' ｶﾀｶﾅ ',
      '最初に保存した意味です。重複上書き前の内容です。'
    )
    await expect(launched.page.getByRole('status')).toHaveText('単語を保存しました')

    await create_word_by_generate_then_save(
      launched.page,
      'カタカナ',
      '二回目の保存で既存単語を上書きした後の内容です。'
    )
    await expect(launched.page.getByRole('status')).toHaveText('既存の単語を更新しました')
  } finally {
    await close_app(launched.electron_app)
  }

  const library = await read_library_file(user_data_dir)
  expect(library.words).toHaveLength(1)
  expect(library.words[0]?.word).toBe('カタカナ')
  expect(library.words[0]?.meaning_ja).toBe('二回目の保存で既存単語を上書きした後の内容です。')
})
