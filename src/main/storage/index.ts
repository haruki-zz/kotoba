import { applyReviewResult } from "../../shared/sm2";
import { ActivityData, ReviewRating, Word, WordsFile } from "../../shared/types";
import { normalizeActivityData, normalizeWordsFile } from "../../shared/validation";
import { ExportRequest, ExportResult, ImportRequest, ImportResult } from "../../shared/data-transfer";
import { summarizeActivity, recordAddedWord, recordReviewedWord, formatDateKey } from "./activity";
import { writeJsonAtomic, readJsonFile } from "./json";
import { getActivityPath, getWordsPath, defaultDataDir } from "./paths";
import { ActivitySummary, WordDraft, WordUpdate } from "./types";
import { loadActivityFromFile, loadWordsFromFile, mergeActivity, mergeWordsByTerm, writeWordsCsv } from "./transfer";
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

  async exportData(request: ExportRequest, now = Date.now()): Promise<ExportResult> {
    const wordsFile = await this.readWordsFile(now);
    const activity = await this.readActivityData();
    const shouldExportWords = Boolean(request.wordsPath || request.csvPath);
    const shouldExportActivity = Boolean(request.activityPath);
    const result: ExportResult = {
      wordsCount: shouldExportWords ? wordsFile.words.length : 0,
      activityDaysCount: shouldExportActivity ? Object.keys(activity.days).length : 0,
    };

    if (request.wordsPath) {
      await writeJsonAtomic(request.wordsPath, wordsFile);
    }

    if (request.activityPath) {
      await writeJsonAtomic(request.activityPath, activity);
    }

    if (request.csvPath) {
      await writeWordsCsv(request.csvPath, wordsFile.words);
      result.csvCount = wordsFile.words.length;
    }

    return result;
  }

  async importData(request: ImportRequest, now = Date.now()): Promise<ImportResult> {
    const errors: string[] = [];
    let importedWords = 0;
    let replacedWords = 0;
    let skippedWords = 0;
    let activityDaysImported = 0;

    let wordsFile = await this.readWordsFile(now);
    let activity = await this.readActivityData();

    if (request.wordsPath) {
      const { words, errors: wordErrors } = await loadWordsFromFile(request.wordsPath, now);
      errors.push(...wordErrors);
      skippedWords = wordErrors.length;
      const merged = mergeWordsByTerm(wordsFile.words, words);
      importedWords = merged.added + merged.replaced;
      replacedWords = merged.replaced;
      wordsFile = { words: merged.words };
    }

    if (request.activityPath) {
      const { activity: incoming, errors: activityErrors } = await loadActivityFromFile(request.activityPath);
      errors.push(...activityErrors);
      activityDaysImported = Object.keys(incoming.days).length;
      activity = mergeActivity(activity, incoming);
    }

    if (request.wordsPath) {
      await this.writeWordsFile(wordsFile, now);
    }

    if (request.activityPath) {
      await this.writeActivityData(activity);
    }

    return {
      importedWords,
      replacedWords,
      skippedWords,
      activityDaysImported,
      errors,
    };
  }
}

export const createDataStore = (baseDir = defaultDataDir) => new DataStore(baseDir);

export { defaultDataDir } from "./paths";
export type { ActivitySummary, WordDraft, WordUpdate } from "./types";
