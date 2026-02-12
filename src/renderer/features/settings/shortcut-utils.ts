import { normalizeShortcutBinding } from '@shared/types';

type ParsedShortcut = {
  modifiers: Set<'mod' | 'ctrl' | 'meta' | 'alt' | 'shift'>;
  key: string;
};

const modifierTokens = new Set(['mod', 'ctrl', 'meta', 'alt', 'shift']);

const parseShortcut = (binding: string): ParsedShortcut | null => {
  const normalized = normalizeShortcutBinding(binding);
  if (!normalized) return null;

  const tokens = normalized.split('+');
  const key = tokens[tokens.length - 1];
  if (!key || modifierTokens.has(key)) return null;

  const modifiers = new Set(
    tokens.slice(0, -1).filter((token): token is ParsedShortcut['modifiers'] extends Set<infer T> ? T : never =>
      modifierTokens.has(token)
    )
  );

  return {
    modifiers,
    key,
  };
};

const eventKeyToToken = (event: KeyboardEvent) => {
  if (event.key === ' ') return 'space';
  return event.key.toLowerCase();
};

export const matchesShortcutBinding = (event: KeyboardEvent, binding: string) => {
  const parsed = parseShortcut(binding);
  if (!parsed) return false;

  const modPressed = event.metaKey || event.ctrlKey;
  if (parsed.modifiers.has('mod')) {
    if (!modPressed) return false;
  } else {
    if (parsed.modifiers.has('meta') !== event.metaKey) return false;
    if (parsed.modifiers.has('ctrl') !== event.ctrlKey) return false;
  }
  if (parsed.modifiers.has('alt') !== event.altKey) return false;
  if (parsed.modifiers.has('shift') !== event.shiftKey) return false;

  return eventKeyToToken(event) === parsed.key;
};

export const formatShortcutLabel = (binding: string) => {
  const parsed = parseShortcut(binding);
  if (!parsed) return binding;

  const parts: string[] = [];
  if (parsed.modifiers.has('mod')) {
    parts.push('Mod');
  } else {
    if (parsed.modifiers.has('meta')) parts.push('Cmd');
    if (parsed.modifiers.has('ctrl')) parts.push('Ctrl');
  }
  if (parsed.modifiers.has('alt')) parts.push('Alt');
  if (parsed.modifiers.has('shift')) parts.push('Shift');

  const keyLabel = parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key;
  parts.push(keyLabel === 'space' ? 'Space' : keyLabel);
  return parts.join('+');
};
