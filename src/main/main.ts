import { app, BrowserWindow } from 'electron'
import path from 'node:path'
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

app.whenReady().then(() => {
  const user_data_dir = app.getPath('userData')
  const library_repository = new LibraryRepository({
    library_file_path: path.join(user_data_dir, 'kotoba-library.json'),
    backup_dir_path: path.join(user_data_dir, 'backups'),
  })

  void library_repository
    .initialize_on_startup()
    .then(() => {
      const settings_repository = new SettingsRepository({
        settings_file_path: path.join(user_data_dir, 'kotoba-settings.json'),
      })

      const word_add_draft_repository = new WordAddDraftRepository({
        draft_file_path: path.join(user_data_dir, 'kotoba-word-add-draft.json'),
      })

      const word_entry_service = new WordEntryService({
        library_repository,
        settings_repository,
        api_key_secret_store: create_default_keytar_secret_store(),
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
