import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { type AppStartupStatusResult } from '../shared/ipc'
import { LibraryRepository } from './library_repository'
import { LibraryService } from './library_service'
import { create_default_keytar_secret_store } from './keytar_secret_store'
import { register_ipc_router } from './ipc_router'
import { ReviewService } from './review_service'
import { SettingsRepository } from './settings_repository'
import { WordAddDraftRepository } from './word_add_draft_repository'
import { WordEntryService } from './word_entry_service'

const custom_user_data_dir = process.env.KOTOBA_USER_DATA_DIR?.trim()
if (custom_user_data_dir && custom_user_data_dir.length > 0) {
  app.setPath('userData', custom_user_data_dir)
}

const create_main_window = (): void => {
  const main_window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  const renderer_url = process.env.VITE_DEV_SERVER_URL

  if (renderer_url) {
    void main_window.loadURL(renderer_url)
    return
  }

  void main_window.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
}

const create_startup_status = (
  startup_result: Awaited<ReturnType<LibraryRepository['initialize_on_startup']>>
): AppStartupStatusResult => {
  if (startup_result.status === 'recovered') {
    return {
      notice_ja: '単語帳データの破損を検出したため、最新のバックアップから復元しました。',
      notice_kind: 'warning',
    }
  }

  if (startup_result.status === 'migrated') {
    return {
      notice_ja: '単語帳データを新しい形式に更新しました。',
      notice_kind: 'info',
    }
  }

  return {
    notice_ja: null,
    notice_kind: null,
  }
}

app.whenReady().then(() => {
  const user_data_dir = app.getPath('userData')
  const library_repository = new LibraryRepository({
    library_file_path: path.join(user_data_dir, 'kotoba-library.json'),
    backup_dir_path: path.join(user_data_dir, 'backups'),
  })

  void library_repository
    .initialize_on_startup()
    .then((startup_result) => {
      const startup_status = create_startup_status(startup_result)
      const settings_repository = new SettingsRepository({
        settings_file_path: path.join(user_data_dir, 'kotoba-settings.json'),
      })
      const api_key_secret_store = create_default_keytar_secret_store()

      const word_add_draft_repository = new WordAddDraftRepository({
        draft_file_path: path.join(user_data_dir, 'kotoba-word-add-draft.json'),
      })

      const word_entry_service = new WordEntryService({
        library_repository,
        settings_repository,
        api_key_secret_store,
      })
      const library_service = new LibraryService({
        library_repository,
      })
      const review_service = new ReviewService({
        library_repository,
      })

      register_ipc_router({
        word_entry_service,
        word_add_draft_repository,
        library_service,
        review_service,
        startup_status,
        settings_repository,
        api_key_secret_store,
      })

      create_main_window()
    })
    .catch((error) => {
      console.error('Failed to initialize repositories on startup.', error)
      app.quit()
    })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      create_main_window()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
