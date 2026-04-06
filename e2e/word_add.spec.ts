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
  await open_word_add_page(page)
  await page.getByLabel('単語').first().fill(word)
  await page.getByRole('button', { name: '生成' }).click()
  await expect(page.getByLabel('読み仮名')).toHaveValue(FAKE_GENERATED_CARD.reading_kana)
  await page.getByLabel('意味').fill(meaning_ja)
  await page.getByRole('button', { name: '保存' }).click()
}

const open_page = async (page: Page, tab_name: string, title: string): Promise<void> => {
  const navigation_button = page
    .getByRole('navigation', { name: 'メインページ' })
    .locator('button')
    .filter({ hasText: tab_name })
    .first()
  await navigation_button.click()
  await expect(navigation_button).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

const open_word_add_page = async (page: Page): Promise<void> => {
  await open_page(page, '単語追加', '新しい単語を追加')
  await expect(page.getByLabel('単語').first()).toBeVisible()
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
    await expect(first_launch.page.getByRole('status')).toContainText('単語を保存しました')
    await expect(first_launch.page.getByLabel('単語').first()).toHaveValue('')
  } finally {
    await close_app(first_launch.electron_app)
  }

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
  try {
    await open_word_add_page(second_launch.page)
    await expect(second_launch.page.getByLabel('単語').first()).toHaveValue('')
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
    await open_word_add_page(first_launch.page)
    await first_launch.page.getByLabel('単語').first().fill('散歩')
    await first_launch.page.getByLabel('意味').fill('近所をゆっくり歩いて気分転換することです。')
    await first_launch.page.waitForTimeout(900)
  } finally {
    await close_app(first_launch.electron_app)
  }

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
  try {
    await open_word_add_page(second_launch.page)
    await expect(second_launch.page.getByLabel('単語').first()).toHaveValue('散歩')
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
    await open_word_add_page(first_launch.page)
    await first_launch.page.getByLabel('単語').first().fill('猫')
    await first_launch.page
      .getByRole('navigation', { name: 'メインページ' })
      .locator('button')
      .filter({ hasText: '単語帳' })
      .first()
      .click()
    await first_launch.page.waitForTimeout(200)
  } finally {
    await close_app(first_launch.electron_app)
  }

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
  try {
    await open_word_add_page(second_launch.page)
    await expect(second_launch.page.getByLabel('単語').first()).toHaveValue('猫')
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
    await expect(launched.page.getByRole('status')).toContainText('単語を保存しました')

    await create_word_by_generate_then_save(
      launched.page,
      'カタカナ',
      '二回目の保存で既存単語を上書きした後の内容です。'
    )
    await expect(launched.page.getByRole('status')).toContainText('既存の単語を更新しました')
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
    await expect(launched.page.getByRole('status')).toContainText('単語を保存しました')

    await create_word_by_generate_then_save(
      launched.page,
      'AI',
      '人工知能の技術分野を指す単語です。'
    )
    await expect(launched.page.getByRole('status')).toContainText('単語を保存しました')

    await open_page(launched.page, '単語帳', '保存済み単語の管理')
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
    await expect(launched.page.getByRole('status')).toContainText('単語を更新しました')
    await expect(launched.page.locator('.library_item').filter({ hasText: 'AI' })).toContainText(
      '更新後の意味です。人工知能の応用領域全体を示す語です。'
    )

    await launched.page
      .locator('.library_item')
      .filter({ hasText: 'かたかな' })
      .getByRole('button', { name: '削除' })
      .click()
    await expect(launched.page.getByRole('alertdialog')).toContainText(
      '「かたかな」を削除します。この操作は取り消せません。'
    )
    await launched.page.getByRole('button', { name: '削除する' }).click()

    await expect(launched.page.getByRole('status')).toContainText('単語を削除しました')
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
    await expect(launched.page.getByRole('status')).toContainText('単語を保存しました')

    await open_page(launched.page, '復習', '今日の復習キュー')
    await expect(launched.page.locator('.review_due_stat')).toContainText('1 件')
    await expect(launched.page.locator('.review_completed_stat')).toContainText('0 件')
    await expect(launched.page.locator('.review_word')).toHaveText('復習')

    await launched.page.getByRole('button', { name: '4' }).click()
    await expect(launched.page.getByRole('status')).toContainText('復習結果を保存しました')
    await expect(launched.page.locator('.review_due_stat')).toContainText('0 件')
    await expect(launched.page.locator('.review_completed_stat')).toContainText('1 件')
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

test('activity-heatmap: show daily activity based on word adds and reviews', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-activity-heatmap')
  const launched = await launch_app(user_data_dir)

  try {
    await expect(launched.page.getByRole('heading', { name: '学習活動の全体像' })).toBeVisible()
    await create_word_by_generate_then_save(
      launched.page,
      '活動',
      '毎日の学習状況や取り組み量を表す言葉です。'
    )
    await expect(launched.page.getByRole('status')).toContainText('単語を保存しました')

    await open_page(launched.page, '復習', '今日の復習キュー')
    await launched.page.getByRole('button', { name: '4' }).click()
    await expect(launched.page.getByRole('status')).toContainText('復習結果を保存しました')

    await open_page(launched.page, '活動', '学習活動の全体像')
    await expect(
      launched.page.getByText(
        '活動量は単語追加と復習の合計件数です。直近 40 週間の学習量を表示します。'
      )
    ).toBeVisible()

    const today_label = await launched.page.evaluate(() => {
      const now = new Date()
      const year = now.getFullYear().toString().padStart(4, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })

    await expect(
      launched.page.getByRole('gridcell', {
        name: new RegExp(`${today_label}: 活動 2 件（追加 1 件、復習 1 件）`),
      })
    ).toBeVisible()
    await expect(
      launched.page.locator('.activity_summary_card').filter({ hasText: '総活動' })
    ).toContainText('2 件')
    await expect(launched.page.getByRole('heading', { name: '記憶レベル構成' })).toBeVisible()
    await expect(
      launched.page.locator('.activity_memory_level_card').filter({ hasText: 'レベル 2' })
    ).toContainText('100.0%')
    await expect(
      launched.page.locator('.activity_memory_level_card').filter({ hasText: 'レベル 2' })
    ).toContainText('1 語 / 全 1 語')
  } finally {
    await close_app(launched.electron_app)
  }
})

test('i18n-ja: shows japanese labels, actions, and dialog text on the main flows', async () => {
  const user_data_dir = await create_temp_user_data_dir('kotoba-e2e-i18n-ja')
  const launched = await launch_app(user_data_dir)

  try {
    await expect(launched.page.getByText('Kotoba')).toBeVisible()
    await expect(
      launched.page.getByText('直近 40 週間の学習量と現在の記憶レベル構成を確認できます。')
    ).toBeVisible()
    await expect(
      launched.page
        .getByRole('navigation', { name: 'メインページ' })
        .locator('button')
        .filter({ hasText: '単語追加' })
        .first()
    ).toBeVisible()
    await expect(
      launched.page
        .getByRole('navigation', { name: 'メインページ' })
        .locator('button')
        .filter({ hasText: '単語帳' })
        .first()
    ).toBeVisible()
    await expect(
      launched.page
        .getByRole('navigation', { name: 'メインページ' })
        .locator('button')
        .filter({ hasText: '復習' })
        .first()
    ).toBeVisible()
    await expect(
      launched.page
        .getByRole('navigation', { name: 'メインページ' })
        .locator('button')
        .filter({ hasText: '活動' })
        .first()
    ).toBeVisible()
    await expect(
      launched.page
        .getByRole('navigation', { name: 'メインページ' })
        .locator('button')
        .filter({ hasText: '設定' })
        .first()
    ).toBeVisible()
    await expect(launched.page.getByRole('heading', { name: '学習活動の全体像' })).toBeVisible()
    await expect(
      launched.page.getByText(
        '活動量は単語追加と復習の合計件数です。直近 40 週間の学習量を表示します。'
      )
    ).toBeVisible()
    await open_word_add_page(launched.page)
    await expect(launched.page.getByLabel('単語').first()).toBeVisible()
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
    await expect(launched.page.getByRole('status')).toContainText('単語を保存しました')

    await open_page(launched.page, '単語帳', '保存済み単語の管理')
    await expect(launched.page.getByLabel('単語帳検索')).toHaveAttribute(
      'placeholder',
      '単語・読み仮名・意味で検索'
    )
    await expect(launched.page.getByRole('button', { name: '編集' })).toBeVisible()
    await expect(launched.page.getByRole('button', { name: '削除' })).toBeVisible()

    await launched.page.getByRole('button', { name: '削除' }).click()
    await expect(launched.page.getByRole('alertdialog')).toContainText(
      '「景色」を削除します。この操作は取り消せません。'
    )
    await launched.page.getByRole('button', { name: '削除しない' }).click()

    await open_page(launched.page, '復習', '今日の復習キュー')
    await expect(launched.page.locator('.review_due_stat')).toContainText('1 件')
    await expect(launched.page.locator('.review_completed_stat')).toContainText('0 件')
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
    await open_page(first_launch.page, '設定', 'AI 設定の管理')
    await expect(first_launch.page.getByText('API キーの状態: 未設定')).toBeVisible()

    await first_launch.page.getByLabel('プロバイダー').selectOption('openai')
    await first_launch.page.getByLabel('モデル').selectOption('gpt-4o-mini')
    await first_launch.page.getByLabel('タイムアウト秒').fill('20')
    await first_launch.page.getByLabel('リトライ回数').fill('3')
    await first_launch.page.getByLabel('API キー').fill('test-api-key-from-settings')
    await first_launch.page.getByRole('button', { name: '設定を保存' }).click()

    await expect(first_launch.page.getByRole('status')).toContainText(
      '設定を保存し、API キーを更新しました。'
    )
    await expect(first_launch.page.getByText('API キーの状態: 登録済み')).toBeVisible()
    await expect(first_launch.page.getByLabel('API キー')).toHaveValue('')
  } finally {
    await close_app(first_launch.electron_app)
  }

  const settings_path = path.join(user_data_dir, 'kotoba-settings.json')
  const settings_raw = await readFile(settings_path, 'utf8')
  expect(settings_raw).toContain('"provider": "openai"')
  expect(settings_raw).toContain('"model": "gpt-4o-mini"')
  expect(settings_raw).toContain('"timeout_seconds": 20')
  expect(settings_raw).toContain('"retries": 3')
  expect(settings_raw).not.toContain('test-api-key-from-settings')

  const second_launch = await launch_app(user_data_dir, {
    fake_generated_card_json: null,
  })
  try {
    await open_page(second_launch.page, '設定', 'AI 設定の管理')
    await expect(second_launch.page.getByText('API キーの状態: 登録済み')).toBeVisible()
    await expect(second_launch.page.getByLabel('プロバイダー')).toHaveValue('openai')
    await expect(second_launch.page.getByLabel('モデル')).toHaveValue('gpt-4o-mini')
    await expect(second_launch.page.getByLabel('タイムアウト秒')).toHaveValue('20')
    await expect(second_launch.page.getByLabel('リトライ回数')).toHaveValue('3')

    await second_launch.page.getByRole('button', { name: 'API キーを削除' }).click()
    await expect(second_launch.page.getByRole('status')).toContainText('API キーを削除しました。')
    await expect(second_launch.page.getByText('API キーの状態: 未設定')).toBeVisible()

    await open_page(second_launch.page, '単語追加', '新しい単語を追加')
    await second_launch.page.getByLabel('単語').first().fill('設定確認')
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
      await open_word_add_page(launched.page)
      await launched.page.getByLabel('単語').first().fill('試験')
      await launched.page.getByRole('button', { name: '生成' }).click()
      await expect(launched.page.getByRole('alert')).toContainText(scenario.expected_message)
      await expect(launched.page.getByLabel('単語').first()).toHaveValue('試験')
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
    await expect(first_launch.page.getByRole('status')).toContainText('単語を保存しました')
  } finally {
    await close_app(first_launch.electron_app)
  }

  await create_backup_from_current_library(user_data_dir)
  await writeFile(path.join(user_data_dir, 'kotoba-library.json'), '{ broken json', 'utf8')

  const relaunched = await launch_app(user_data_dir)
  try {
    await expect(relaunched.page.getByRole('alert')).toContainText(
      '単語帳データの破損を検出したため、最新のバックアップから復元しました。'
    )
    await open_page(relaunched.page, '単語帳', '保存済み単語の管理')
    await expect(relaunched.page.locator('.library_item')).toContainText('復旧')
  } finally {
    await close_app(relaunched.electron_app)
  }
})
