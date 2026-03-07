import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { register_ipc_router } from './ipc_router'

const create_main_window = (): void => {
  const main_window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  const renderer_url = process.env.VITE_DEV_SERVER_URL

  if (renderer_url) {
    void main_window.loadURL(renderer_url)
    return
  }

  void main_window.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
}

app.whenReady().then(() => {
  register_ipc_router()
  create_main_window()

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
