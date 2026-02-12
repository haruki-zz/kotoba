import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  appSettingsPatchSchema,
  appSettingsSchema,
  APP_SETTINGS_VERSION,
  AppSettingsPatchInput,
  AppSettings,
  defaultAppSettings,
  findShortcutConflicts,
  normalizeShortcutBinding,
  SettingsDatabaseBackupResponse,
  SettingsExportResponse,
  SettingsSnapshot,
  settingsBackupFileSchema,
} from '@shared/types';

import { DatabaseClient } from '../db/connection';
import { AppMetaRepository } from '../db/repositories/app-meta-repository';
import { nowIso } from '../db/time';

const SETTINGS_STORAGE_KEY = `settings.user.v${APP_SETTINGS_VERSION}`;

type RuntimeOverrideState = {
  patch: AppSettingsPatchInput;
  keys: string[];
};

const isTrue = (value: string | undefined) => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const mergePatch = (base: AppSettingsPatchInput, patch: AppSettingsPatchInput): AppSettingsPatchInput => ({
  ...base,
  ...patch,
  appearance: { ...base.appearance, ...patch.appearance },
  review: { ...base.review, ...patch.review },
  contentStyle: { ...base.contentStyle, ...patch.contentStyle },
  ai: { ...base.ai, ...patch.ai },
  notifications: { ...base.notifications, ...patch.notifications },
  privacy: { ...base.privacy, ...patch.privacy },
  shortcuts: { ...base.shortcuts, ...patch.shortcuts },
});

const normalizePatch = (patch: AppSettingsPatchInput): AppSettingsPatchInput => {
  if (!patch.shortcuts) return patch;

  const normalizedShortcuts = Object.entries(patch.shortcuts).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (typeof value !== 'string') return acc;
      const normalized = normalizeShortcutBinding(value);
      acc[key] = normalized || value;
      return acc;
    },
    {}
  );

  return {
    ...patch,
    shortcuts: normalizedShortcuts,
  };
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(',')}}`;
};

const checksumForPatch = (patch: AppSettingsPatchInput) =>
  crypto.createHash('sha256').update(stableStringify(patch)).digest('hex');

export class SettingsService {
  private runtimeOverrides: RuntimeOverrideState;

  constructor(
    private db: DatabaseClient,
    private appMetaRepo: AppMetaRepository,
    private databasePath: string
  ) {
    this.runtimeOverrides = this.resolveRuntimeOverrides();
  }

  private get backupDirectory() {
    return this.databasePath === ':memory:'
      ? path.join(process.cwd(), 'data', 'backups')
      : path.join(path.dirname(this.databasePath), 'backups');
  }

  private resolveRuntimeOverrides(): RuntimeOverrideState {
    const patch: AppSettingsPatchInput = {};
    const keys: string[] = [];

    const forceTheme = process.env.KOTOBA_FORCE_THEME;
    if (forceTheme && ['system', 'light', 'dark'].includes(forceTheme)) {
      patch.appearance = { ...(patch.appearance ?? {}), themeMode: forceTheme as 'system' | 'light' | 'dark' };
      keys.push('KOTOBA_FORCE_THEME');
    }

    const forceLanguage = process.env.KOTOBA_FORCE_LANGUAGE;
    if (forceLanguage && ['zh-CN', 'en-US', 'ja-JP'].includes(forceLanguage)) {
      patch.appearance = {
        ...(patch.appearance ?? {}),
        language: forceLanguage as 'zh-CN' | 'en-US' | 'ja-JP',
      };
      keys.push('KOTOBA_FORCE_LANGUAGE');
    }

    const forceProvider = process.env.KOTOBA_FORCE_AI_PROVIDER;
    if (forceProvider && ['mock', 'openai', 'gemini'].includes(forceProvider)) {
      patch.ai = {
        ...(patch.ai ?? {}),
        defaultProvider: forceProvider as 'mock' | 'openai' | 'gemini',
      };
      keys.push('KOTOBA_FORCE_AI_PROVIDER');
    }

    const forceQueue = process.env.KOTOBA_FORCE_REVIEW_LIMIT;
    if (forceQueue) {
      const parsed = Number(forceQueue);
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 100) {
        patch.review = {
          ...(patch.review ?? {}),
          queueLimit: parsed,
        };
        keys.push('KOTOBA_FORCE_REVIEW_LIMIT');
      }
    }

    if (isTrue(process.env.KOTOBA_DISABLE_NETWORK)) {
      patch.privacy = {
        ...(patch.privacy ?? {}),
        allowNetwork: false,
      };
      keys.push('KOTOBA_DISABLE_NETWORK');
    }

    return {
      patch,
      keys,
    };
  }

  private resolveSettingsFromPatch(userPatch: AppSettingsPatchInput): AppSettings {
    return appSettingsSchema.parse({
      version: APP_SETTINGS_VERSION,
      appearance: {
        ...defaultAppSettings.appearance,
        ...(userPatch.appearance ?? {}),
        ...(this.runtimeOverrides.patch.appearance ?? {}),
      },
      review: {
        ...defaultAppSettings.review,
        ...(userPatch.review ?? {}),
        ...(this.runtimeOverrides.patch.review ?? {}),
      },
      contentStyle: {
        ...defaultAppSettings.contentStyle,
        ...(userPatch.contentStyle ?? {}),
        ...(this.runtimeOverrides.patch.contentStyle ?? {}),
      },
      ai: {
        ...defaultAppSettings.ai,
        ...(userPatch.ai ?? {}),
        ...(this.runtimeOverrides.patch.ai ?? {}),
      },
      notifications: {
        ...defaultAppSettings.notifications,
        ...(userPatch.notifications ?? {}),
        ...(this.runtimeOverrides.patch.notifications ?? {}),
      },
      privacy: {
        ...defaultAppSettings.privacy,
        ...(userPatch.privacy ?? {}),
        ...(this.runtimeOverrides.patch.privacy ?? {}),
      },
      shortcuts: {
        ...defaultAppSettings.shortcuts,
        ...(userPatch.shortcuts ?? {}),
        ...(this.runtimeOverrides.patch.shortcuts ?? {}),
      },
    });
  }

  private readUserPatch(): AppSettingsPatchInput {
    const raw = this.appMetaRepo.get(SETTINGS_STORAGE_KEY);
    if (!raw) return {};

    try {
      const parsedRaw = JSON.parse(raw) as unknown;

      const patchParsed = appSettingsPatchSchema.safeParse(parsedRaw);
      if (patchParsed.success) {
        return normalizePatch(patchParsed.data);
      }

      const fullParsed = appSettingsSchema.safeParse(parsedRaw);
      if (fullParsed.success) {
        const { version: _version, ...withoutVersion } = fullParsed.data;
        return normalizePatch(withoutVersion);
      }

      return {};
    } catch {
      return {};
    }
  }

  private saveUserPatch(patch: AppSettingsPatchInput) {
    const validated = appSettingsPatchSchema.parse(normalizePatch(patch));
    this.appMetaRepo.set(SETTINGS_STORAGE_KEY, JSON.stringify(validated));
  }

  getSnapshot(): SettingsSnapshot {
    const userPatch = this.readUserPatch();
    const settings = this.resolveSettingsFromPatch(userPatch);

    return {
      settings,
      meta: {
        version: APP_SETTINGS_VERSION,
        storageKey: SETTINGS_STORAGE_KEY,
        databasePath: this.databasePath,
        backupDirectory: this.backupDirectory,
        runtimeOverrides: this.runtimeOverrides.keys,
        shortcutConflicts: findShortcutConflicts(settings.shortcuts),
      },
    };
  }

  update(patch: AppSettingsPatchInput): SettingsSnapshot {
    const parsedPatch = normalizePatch(appSettingsPatchSchema.parse(patch));
    const currentPatch = this.readUserPatch();
    const nextPatch = mergePatch(currentPatch, parsedPatch);

    this.saveUserPatch(nextPatch);
    return this.getSnapshot();
  }

  reset(): SettingsSnapshot {
    this.appMetaRepo.delete(SETTINGS_STORAGE_KEY);
    return this.getSnapshot();
  }

  exportSettings(): SettingsExportResponse {
    const userSettings = this.readUserPatch();
    return settingsBackupFileSchema.parse({
      version: APP_SETTINGS_VERSION,
      exportedAt: nowIso(),
      userSettings,
      checksum: checksumForPatch(userSettings),
    });
  }

  importSettings(backup: unknown): SettingsSnapshot {
    const parsedBackup = settingsBackupFileSchema.parse(backup);
    const expectedChecksum = checksumForPatch(parsedBackup.userSettings);
    if (parsedBackup.checksum !== expectedChecksum) {
      throw new Error('Settings backup checksum mismatch');
    }

    this.saveUserPatch(parsedBackup.userSettings);
    return this.getSnapshot();
  }

  async backupDatabase(): Promise<SettingsDatabaseBackupResponse> {
    if (this.databasePath === ':memory:') {
      throw new Error('Cannot back up in-memory database');
    }

    fs.mkdirSync(this.backupDirectory, { recursive: true });
    const timestamp = nowIso().replace(/[:]/g, '-');
    const backupPath = path.join(this.backupDirectory, `kotoba-${timestamp}.sqlite`);

    await this.db.backup(backupPath);

    const createdAt = nowIso();
    this.appMetaRepo.set('database.last_backup_at', createdAt);
    this.appMetaRepo.set('database.last_backup_path', backupPath);

    return {
      backupPath,
      createdAt,
    };
  }
}
