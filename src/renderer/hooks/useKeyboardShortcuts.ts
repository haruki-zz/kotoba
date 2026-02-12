import { useEffect } from 'react';

import { ShortcutBindings, defaultAppSettings } from '@shared/types';

import { matchesShortcutBinding } from '../features/settings/shortcut-utils';

type HandlerMap = {
  onHard?: () => void;
  onMedium?: () => void;
  onEasy?: () => void;
  onSkip?: () => void;
  onToggleDetail?: () => void;
  onUndo?: () => void;
  enabled?: boolean;
  bindings?: Partial<ShortcutBindings>;
};

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useKeyboardShortcuts(map: HandlerMap) {
  useEffect(() => {
    if (map.enabled === false) return;

    const bindings: ShortcutBindings = {
      ...defaultAppSettings.shortcuts,
      ...(map.bindings ?? {}),
    };

    const handler = (event: KeyboardEvent) => {
      const active = document.activeElement;
      const isTyping = active && INPUT_TAGS.has(active.tagName);
      if (isTyping) return;

      if (matchesShortcutBinding(event, bindings.scoreHard)) {
        event.preventDefault();
        map.onHard?.();
        return;
      }

      if (matchesShortcutBinding(event, bindings.scoreMedium)) {
        event.preventDefault();
        map.onMedium?.();
        return;
      }

      if (matchesShortcutBinding(event, bindings.scoreEasy)) {
        event.preventDefault();
        map.onEasy?.();
        return;
      }

      if (matchesShortcutBinding(event, bindings.skipCard)) {
        event.preventDefault();
        map.onSkip?.();
        return;
      }

      if (matchesShortcutBinding(event, bindings.toggleDetails)) {
        event.preventDefault();
        map.onToggleDetail?.();
        return;
      }

      if (matchesShortcutBinding(event, bindings.undoReview)) {
        event.preventDefault();
        map.onUndo?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map]);
}
