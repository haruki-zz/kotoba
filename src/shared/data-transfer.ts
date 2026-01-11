export interface ExportRequest {
  wordsPath?: string;
  activityPath?: string;
  csvPath?: string;
}

export interface ExportResult {
  wordsCount: number;
  activityDaysCount: number;
  csvCount?: number;
}

export interface ImportRequest {
  wordsPath?: string;
  activityPath?: string;
}

export interface ImportResult {
  importedWords: number;
  replacedWords: number;
  skippedWords: number;
  activityDaysImported: number;
  errors: string[];
}
