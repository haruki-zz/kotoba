import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerIpcHandlers } from "./ipc";
import { createProviderManager } from "./ipc/provider";
import type { ProviderManager } from "./ipc/provider";
import { createDataStore } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
const dataStore = createDataStore();
let providerManager!: ProviderManager;
let unregisterIpc: (() => void) | undefined;

const createMainWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(__dirname, "../../dist/renderer/index.html");
    await mainWindow.loadFile(rendererPath);
  }
};

app.whenReady().then(async () => {
  providerManager = await createProviderManager();
  unregisterIpc = registerIpcHandlers({ dataStore, providerManager });
  await createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  unregisterIpc?.();
});
