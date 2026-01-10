import { applyReviewResult } from "../../shared/sm2";
import { ActivityData, ReviewRating, Word, WordsFile } from "../../shared/types";
import { normalizeActivityData, normalizeWordsFile } from "../../shared/validation";
import { summarizeActivity, recordAddedWord, recordReviewedWord, formatDateKey } from "./activity";
import { writeJsonAtomic, readJsonFile } from "./json";
import { getActivityPath, getWordsPath, defaultDataDir } from "./paths";
import { ActivitySummary, WordDraft, WordUpdate } from "./types";
import { buildWordFromDraft, mergeWordUpdate } from "./words";

class DataStore {
  constructor(private readonly baseDir: string = defaultDataDir) {}

  private get wordsPath() {
    return getWordsPath(this.baseDir);
  }

  private get activityPath() {
    return getActivityPath(this.baseDir);
  }

  private async readWordsFile(now = Date.now()): Promise<WordsFile> {
    const raw = await readJsonFile<WordsFile>(this.wordsPath);
    return normalizeWordsFile(raw ?? { words: [] }, now);
  }

  private async writeWordsFile(words: WordsFile, now = Date.now()) {
    const normalized = normalizeWordsFile(words, now);
    await writeJsonAtomic(this.wordsPath, normalized);
  }

  private async readActivityData(): Promise<ActivityData> {
    const raw = await readJsonFile<ActivityData>(this.activityPath);
    return normalizeActivityData(raw ?? { days: {} });
  }

  private async writeActivityData(activity: ActivityData) {
    const normalized = normalizeActivityData(activity);
    await writeJsonAtomic(this.activityPath, normalized);
  }

  async loadWords(now = Date.now()): Promise<Word[]> {
    const file = await this.readWordsFile(now);
    return file.words;
  }

  async loadActivitySummary(now = Date.now()): Promise<ActivitySummary> {
    const activity = await this.readActivityData();
    return summarizeActivity(activity, now);
  }

  async addWord(draft: WordDraft, now = Date.now()): Promise<Word> {
    const wordsFile = await this.readWordsFile(now);
    const word = buildWordFromDraft(draft, now);
    const updatedWords = [...wordsFile.words, word];

    await this.writeWordsFile({ words: updatedWords }, now);
    await this.appendActivity(recordAddedWord, now);

    return word;
  }

  async updateWord(id: string, update: WordUpdate, now = Date.now()): Promise<Word> {
    const wordsFile = await this.readWordsFile(now);
    const index = wordsFile.words.findIndex((entry) => entry.id === id);

    if (index === -1) {
      throw new Error(`未找到指定词条：${id}`);
    }

    const word = mergeWordUpdate(wordsFile.words[index], update, now);
    const updatedWords = [...wordsFile.words];
    updatedWords[index] = word;

    await this.writeWordsFile({ words: updatedWords }, now);
    return word;
  }

  async deleteWord(id: string, now = Date.now()) {
    const wordsFile = await this.readWordsFile(now);
    const filtered = wordsFile.words.filter((word) => word.id !== id);

    if (filtered.length === wordsFile.words.length) {
      throw new Error(`未找到指定词条：${id}`);
    }

    await this.writeWordsFile({ words: filtered }, now);
  }

  async applyReview(id: string, grade: ReviewRating, now = Date.now()): Promise<Word> {
    const wordsFile = await this.readWordsFile(now);
    const index = wordsFile.words.findIndex((entry) => entry.id === id);

    if (index === -1) {
      throw new Error(`未找到指定词条：${id}`);
    }

    const word = applyReviewResult(wordsFile.words[index], grade, now);
    const updatedWords = [...wordsFile.words];
    updatedWords[index] = word;

    await this.writeWordsFile({ words: updatedWords }, now);
    await this.appendActivity(recordReviewedWord, now);

    return word;
  }

  private async appendActivity(update: (activity: ActivityData, date: string) => ActivityData, now: number) {
    const activity = await this.readActivityData();
    const updated = update(activity, formatDateKey(now));
    await this.writeActivityData(updated);
  }
}

export const createDataStore = (baseDir = defaultDataDir) => new DataStore(baseDir);

export { defaultDataDir } from "./paths";
export type { ActivitySummary, WordDraft, WordUpdate } from "./types";
