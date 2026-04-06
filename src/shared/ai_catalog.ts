export const AI_PROVIDERS = ['gemini', 'openai', 'anthropic'] as const

export type AiProviderName = (typeof AI_PROVIDERS)[number]

export interface AiProviderOption {
  value: AiProviderName
  label: string
}

export interface AiModelOption {
  value: string
  label: string
}

export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
]

export const AI_MODEL_OPTIONS: Record<AiProviderName, AiModelOption[]> = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
  openai: [
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  ],
}

export const DEFAULT_MODEL_BY_PROVIDER: Record<AiProviderName, string> = {
  gemini: AI_MODEL_OPTIONS.gemini[0].value,
  openai: AI_MODEL_OPTIONS.openai[0].value,
  anthropic: AI_MODEL_OPTIONS.anthropic[0].value,
}

export const get_provider_label = (provider: AiProviderName): string =>
  AI_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider

export const get_models_for_provider = (provider: AiProviderName): AiModelOption[] =>
  AI_MODEL_OPTIONS[provider]

export const is_supported_provider = (value: string): value is AiProviderName =>
  AI_PROVIDERS.includes(value as AiProviderName)

export const is_supported_model_for_provider = (provider: AiProviderName, model: string): boolean =>
  AI_MODEL_OPTIONS[provider].some((option) => option.value === model)
