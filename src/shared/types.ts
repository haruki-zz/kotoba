import { z } from 'zod';

import {
  aiExampleResultSchema,
  aiProviderEnum,
  aiScenarioEnum,
  aiWordEnrichResultSchema,
} from './ai';
import { DEFAULT_INTERVAL_DAYS, DEFAULT_REPETITION, SM2_DEFAULT_EF, SM2_MIN_EF } from './constants';
import {
  APP_SETTINGS_VERSION,
  appSettingsPatchSchema,
  appSettingsSchema,
  bulkImportSchema,
  defaultAppSettings,
  findShortcutConflicts,
  importValidationIssueSchema,
  importValidationRequestSchema,
  importValidationResponseSchema,
  difficultyEnum,
  reviewQueueQuerySchema,
  reviewRequestSchema,
  normalizeShortcutBinding,
  settingsBackupFileSchema,
  settingsDatabaseBackupResponseSchema,
  settingsExportResponseSchema,
  settingsImportRequestSchema,
  settingsMetaSchema,
  settingsResetRequestSchema,
  settingsSnapshotSchema,
  settingsUpdateRequestSchema,
  sourceCreateSchema,
  sourceRecordSchema,
  sourceUpdateSchema,
  statsOverviewSchema,
  shortcutBindingsSchema,
  shortcutConflictSchema,
  tagCreateSchema,
  tagRecordSchema,
  tagUpdateSchema,
  wordCreateSchema,
  wordCreateWithMetaSchema,
  wordListQuerySchema,
  wordListResponseSchema,
  wordDeleteQuerySchema,
  wordExportQuerySchema,
  wordExportResponseSchema,
  wordRecordSchema,
  wordBatchRequestSchema,
  wordBatchResponseSchema,
  wordUpdateSchema,
  wordUpdateWithMetaSchema,
  wordViewSchema,
} from './schemas';
import {
  aiGenerateRequestSchema,
  aiGenerateResponseSchema,
} from './schemas/api/ai';

export type Difficulty = z.infer<typeof difficultyEnum>;
export type WordRecord = z.infer<typeof wordRecordSchema>;
export type WordCreateInput = z.input<typeof wordCreateSchema>;
export type WordUpdateInput = z.input<typeof wordUpdateSchema>;
export type WordCreateWithMetaInput = z.input<typeof wordCreateWithMetaSchema>;
export type WordUpdateWithMetaInput = z.input<typeof wordUpdateWithMetaSchema>;
export type WordView = z.infer<typeof wordViewSchema>;
export type WordListQuery = z.infer<typeof wordListQuerySchema>;
export type WordListResponse = z.infer<typeof wordListResponseSchema>;
export type WordDeleteQuery = z.infer<typeof wordDeleteQuerySchema>;
export type ReviewRequestInput = z.input<typeof reviewRequestSchema>;
export type ReviewQueueQuery = z.infer<typeof reviewQueueQuerySchema>;
export type BulkImportInput = z.input<typeof bulkImportSchema>;
export type WordExportQuery = z.infer<typeof wordExportQuerySchema>;
export type WordExportResponse = z.infer<typeof wordExportResponseSchema>;
export type ImportValidationRequest = z.input<typeof importValidationRequestSchema>;
export type ImportValidationIssue = z.infer<typeof importValidationIssueSchema>;
export type ImportValidationResponse = z.infer<typeof importValidationResponseSchema>;
export type WordBatchRequest = z.input<typeof wordBatchRequestSchema>;
export type WordBatchResponse = z.infer<typeof wordBatchResponseSchema>;
export type StatsOverview = z.infer<typeof statsOverviewSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type AppSettingsPatchInput = z.input<typeof appSettingsPatchSchema>;
export type ShortcutBindings = z.infer<typeof shortcutBindingsSchema>;
export type ShortcutConflict = z.infer<typeof shortcutConflictSchema>;
export type SettingsBackupFile = z.infer<typeof settingsBackupFileSchema>;
export type SettingsSnapshot = z.infer<typeof settingsSnapshotSchema>;
export type SettingsMeta = z.infer<typeof settingsMetaSchema>;
export type SettingsUpdateRequestInput = z.input<typeof settingsUpdateRequestSchema>;
export type SettingsResetRequestInput = z.input<typeof settingsResetRequestSchema>;
export type SettingsImportRequestInput = z.input<typeof settingsImportRequestSchema>;
export type SettingsDatabaseBackupResponse = z.infer<typeof settingsDatabaseBackupResponseSchema>;
export type SettingsExportResponse = z.infer<typeof settingsExportResponseSchema>;

export type TagRecord = z.infer<typeof tagRecordSchema>;
export type TagCreateInput = z.input<typeof tagCreateSchema>;
export type TagUpdateInput = z.input<typeof tagUpdateSchema>;

export type SourceRecord = z.infer<typeof sourceRecordSchema>;
export type SourceCreateInput = z.input<typeof sourceCreateSchema>;
export type SourceUpdateInput = z.input<typeof sourceUpdateSchema>;

export type AiProviderName = z.infer<typeof aiProviderEnum>;
export type AiScenario = z.infer<typeof aiScenarioEnum>;
export type AiGenerateRequest = z.input<typeof aiGenerateRequestSchema>;
export type AiGenerateResponse = z.infer<typeof aiGenerateResponseSchema>;
export type AiWordEnrichResult = z.infer<typeof aiWordEnrichResultSchema>;
export type AiExampleResult = z.infer<typeof aiExampleResultSchema>;

export {
  difficultyEnum,
  sourceCreateSchema,
  sourceRecordSchema,
  sourceUpdateSchema,
  statsOverviewSchema,
  tagCreateSchema,
  tagRecordSchema,
  tagUpdateSchema,
  wordCreateSchema,
  wordCreateWithMetaSchema,
  wordListQuerySchema,
  wordListResponseSchema,
  wordDeleteQuerySchema,
  wordRecordSchema,
  wordUpdateSchema,
  wordUpdateWithMetaSchema,
  wordViewSchema,
  reviewRequestSchema,
  reviewQueueQuerySchema,
  bulkImportSchema,
  appSettingsSchema,
  appSettingsPatchSchema,
  shortcutBindingsSchema,
  shortcutConflictSchema,
  settingsBackupFileSchema,
  settingsSnapshotSchema,
  settingsMetaSchema,
  settingsUpdateRequestSchema,
  settingsResetRequestSchema,
  settingsImportRequestSchema,
  settingsDatabaseBackupResponseSchema,
  settingsExportResponseSchema,
  wordExportQuerySchema,
  wordExportResponseSchema,
  importValidationRequestSchema,
  importValidationIssueSchema,
  importValidationResponseSchema,
  wordBatchRequestSchema,
  wordBatchResponseSchema,
};

export {
  aiProviderEnum,
  aiScenarioEnum,
  aiGenerateRequestSchema,
  aiGenerateResponseSchema,
  aiWordEnrichResultSchema,
  aiExampleResultSchema,
};

export { SM2_DEFAULT_EF, SM2_MIN_EF, DEFAULT_INTERVAL_DAYS, DEFAULT_REPETITION };
export { defaultAppSettings };
export { APP_SETTINGS_VERSION, normalizeShortcutBinding, findShortcutConflicts };
