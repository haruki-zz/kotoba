import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS, IpcChannel, IpcRequestMap, RendererApi } from "../shared/ipc";

const invoke = <K extends IpcChannel>(
  channel: K,
  payload: IpcRequestMap[K]["payload"],
): Promise<IpcRequestMap[K]["response"]> => ipcRenderer.invoke(channel, payload);

const api: RendererApi = {
  generateWordCard: (payload) => invoke(IPC_CHANNELS.generateWordCard, payload),
  setProvider: (payload) => invoke(IPC_CHANNELS.setProvider, payload),
  getProvider: () => invoke(IPC_CHANNELS.getProvider, undefined),
  loadWords: () => invoke(IPC_CHANNELS.loadWords, undefined),
  addWord: (payload) => invoke(IPC_CHANNELS.addWord, payload),
  updateWord: (payload) => invoke(IPC_CHANNELS.updateWord, payload),
  deleteWord: (payload) => invoke(IPC_CHANNELS.deleteWord, payload),
  loadReviewQueue: () => invoke(IPC_CHANNELS.loadReviewQueue, undefined),
  submitReview: (payload) => invoke(IPC_CHANNELS.submitReview, payload),
  loadActivitySummary: () => invoke(IPC_CHANNELS.loadActivitySummary, undefined),
  exportData: () => invoke(IPC_CHANNELS.exportData, undefined),
  importData: (payload) => invoke(IPC_CHANNELS.importData, payload),
};

contextBridge.exposeInMainWorld("electronAPI", api);
