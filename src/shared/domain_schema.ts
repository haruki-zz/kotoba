import { z } from 'zod'

import {
  AI_PROVIDERS,
  DEFAULT_MODEL_BY_PROVIDER,
  is_supported_model_for_provider,
} from './ai_catalog'

export const LIBRARY_SCHEMA_VERSION = 1 as const
export const REVIEW_LOG_RETENTION_LIMIT = 50_000 as const

export const AI_FIELD_LIMITS = {
  reading_kana: {
    min: 1,
    max: 32,
  },
  meaning_ja: {
    min: 8,
    max: 120,
  },
  context_scene_ja: {
    min: 12,
    max: 160,
  },
  example_sentence_ja: {
    min: 8,
    max: 80,
  },
} as const

const ai_provider_schema = z.enum(AI_PROVIDERS)

const UTC_ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const utc_iso_datetime_schema = z.string().regex(UTC_ISO_8601_REGEX, {
  message: 'must be a UTC ISO 8601 timestamp',
})

const schema_version_schema = z
  .number()
  .int()
  .refine((value) => value === LIBRARY_SCHEMA_VERSION, {
    message: `schema_version must be ${LIBRARY_SCHEMA_VERSION}`,
  })

export const review_state_schema = z.object({
  repetition: z.number().int().min(0),
  interval_days: z.number().int().min(0),
  easiness_factor: z.number().min(1.3),
  next_review_at: utc_iso_datetime_schema,
  last_review_at: utc_iso_datetime_schema.nullable(),
  last_grade: z.number().int().min(0).max(5).nullable(),
})

export const word_schema = z.object({
  id: z.string().uuid(),
  word: z.string().trim().min(1).max(128),
  reading_kana: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.reading_kana.min)
    .max(AI_FIELD_LIMITS.reading_kana.max),
  meaning_ja: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.meaning_ja.min)
    .max(AI_FIELD_LIMITS.meaning_ja.max),
  context_scene_ja: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.context_scene_ja.min)
    .max(AI_FIELD_LIMITS.context_scene_ja.max),
  example_sentence_ja: z
    .string()
    .trim()
    .min(AI_FIELD_LIMITS.example_sentence_ja.min)
    .max(AI_FIELD_LIMITS.example_sentence_ja.max),
  source_provider: ai_provider_schema,
  review_state: review_state_schema,
  created_at: utc_iso_datetime_schema,
  updated_at: utc_iso_datetime_schema,
})

export const review_log_schema = z.object({
  id: z.string().uuid(),
  word_id: z.string().uuid(),
  grade: z.number().int().min(0).max(5),
  reviewed_at: utc_iso_datetime_schema,
  before_state: review_state_schema,
  after_state: review_state_schema,
})

export const library_root_schema = z.object({
  schema_version: schema_version_schema,
  updated_at: utc_iso_datetime_schema,
  words: z.array(word_schema),
  review_logs: z.array(review_log_schema),
})

export const library_root_v0_schema = z.object({
  schema_version: z.literal(0),
  updated_at: utc_iso_datetime_schema,
  words: z.array(word_schema),
})

export const settings_schema = z
  .object({
    provider: ai_provider_schema,
    model: z.string().trim().min(1).max(128),
    timeout_seconds: z.number().int().min(1).max(120),
    retries: z.number().int().min(0).max(8),
  })
  .superRefine((settings, context) => {
    if (is_supported_model_for_provider(settings.provider, settings.model)) {
      return
    }

    context.addIssue({
      code: 'custom',
      path: ['model'],
      message: 'must be a supported model for the selected provider',
    })
  })

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  model: DEFAULT_MODEL_BY_PROVIDER.gemini,
  timeout_seconds: 15,
  retries: 2,
}

export type ReviewState = z.infer<typeof review_state_schema>
export type Word = z.infer<typeof word_schema>
export type ReviewLog = z.infer<typeof review_log_schema>
export type LibraryRoot = z.infer<typeof library_root_schema>
export type Settings = z.infer<typeof settings_schema>
