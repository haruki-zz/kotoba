"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  generateWordCard: "ai:generate-word-card",
  setProvider: "ai:set-provider",
  getProvider: "ai:get-provider",
  loadWords: "words:load",
  addWord: "words:add",
  updateWord: "words:update",
  deleteWord: "words:delete",
  loadReviewQueue: "review:queue",
  submitReview: "review:submit",
  loadActivitySummary: "activity:summary",
  exportData: "data:export",
  importData: "data:import"
};
const invoke = (channel, payload) => electron.ipcRenderer.invoke(channel, payload);
const api = {
  generateWordCard: (payload) => invoke(IPC_CHANNELS.generateWordCard, payload),
  setProvider: (payload) => invoke(IPC_CHANNELS.setProvider, payload),
  getProvider: () => invoke(IPC_CHANNELS.getProvider, void 0),
  loadWords: () => invoke(IPC_CHANNELS.loadWords, void 0),
  addWord: (payload) => invoke(IPC_CHANNELS.addWord, payload),
  updateWord: (payload) => invoke(IPC_CHANNELS.updateWord, payload),
  deleteWord: (payload) => invoke(IPC_CHANNELS.deleteWord, payload),
  loadReviewQueue: () => invoke(IPC_CHANNELS.loadReviewQueue, void 0),
  submitReview: (payload) => invoke(IPC_CHANNELS.submitReview, payload),
  loadActivitySummary: () => invoke(IPC_CHANNELS.loadActivitySummary, void 0),
  exportData: () => invoke(IPC_CHANNELS.exportData, void 0),
  importData: (payload) => invoke(IPC_CHANNELS.importData, payload)
};
electron.contextBridge.exposeInMainWorld("electronAPI", api);
//# sourceMappingURL=index.cjs.map
