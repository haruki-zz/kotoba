import { IPC_CHANNELS, IpcChannel, IpcRequestMap } from "../../shared/ipc";
import { buildReviewQueue } from "../../shared/sm2";
import { ActivitySummary, ReviewRating, Word, WordDraft, WordUpdate } from "../../shared/types";
import { ProviderManager } from "./provider";

type Handler<K extends IpcChannel> = (payload: IpcRequestMap[K]["payload"]) => Promise<IpcRequestMap[K]["response"]>;

export type IpcHandlers = { [K in IpcChannel]: Handler<K> };

export interface DataStoreApi {
  loadWords: (now?: number) => Promise<Word[]>;
  loadActivitySummary: (now?: number) => Promise<ActivitySummary>;
  addWord: (draft: WordDraft, now?: number) => Promise<Word>;
  updateWord: (id: string, update: WordUpdate, now?: number) => Promise<Word>;
  deleteWord: (id: string, now?: number) => Promise<void>;
  applyReview: (id: string, grade: ReviewRating, now?: number) => Promise<Word>;
}

export interface IpcContext {
  dataStore: DataStoreApi;
  providerManager: ProviderManager;
  now?: () => number;
}

const requireId = (id: unknown) => {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("id 不能为空");
  }

  return id.trim();
};

const requireGrade = (grade: unknown): ReviewRating => {
  if (typeof grade !== "number" || Number.isNaN(grade)) {
    throw new Error("评分需为数字");
  }

  if (grade < 0 || grade > 5) {
    throw new Error("评分需在 0-5 范围内");
  }

  return grade as ReviewRating;
};

const requireTerm = (term: unknown) => {
  if (typeof term !== "string" || !term.trim()) {
    throw new Error("term 不能为空");
  }

  return term.trim();
};

const requireWordDraft = (draft: unknown): WordDraft => {
  if (typeof draft !== "object" || draft === null) {
    throw new Error("词条数据需为对象");
  }

  return draft as WordDraft;
};

const requireWordUpdate = (update: unknown): WordUpdate => {
  if (typeof update !== "object" || update === null) {
    throw new Error("更新内容需为对象");
  }

  return update as WordUpdate;
};

export const createIpcHandlers = ({ dataStore, providerManager, now }: IpcContext): IpcHandlers => {
  const getNow = () => (now ? now() : Date.now());

  return {
    [IPC_CHANNELS.getProvider]: async () => providerManager.getState(),
    [IPC_CHANNELS.setProvider]: async (payload) => providerManager.setConfig(payload ?? {}),
    [IPC_CHANNELS.generateWordCard]: async (payload) => {
      const provider = providerManager.getProvider();
      return provider.generateWordCard(requireTerm(payload?.term));
    },
    [IPC_CHANNELS.loadWords]: async () => dataStore.loadWords(getNow()),
    [IPC_CHANNELS.addWord]: async (draft) => dataStore.addWord(requireWordDraft(draft), getNow()),
    [IPC_CHANNELS.updateWord]: async (payload) =>
      dataStore.updateWord(requireId(payload?.id), requireWordUpdate(payload?.update ?? {}), getNow()),
    [IPC_CHANNELS.deleteWord]: async (payload) => dataStore.deleteWord(requireId(payload?.id), getNow()),
    [IPC_CHANNELS.loadReviewQueue]: async () => {
      const words = await dataStore.loadWords(getNow());
      return buildReviewQueue(words, getNow());
    },
    [IPC_CHANNELS.submitReview]: async (payload) =>
      dataStore.applyReview(requireId(payload?.id), requireGrade(payload?.grade), getNow()),
    [IPC_CHANNELS.loadActivitySummary]: async () => dataStore.loadActivitySummary(getNow()),
    [IPC_CHANNELS.exportData]: async () => {
      throw new Error("导出功能尚未实现");
    },
    [IPC_CHANNELS.importData]: async () => {
      throw new Error("导入功能尚未实现");
    },
  };
};
