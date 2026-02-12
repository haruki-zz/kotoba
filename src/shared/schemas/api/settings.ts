import { z } from 'zod';

import {
  appSettingsPatchSchema,
  appSettingsSchema,
  settingsBackupFileSchema,
  shortcutConflictSchema,
} from '../settings';

import { isoDateTimeSchema } from './common';

export const settingsMetaSchema = z.object({
  version: z.number().int().positive(),
  storageKey: z.string().min(1),
  databasePath: z.string().min(1),
  backupDirectory: z.string().min(1),
  runtimeOverrides: z.array(z.string()),
  shortcutConflicts: z.array(shortcutConflictSchema),
});

export const settingsSnapshotSchema = z.object({
  settings: appSettingsSchema,
  meta: settingsMetaSchema,
});

export const settingsUpdateRequestSchema = z.object({
  patch: appSettingsPatchSchema,
  confirmSensitive: z.boolean().default(false),
});

export const settingsResetRequestSchema = z.object({
  confirm: z.literal(true),
});

export const settingsImportRequestSchema = z.object({
  backup: settingsBackupFileSchema,
  confirmOverwrite: z.literal(true),
});

export const settingsDatabaseBackupResponseSchema = z.object({
  backupPath: z.string().min(1),
  createdAt: isoDateTimeSchema,
});

export const settingsExportResponseSchema = settingsBackupFileSchema;
