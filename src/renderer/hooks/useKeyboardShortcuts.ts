import { useEffect } from 'react';

type HandlerMap = {
  onHard?: () => void;
  onMedium?: () => void;
  onEasy?: () => void;
  onSkip?: () => void;
  onToggleDetail?: () => void;
  onUndo?: () => void;
  enabled?: boolean;
};

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useKeyboardShortcuts(map: HandlerMap) {
  useEffect(() => {
    if (map.enabled === false) return;

    const handler = (event: KeyboardEvent) => {
      const active = document.activeElement;
      const isTyping = active && INPUT_TAGS.has(active.tagName);
      if (isTyping) return;

      switch (event.key.toLowerCase()) {
        case '1':
        case 'h':
          event.preventDefault();
          map.onHard?.();
          break;
        case '2':
        case 'm':
        case 'enter':
          event.preventDefault();
          map.onMedium?.();
          break;
        case '3':
        case 'e':
          event.preventDefault();
          map.onEasy?.();
          break;
        case 's':
          event.preventDefault();
          map.onSkip?.();
          break;
        case ' ':
          event.preventDefault();
          map.onToggleDetail?.();
          break;
        case 'z':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            map.onUndo?.();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map]);
}
