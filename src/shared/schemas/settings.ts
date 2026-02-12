import { z } from 'zod';

import { aiProviderEnum, aiToneEnum } from '../ai';

export const APP_SETTINGS_VERSION = 1 as const;

const modifierTokens = new Set(['mod', 'ctrl', 'meta', 'alt', 'shift']);

const shortcutTokenAliases: Record<string, string> = {
  cmd: 'meta',
  command: 'meta',
  control: 'ctrl',
  option: 'alt',
  opt: 'alt',
  spacebar: 'space',
  return: 'enter',
  esc: 'escape',
};

const normalizeToken = (token: string) => {
  const trimmed = token.trim().toLowerCase();
  if (trimmed.length === 0) return '';
  return shortcutTokenAliases[trimmed] ?? trimmed;
};

const parseBinding = (binding: string) => {
  const tokens = binding
    .split('+')
    .map((token) => normalizeToken(token))
    .filter(Boolean);

  if (tokens.length === 0) {
    return { modifiers: [] as string[], key: '' };
  }

  const modifiers: string[] = [];
  let key = '';

  for (const token of tokens) {
    if (modifierTokens.has(token)) {
      modifiers.push(token);
      continue;
    }
    key = token;
  }

  if (!key) {
    return { modifiers, key: '' };
  }

  const orderedModifiers = ['mod', 'ctrl', 'meta', 'alt', 'shift'].filter((item) =>
    modifiers.includes(item)
  );

  return {
    modifiers: orderedModifiers,
    key,
  };
};

export const normalizeShortcutBinding = (binding: string) => {
  const parsed = parseBinding(binding);
  if (!parsed.key) return '';
  return [...parsed.modifiers, parsed.key].join('+');
};

const shortcutBindingSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .refine((value) => {
    const parsed = parseBinding(value);
    return Boolean(parsed.key) && !modifierTokens.has(parsed.key);
  }, 'Invalid shortcut binding');

export const shortcutActionEnum = z.enum([
  'scoreHard',
  'scoreMedium',
  'scoreEasy',
  'skipCard',
  'toggleDetails',
  'undoReview',
]);

export const shortcutBindingsSchema = z.object({
  scoreHard: shortcutBindingSchema.default('1'),
  scoreMedium: shortcutBindingSchema.default('2'),
  scoreEasy: shortcutBindingSchema.default('3'),
  skipCard: shortcutBindingSchema.default('s'),
  toggleDetails: shortcutBindingSchema.default('space'),
  undoReview: shortcutBindingSchema.default('mod+z'),
});

export const shortcutConflictSchema = z.object({
  binding: z.string().min(1),
  actions: z.array(shortcutActionEnum).min(2),
});

export const appSettingsSchema = z.object({
  version: z.literal(APP_SETTINGS_VERSION),
  appearance: z.object({
    themeMode: z.enum(['system', 'light', 'dark']).default('system'),
    language: z.enum(['zh-CN', 'en-US', 'ja-JP']).default('zh-CN'),
  }),
  review: z.object({
    queueLimit: z.number().int().min(1).max(100).default(30),
  }),
  contentStyle: z
    .object({
      tone: aiToneEnum.default('casual'),
      exampleLengthMin: z.number().int().min(5).max(50).default(15),
      exampleLengthMax: z.number().int().min(5).max(80).default(25),
      sceneLengthMin: z.number().int().min(10).max(80).default(30),
      sceneLengthMax: z.number().int().min(10).max(120).default(40),
    })
    .superRefine((value, ctx) => {
      if (value.exampleLengthMin > value.exampleLengthMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'exampleLengthMin cannot exceed exampleLengthMax',
          path: ['exampleLengthMin'],
        });
      }
      if (value.sceneLengthMin > value.sceneLengthMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'sceneLengthMin cannot exceed sceneLengthMax',
          path: ['sceneLengthMin'],
        });
      }
    }),
  ai: z.object({
    defaultProvider: aiProviderEnum.default('mock'),
  }),
  notifications: z.object({
    reviewCompleted: z.boolean().default(true),
  }),
  privacy: z.object({
    allowNetwork: z.boolean().default(true),
    aiRequestLogging: z.boolean().default(true),
    telemetryEnabled: z.boolean().default(false),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  }),
  shortcuts: shortcutBindingsSchema,
});

const patchCrossFieldSchema = appSettingsSchema.omit({ version: true }).deepPartial().strict();

export const appSettingsPatchSchema = patchCrossFieldSchema.superRefine((value, ctx) => {
  const exampleMin = value.contentStyle?.exampleLengthMin;
  const exampleMax = value.contentStyle?.exampleLengthMax;
  if (typeof exampleMin === 'number' && typeof exampleMax === 'number' && exampleMin > exampleMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'exampleLengthMin cannot exceed exampleLengthMax',
      path: ['contentStyle', 'exampleLengthMin'],
    });
  }

  const sceneMin = value.contentStyle?.sceneLengthMin;
  const sceneMax = value.contentStyle?.sceneLengthMax;
  if (typeof sceneMin === 'number' && typeof sceneMax === 'number' && sceneMin > sceneMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'sceneLengthMin cannot exceed sceneLengthMax',
      path: ['contentStyle', 'sceneLengthMin'],
    });
  }
});

export const defaultAppSettings = appSettingsSchema.parse({
  version: APP_SETTINGS_VERSION,
  appearance: {
    themeMode: 'system',
    language: 'zh-CN',
  },
  review: {
    queueLimit: 30,
  },
  contentStyle: {
    tone: 'casual',
    exampleLengthMin: 15,
    exampleLengthMax: 25,
    sceneLengthMin: 30,
    sceneLengthMax: 40,
  },
  ai: {
    defaultProvider: 'mock',
  },
  notifications: {
    reviewCompleted: true,
  },
  privacy: {
    allowNetwork: true,
    aiRequestLogging: true,
    telemetryEnabled: false,
    logLevel: 'info',
  },
  shortcuts: {
    scoreHard: '1',
    scoreMedium: '2',
    scoreEasy: '3',
    skipCard: 's',
    toggleDetails: 'space',
    undoReview: 'mod+z',
  },
});

export const settingsBackupFileSchema = z.object({
  version: z.literal(APP_SETTINGS_VERSION),
  exportedAt: z.string().datetime({ offset: true }),
  userSettings: appSettingsPatchSchema,
  checksum: z.string().min(8),
});

export type ShortcutAction = z.infer<typeof shortcutActionEnum>;
export type ShortcutBindings = z.infer<typeof shortcutBindingsSchema>;
export type ShortcutConflict = z.infer<typeof shortcutConflictSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type AppSettingsPatch = z.infer<typeof appSettingsPatchSchema>;
export type SettingsBackupFile = z.infer<typeof settingsBackupFileSchema>;

export const findShortcutConflicts = (shortcuts: ShortcutBindings): ShortcutConflict[] => {
  const grouped = new Map<string, ShortcutAction[]>();

  for (const [action, rawBinding] of Object.entries(shortcuts) as [ShortcutAction, string][]) {
    const binding = normalizeShortcutBinding(rawBinding);
    if (!binding) continue;

    const existing = grouped.get(binding) ?? [];
    existing.push(action);
    grouped.set(binding, existing);
  }

  return Array.from(grouped.entries())
    .filter(([, actions]) => actions.length > 1)
    .map(([binding, actions]) => ({ binding, actions }));
};
