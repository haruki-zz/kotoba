import { access, copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
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

interface LaunchAppOptions {
  fake_generated_card_json?: string | null
  fake_generate_error_code?: 'api-key-missing' | 'network' | 'timeout' | 'api-key-invalid'
}

interface LibraryWordRecord {
  id: string
  word: string
  meaning_ja: string
  review_state: {
    repetition: number
    interval_days: number
    easiness_factor: number
    next_review_at: string
    last_review_at: string | null
    last_grade: number | null
  }
}

interface LibraryFileRecord {
  schema_version: number
  updated_at: string
  words: LibraryWordRecord[]
  review_logs: unknown[]
}

const launch_app = async (
  user_data_dir: string,
  options: LaunchAppOptions = {}
): Promise<LaunchedApp> => {
  const fake_keytar_file = path.join(user_data_dir, 'kotoba-test-api-key.txt')
  const electron_app = await electron.launch({
    args: ['.'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      KOTOBA_USER_DATA_DIR: user_data_dir,
      KOTOBA_FAKE_GENERATE_CARD_JSON:
        options.fake_generated_card_json === undefined
          ? JSON.stringify(FAKE_GENERATED_CARD)
          : (options.fake_generated_card_json ?? ''),
      KOTOBA_FAKE_GENERATE_ERROR_CODE: options.fake_generate_error_code ?? '',
      KOTOBA_FAKE_KEYTAR_FILE: fake_keytar_file,
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

const create_backup_from_current_library = async (user_data_dir: string): Promise<void> => {
  const library_path = path.join(user_data_dir, 'kotoba-library.json')
  const backup_dir_path = path.join(user_data_dir, 'backups')
  await mkdir(backup_dir_path, { recursive: true })
  await copyFile(library_path, path.join(backup_dir_path, 'kotoba-library-manual-recovery.json'))
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

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
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

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
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

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
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

test('library-crud: list search edit delete words in library page', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-library-crud')
  const launched = await launch_app(user_data_dir)

  try {
    await create_word_by_generate_then_save(
      launched.page,
      'かたかな',
      '文字体系について説明する最初の意味です。'
    )
    await expect(launched.page.getByRole('status')).toHaveText('単語を保存しました')

    await create_word_by_generate_then_save(
      launched.page,
      'AI',
      '人工知能の技術分野を指す単語です。'
    )
    await expect(launched.page.getByRole('status')).toHaveText('単語を保存しました')

    await launched.page.getByRole('button', { name: '単語帳' }).click()
    await expect(launched.page.locator('.library_item')).toHaveCount(2)

    await launched.page.getByLabel('単語帳検索').fill(' ｶﾀｶﾅ ')
    await expect(launched.page.locator('.library_item')).toHaveCount(1)
    await expect(launched.page.locator('.library_item')).toContainText('かたかな')

    await launched.page.getByLabel('単語帳検索').fill('ai')
    await expect(launched.page.locator('.library_item')).toHaveCount(1)
    await expect(launched.page.locator('.library_item')).toContainText('AI')

    await launched.page.getByLabel('単語帳検索').fill('')
    await expect(launched.page.locator('.library_item')).toHaveCount(2)

    const ai_item = launched.page.locator('.library_item').filter({ hasText: 'AI' })
    await ai_item.getByRole('button', { name: '編集' }).click()
    await launched.page
      .getByLabel('編集意味')
      .fill('更新後の意味です。人工知能の応用領域全体を示す語です。')
    await launched.page.getByRole('button', { name: '更新' }).click()
    await expect(launched.page.getByRole('status')).toHaveText('単語を更新しました')
    await expect(launched.page.locator('.library_item').filter({ hasText: 'AI' })).toContainText(
      '更新後の意味です。人工知能の応用領域全体を示す語です。'
    )

    const dialog_handled = new Promise<void>((resolve) => {
      launched.page.once('dialog', (dialog) => {
        void dialog.accept().then(() => resolve())
      })
    })
    await launched.page
      .locator('.library_item')
      .filter({ hasText: 'かたかな' })
      .getByRole('button', { name: '削除' })
      .click()
    await dialog_handled

    await expect(launched.page.getByRole('status')).toHaveText('単語を削除しました')
    await expect(launched.page.locator('.library_item')).toHaveCount(1)
    await expect(launched.page.locator('.library_item')).toContainText('AI')
  } finally {
    await close_app(launched.electron_app)
  }

  const library = await read_library_file(user_data_dir)
  expect(library.words).toHaveLength(1)
  expect(library.words[0]?.word).toBe('AI')
  expect(library.words[0]?.meaning_ja).toBe(
    '更新後の意味です。人工知能の応用領域全体を示す語です。'
  )
})

test('review-flow: grade due word and persist updated review_state', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-review-flow')
  const launched = await launch_app(user_data_dir)

  try {
    await create_word_by_generate_then_save(
      launched.page,
      '復習',
      '学んだ内容を繰り返し確認する行為です。'
    )
    await expect(launched.page.getByRole('status')).toHaveText('単語を保存しました')

    await launched.page.getByRole('button', { name: '復習' }).click()
    await expect(launched.page.getByText('残り 1 件')).toBeVisible()
    await expect(launched.page.locator('.review_word')).toHaveText('復習')

    await launched.page.getByRole('button', { name: '4' }).click()
    await expect(launched.page.getByRole('status')).toHaveText('復習結果を保存しました')
    await expect(launched.page.getByText('残り 0 件')).toBeVisible()
    await expect(launched.page.getByText('今日完了 1 件')).toBeVisible()
    await expect(launched.page.getByText('今日の復習は完了しました。')).toBeVisible()
  } finally {
    await close_app(launched.electron_app)
  }

  const library = await read_library_file(user_data_dir)
  expect(library.words).toHaveLength(1)
  expect(library.words[0]?.word).toBe('復習')
  expect(library.words[0]?.review_state.repetition).toBe(1)
  expect(library.words[0]?.review_state.interval_days).toBe(1)
  expect(library.words[0]?.review_state.last_grade).toBe(4)
  expect(library.words[0]?.review_state.last_review_at).not.toBeNull()

  const next_review_at = new Date(library.words[0]!.review_state.next_review_at).getTime()
  const last_review_at = new Date(library.words[0]!.review_state.last_review_at!).getTime()
  expect(next_review_at).toBeGreaterThan(last_review_at)
})

test('i18n-ja: shows japanese labels, actions, and dialog text on the main flows', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-i18n-ja')
  const launched = await launch_app(user_data_dir)

  try {
    await expect(launched.page.getByRole('heading', { name: 'Kotoba' })).toBeVisible()
    await expect(
      launched.page.getByText('日本語の単語を生成・編集して保存できます。')
    ).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '単語追加' })).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '単語帳' })).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '復習' })).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '設定' })).toBeVisible()
    await expect(launched.page.getByLabel('単語')).toBeVisible()
    await expect(launched.page.getByLabel('読み仮名')).toBeVisible()
    await expect(launched.page.getByLabel('意味')).toBeVisible()
    await expect(launched.page.getByLabel('文脈')).toBeVisible()
    await expect(launched.page.getByLabel('例文')).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '生成' })).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '保存' })).toBeVisible()

    await create_word_by_generate_then_save(
      launched.page,
      '景色',
      '見える風景や周囲の眺めを表す言葉です。'
    )
    await expect(launched.page.getByRole('status')).toHaveText('単語を保存しました')

    await launched.page.getByRole('button', { name: '単語帳' }).click()
    await expect(launched.page.getByRole('heading', { name: '単語帳' })).toBeVisible()
    await expect(launched.page.getByLabel('単語帳検索')).toHaveAttribute(
      'placeholder',
      '単語・読み仮名・意味で検索'
    )
    await expect(launched.page.getByRole('button', { name: '編集' })).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '削除' })).toBeVisible()

    const delete_dialog = new Promise<void>((resolve) => {
      launched.page.once('dialog', async (dialog) => {
        expect(dialog.message()).toBe('「景色」を削除しますか？')
        await dialog.dismiss()
        resolve()
      })
    })
    await launched.page.getByRole('button', { name: '削除' }).click()
    await delete_dialog

    await launched.page.getByRole('button', { name: '復習' }).click()
    await expect(launched.page.getByRole('heading', { name: '復習' })).toBeVisible()
    await expect(launched.page.getByText('残り 1 件')).toBeVisible()
    await expect(launched.page.getByText('今日完了 0 件')).toBeVisible()
    await expect(
      launched.page.getByText('評価を選ぶと次回の復習日時が更新されます。')
    ).toBeVisible()
  } finally {
    await close_app(launched.electron_app)
  }
})

test('settings: save settings and api key, reload them, then delete api key', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-settings')
  const first_launch = await launch_app(user_data_dir)

  try {
    await first_launch.page.getByRole('button', { name: '設定' }).click()
    await expect(first_launch.page.getByRole('heading', { name: '設定' })).toBeVisible()
    await expect(first_launch.page.getByText('API キーの状態: 未設定')).toBeVisible()

    await first_launch.page.getByLabel('モデル名').fill('gemini-2.0-flash')
    await first_launch.page.getByLabel('タイムアウト秒').fill('20')
    await first_launch.page.getByLabel('リトライ回数').fill('3')
    await first_launch.page.getByLabel('API キー').fill('test-api-key-from-settings')
    await first_launch.page.getByRole('button', { name: '設定を保存' }).click()

    await expect(first_launch.page.getByRole('status')).toHaveText(
      '設定を保存し、API キーを更新しました。'
    )
    await expect(first_launch.page.getByText('API キーの状態: 登録済み')).toBeVisible()
    await expect(first_launch.page.getByLabel('API キー')).toHaveValue('')
  } finally {
    await close_app(first_launch.electron_app)
  }

  const settings_path = path.join(user_data_dir, 'kotoba-settings.json')
  const settings_raw = await readFile(settings_path, 'utf8')
  expect(settings_raw).toContain('"model": "gemini-2.0-flash"')
  expect(settings_raw).toContain('"timeout_seconds": 20')
  expect(settings_raw).toContain('"retries": 3')
  expect(settings_raw).not.toContain('test-api-key-from-settings')

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
  try {
    await second_launch.page.getByRole('button', { name: '設定' }).click()
    await expect(second_launch.page.getByText('API キーの状態: 登録済み')).toBeVisible()
    await expect(second_launch.page.getByLabel('モデル名')).toHaveValue('gemini-2.0-flash')
    await expect(second_launch.page.getByLabel('タイムアウト秒')).toHaveValue('20')
    await expect(second_launch.page.getByLabel('リトライ回数')).toHaveValue('3')

    await second_launch.page.getByRole('button', { name: 'API キーを削除' }).click()
    await expect(second_launch.page.getByRole('status')).toHaveText('API キーを削除しました。')
    await expect(second_launch.page.getByText('API キーの状態: 未設定')).toBeVisible()

    await second_launch.page.getByRole('button', { name: '単語追加' }).click()
    await second_launch.page.getByLabel('単語').fill('設定確認')
    await second_launch.page.getByRole('button', { name: '生成' }).click()
    await expect
      .poll(() => second_launch.page.locator('body').innerText())
      .toContain(
        'API キーが設定されていません。設定ページで API キーを設定してから、もう一度お試しください。'
      )
  } finally {
    await close_app(second_launch.electron_app)
  }
})

test('error-handling: keeps input and shows japanese guidance for generate failures', async () => {
  const scenarios: Array<{
    name: string
    fake_generate_error_code: LaunchAppOptions['fake_generate_error_code']
    expected_message: string
  }> = [
    {
      name: 'api-key-missing',
      fake_generate_error_code: 'api-key-missing',
      expected_message:
        'API キーが設定されていません。設定ページで API キーを設定してから、もう一度お試しください。',
    },
    {
      name: 'network',
      fake_generate_error_code: 'network',
      expected_message:
        'ネットワークエラーが発生しました。接続を確認して、もう一度お試しください。入力内容は保持されています。',
    },
    {
      name: 'timeout',
      fake_generate_error_code: 'timeout',
      expected_message:
        '応答がタイムアウトしました。時間を置いて、もう一度お試しください。入力内容は保持されています。',
    },
    {
      name: 'api-key-invalid',
      fake_generate_error_code: 'api-key-invalid',
      expected_message: 'API キーが無効です。設定を確認してから、もう一度お試しください。',
    },
  ]

  for (const scenario of scenarios) {
    const user_data_dir = await create_temp_user_data_dir(`kotoba-e2e-${scenario.name}`)
    const launched = await launch_app(user_data_dir, {
      fake_generated_card_json: null,
      fake_generate_error_code: scenario.fake_generate_error_code,
    })

    try {
      await launched.page.getByLabel('単語').fill('試験')
      await launched.page.getByRole('button', { name: '生成' }).click()
      await expect(launched.page.getByRole('alert')).toHaveText(scenario.expected_message)
      await expect(launched.page.getByLabel('単語')).toHaveValue('試験')
    } finally {
      await close_app(launched.electron_app)
    }
  }
})

test('error-handling: restores the latest backup and notifies the user in japanese', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-startup-recovery')
  const first_launch = await launch_app(user_data_dir)

  try {
    await create_word_by_generate_then_save(
      first_launch.page,
      '復旧',
      '破損から戻したことを確認するための単語です。'
    )
    await expect(first_launch.page.getByRole('status')).toHaveText('単語を保存しました')
  } finally {
    await close_app(first_launch.electron_app)
  }

  await create_backup_from_current_library(user_data_dir)
  await writeFile(path.join(user_data_dir, 'kotoba-library.json'), '{ broken json', 'utf8')

  const relaunched = await launch_app(user_data_dir)
  try {
    await expect(relaunched.page.getByRole('alert')).toHaveText(
      '単語帳データの破損を検出したため、最新のバックアップから復元しました。'
    )
    await relaunched.page.getByRole('button', { name: '単語帳' }).click()
    await expect(relaunched.page.locator('.library_item')).toContainText('復旧')
  } finally {
    await close_app(relaunched.electron_app)
  }
})
