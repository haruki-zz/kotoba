import { ProviderSettings, ProviderState, WordCardContent } from "./ai";
import { ActivitySummary, ReviewRating, Word, WordDraft, WordUpdate } from "./types";

export const IPC_CHANNELS = {
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
  importData: "data:import",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface IpcRequestMap {
  [IPC_CHANNELS.generateWordCard]: { payload: { term: string }; response: WordCardContent };
  [IPC_CHANNELS.setProvider]: { payload: ProviderSettings; response: ProviderState };
  [IPC_CHANNELS.getProvider]: { payload: void; response: ProviderState };
  [IPC_CHANNELS.loadWords]: { payload: void; response: Word[] };
  [IPC_CHANNELS.addWord]: { payload: WordDraft; response: Word };
  [IPC_CHANNELS.updateWord]: { payload: { id: string; update: WordUpdate }; response: Word };
  [IPC_CHANNELS.deleteWord]: { payload: { id: string }; response: void };
  [IPC_CHANNELS.loadReviewQueue]: { payload: void; response: Word[] };
  [IPC_CHANNELS.submitReview]: { payload: { id: string; grade: ReviewRating }; response: Word };
  [IPC_CHANNELS.loadActivitySummary]: { payload: void; response: ActivitySummary };
  [IPC_CHANNELS.exportData]: { payload: void; response: never };
  [IPC_CHANNELS.importData]: { payload: unknown; response: never };
}

type AsyncResult<K extends IpcChannel> = Promise<IpcRequestMap[K]["response"]>;

type HandlerFor<K extends IpcChannel> = IpcRequestMap[K]["payload"] extends void
  ? () => AsyncResult<K>
  : (payload: IpcRequestMap[K]["payload"]) => AsyncResult<K>;

export interface RendererApi {
  generateWordCard: HandlerFor<typeof IPC_CHANNELS.generateWordCard>;
  setProvider: HandlerFor<typeof IPC_CHANNELS.setProvider>;
  getProvider: HandlerFor<typeof IPC_CHANNELS.getProvider>;
  loadWords: HandlerFor<typeof IPC_CHANNELS.loadWords>;
  addWord: HandlerFor<typeof IPC_CHANNELS.addWord>;
  updateWord: HandlerFor<typeof IPC_CHANNELS.updateWord>;
  deleteWord: HandlerFor<typeof IPC_CHANNELS.deleteWord>;
  loadReviewQueue: HandlerFor<typeof IPC_CHANNELS.loadReviewQueue>;
  submitReview: HandlerFor<typeof IPC_CHANNELS.submitReview>;
  loadActivitySummary: HandlerFor<typeof IPC_CHANNELS.loadActivitySummary>;
  exportData: HandlerFor<typeof IPC_CHANNELS.exportData>;
  importData: HandlerFor<typeof IPC_CHANNELS.importData>;
}
