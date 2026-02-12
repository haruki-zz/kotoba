import {
  SettingsDatabaseBackupResponse,
  SettingsExportResponse,
  SettingsImportRequestInput,
  SettingsSnapshot,
  SettingsUpdateRequestInput,
} from '@shared/types';

import { apiFetch } from './client';

export function fetchSettingsSnapshot() {
  return apiFetch<SettingsSnapshot>('/settings');
}

export function updateSettings(input: SettingsUpdateRequestInput) {
  return apiFetch<SettingsSnapshot>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function resetSettings() {
  return apiFetch<SettingsSnapshot>('/settings/reset', {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  });
}

export function exportSettings() {
  return apiFetch<SettingsExportResponse>('/settings/export');
}

export function importSettings(input: SettingsImportRequestInput) {
  return apiFetch<SettingsSnapshot>('/settings/import', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function backupDatabase() {
  return apiFetch<SettingsDatabaseBackupResponse>('/settings/backup', {
    method: 'POST',
  });
}
