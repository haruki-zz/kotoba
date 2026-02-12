import { useMutation, useQuery } from '@tanstack/react-query';
import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';

import {
  AppSettings,
  SettingsBackupFile,
  defaultAppSettings,
  findShortcutConflicts,
} from '@shared/types';

import {
  backupDatabase,
  exportSettings,
  fetchSettingsSnapshot,
  importSettings,
  resetSettings,
  updateSettings,
} from '../api/settings';
import {
  buildPatchFromDiff,
  downloadJsonFile,
  hasSensitivePatchChanges,
  readTextFile,
} from '../features/settings/settings-form';
import { formatShortcutLabel } from '../features/settings/shortcut-utils';
import { useSettingsStore } from '../stores/settings-store';

const shortcutLabels: Record<keyof AppSettings['shortcuts'], string> = {
  scoreHard: 'Hard 评分',
  scoreMedium: 'Medium 评分',
  scoreEasy: 'Easy 评分',
  skipCard: '跳过卡片',
  toggleDetails: '展开释义',
  undoReview: '回退上一条',
};

function SettingsPage() {
  const { settings, meta, applySnapshot, clearCache } = useSettingsStore();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useQuery({
    queryKey: ['settings', 'snapshot'],
    queryFn: fetchSettingsSnapshot,
    refetchOnWindowFocus: false,
    onSuccess: (snapshot) => {
      applySnapshot(snapshot);
      setDraft(snapshot.settings);
      setError(null);
    },
  });

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const conflicts = useMemo(() => findShortcutConflicts(draft.shortcuts), [draft.shortcuts]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (snapshot) => {
      applySnapshot(snapshot);
      setDraft(snapshot.settings);
      setStatus('设置已保存并生效');
      setError(null);
    },
    onError: (err: unknown) => {
      setError((err as Error).message);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetSettings,
    onSuccess: (snapshot) => {
      clearCache();
      applySnapshot(snapshot);
      setDraft(snapshot.settings);
      setStatus('已恢复默认设置');
      setError(null);
    },
    onError: (err: unknown) => {
      setError((err as Error).message);
    },
  });

  const importMutation = useMutation({
    mutationFn: importSettings,
    onSuccess: (snapshot) => {
      applySnapshot(snapshot);
      setDraft(snapshot.settings);
      setStatus('设置已导入');
      setError(null);
    },
    onError: (err: unknown) => {
      setError((err as Error).message);
    },
  });

  const backupMutation = useMutation({
    mutationFn: backupDatabase,
    onSuccess: (result) => {
      setStatus(`数据库备份完成：${result.backupPath}`);
      setError(null);
    },
    onError: (err: unknown) => {
      setError((err as Error).message);
    },
  });

  const setShortcut = (key: keyof AppSettings['shortcuts'], value: string) => {
    setDraft((prev) => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    const patch = buildPatchFromDiff(settings, draft);
    const isEmptyPatch = Object.values(patch).every((value) => value === undefined);
    if (isEmptyPatch) {
      setStatus('没有检测到变更');
      return;
    }

    const requiresConfirm = hasSensitivePatchChanges(patch);
    if (
      requiresConfirm &&
      !window.confirm('你正在修改隐私相关设置。确认继续并立即生效？')
    ) {
      return;
    }

    updateMutation.mutate({
      patch,
      confirmSensitive: requiresConfirm,
    });
  };

  const handleReset = () => {
    const confirmed = window.confirm('确认重置所有设置为默认值？此操作不可撤销。');
    if (!confirmed) return;
    resetMutation.mutate();
  };

  const handleExport = async () => {
    try {
      const payload = await exportSettings();
      const filename = `kotoba-settings-${new Date().toISOString().replace(/[:]/g, '-')}.json`;
      downloadJsonFile(filename, payload);
      setStatus('设置备份文件已导出');
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!window.confirm('导入会覆盖当前用户设置。确认继续？')) {
      return;
    }

    try {
      const text = await readTextFile(file);
      const parsed = JSON.parse(text) as SettingsBackupFile;
      importMutation.mutate({
        backup: parsed,
        confirmOverwrite: true,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="page-grid">
      <section className="card hero">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>设置与偏好</h1>
          <p className="lede">主题、复习队列、快捷键、隐私与备份恢复统一配置。</p>
        </div>
        <div className="hero-note">
          <p className="muted">冲突快捷键会在下方提示，但允许先保存。</p>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={handleSave} disabled={updateMutation.isPending}>
              保存设置
            </button>
            <button type="button" className="btn ghost" onClick={handleReset} disabled={resetMutation.isPending}>
              恢复默认
            </button>
          </div>
        </div>
      </section>

      {status ? <p className="muted">{status}</p> : null}
      {error ? <p className="error-box">{error}</p> : null}

      <section className="card settings-grid">
        <h2>基础偏好</h2>
        <div className="settings-row">
          <label className="label">主题</label>
          <select
            value={draft.appearance.themeMode}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                appearance: {
                  ...prev.appearance,
                  themeMode: event.target.value as AppSettings['appearance']['themeMode'],
                },
              }))
            }
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>

        <div className="settings-row">
          <label className="label">语言</label>
          <select
            value={draft.appearance.language}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                appearance: {
                  ...prev.appearance,
                  language: event.target.value as AppSettings['appearance']['language'],
                },
              }))
            }
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </div>

        <div className="settings-row">
          <label className="label">复习队列默认数量</label>
          <input
            type="number"
            aria-label="复习队列默认数量"
            min={1}
            max={100}
            value={draft.review.queueLimit}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                review: {
                  ...prev.review,
                  queueLimit: Number(event.target.value || 1),
                },
              }))
            }
          />
        </div>

        <div className="settings-row">
          <label className="label">默认 AI Provider</label>
          <select
            value={draft.ai.defaultProvider}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                ai: {
                  ...prev.ai,
                  defaultProvider: event.target.value as AppSettings['ai']['defaultProvider'],
                },
              }))
            }
          >
            <option value="mock">Mock</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
      </section>

      <section className="card settings-grid">
        <h2>内容风格</h2>
        <div className="settings-row">
          <label className="label">风格</label>
          <select
            value={draft.contentStyle.tone}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                contentStyle: {
                  ...prev.contentStyle,
                  tone: event.target.value as AppSettings['contentStyle']['tone'],
                },
              }))
            }
          >
            <option value="casual">生活口语</option>
            <option value="concise">精炼</option>
            <option value="tutor">讲解型</option>
          </select>
        </div>

        <div className="settings-row settings-inline-grid">
          <label className="label">例句长度（字符）</label>
          <div className="settings-inline-inputs">
            <input
              type="number"
              min={5}
              max={80}
              value={draft.contentStyle.exampleLengthMin}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  contentStyle: {
                    ...prev.contentStyle,
                    exampleLengthMin: Number(event.target.value || 5),
                  },
                }))
              }
            />
            <span>到</span>
            <input
              type="number"
              min={5}
              max={80}
              value={draft.contentStyle.exampleLengthMax}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  contentStyle: {
                    ...prev.contentStyle,
                    exampleLengthMax: Number(event.target.value || 5),
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="settings-row settings-inline-grid">
          <label className="label">场景描述长度（字符）</label>
          <div className="settings-inline-inputs">
            <input
              type="number"
              min={10}
              max={120}
              value={draft.contentStyle.sceneLengthMin}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  contentStyle: {
                    ...prev.contentStyle,
                    sceneLengthMin: Number(event.target.value || 10),
                  },
                }))
              }
            />
            <span>到</span>
            <input
              type="number"
              min={10}
              max={120}
              value={draft.contentStyle.sceneLengthMax}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  contentStyle: {
                    ...prev.contentStyle,
                    sceneLengthMax: Number(event.target.value || 10),
                  },
                }))
              }
            />
          </div>
        </div>
      </section>

      <section className="card settings-grid">
        <h2>快捷键</h2>
        <div className="settings-shortcut-list">
          {(Object.keys(draft.shortcuts) as Array<keyof AppSettings['shortcuts']>).map((shortcutKey) => (
            <label key={shortcutKey} className="settings-row">
              <span className="label">{shortcutLabels[shortcutKey]}</span>
              <input
                value={draft.shortcuts[shortcutKey]}
                onChange={(event) => setShortcut(shortcutKey, event.target.value)}
              />
              <span className="muted">预览：{formatShortcutLabel(draft.shortcuts[shortcutKey])}</span>
            </label>
          ))}
        </div>
        {conflicts.length > 0 ? (
          <div className="error-box">
            <p>检测到快捷键冲突：</p>
            <ul>
              {conflicts.map((conflict) => (
                <li key={conflict.binding}>
                  {formatShortcutLabel(conflict.binding)}：{conflict.actions.join(' / ')}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="muted">当前无冲突。</p>
        )}

        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              shortcuts: defaultAppSettings.shortcuts,
            }))
          }
        >
          恢复默认快捷键
        </button>
      </section>

      <section className="card settings-grid">
        <h2>隐私与权限</h2>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={draft.privacy.allowNetwork}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                privacy: {
                  ...prev.privacy,
                  allowNetwork: event.target.checked,
                },
              }))
            }
          />
          允许网络访问（AI provider 需要）
        </label>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={draft.privacy.aiRequestLogging}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                privacy: {
                  ...prev.privacy,
                  aiRequestLogging: event.target.checked,
                },
              }))
            }
          />
          记录 AI 请求日志
        </label>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={draft.privacy.telemetryEnabled}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                privacy: {
                  ...prev.privacy,
                  telemetryEnabled: event.target.checked,
                },
              }))
            }
          />
          允许匿名使用统计
        </label>
        <div className="settings-row">
          <label className="label">日志级别</label>
          <select
            value={draft.privacy.logLevel}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                privacy: {
                  ...prev.privacy,
                  logLevel: event.target.value as AppSettings['privacy']['logLevel'],
                },
              }))
            }
          >
            <option value="error">error</option>
            <option value="warn">warn</option>
            <option value="info">info</option>
            <option value="debug">debug</option>
          </select>
        </div>
      </section>

      <section className="card settings-grid">
        <h2>备份与恢复</h2>
        <div className="settings-actions">
          <button type="button" className="btn ghost" onClick={handleExport}>
            导出设置 JSON
          </button>
          <label className="btn ghost settings-import-btn">
            导入设置 JSON
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
          <button
            type="button"
            className="btn ghost"
            onClick={() => backupMutation.mutate()}
            disabled={backupMutation.isPending}
          >
            备份数据库
          </button>
        </div>
        <p className="muted">
          数据库路径：{meta?.databasePath ?? 'unknown'}
          <br />
          备份目录：{meta?.backupDirectory ?? 'unknown'}
        </p>
      </section>

      <section className="card settings-grid">
        <h2>运行时覆盖</h2>
        {meta?.runtimeOverrides.length ? (
          <ul>
            {meta.runtimeOverrides.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">当前无环境变量覆盖。</p>
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
