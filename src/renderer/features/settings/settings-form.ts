import { AppSettings, AppSettingsPatchInput } from '@shared/types';

export const settingsToPatch = (settings: AppSettings): AppSettingsPatchInput => ({
  appearance: { ...settings.appearance },
  review: { ...settings.review },
  contentStyle: { ...settings.contentStyle },
  ai: { ...settings.ai },
  notifications: { ...settings.notifications },
  privacy: { ...settings.privacy },
  shortcuts: { ...settings.shortcuts },
});

const diffSection = <T extends Record<string, unknown>>(current: T, next: T) => {
  const entries = Object.entries(next).filter(([key, value]) => current[key] !== value);
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
};

export const buildPatchFromDiff = (
  current: AppSettings,
  next: AppSettings
): AppSettingsPatchInput => ({
  appearance: diffSection(current.appearance, next.appearance),
  review: diffSection(current.review, next.review),
  contentStyle: diffSection(current.contentStyle, next.contentStyle),
  ai: diffSection(current.ai, next.ai),
  notifications: diffSection(current.notifications, next.notifications),
  privacy: diffSection(current.privacy, next.privacy),
  shortcuts: diffSection(current.shortcuts, next.shortcuts),
});

export const hasSensitivePatchChanges = (patch: AppSettingsPatchInput) =>
  Boolean(
    patch.privacy &&
      (patch.privacy.allowNetwork !== undefined ||
        patch.privacy.telemetryEnabled !== undefined ||
        patch.privacy.aiRequestLogging !== undefined)
  );

export const downloadJsonFile = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const readTextFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
