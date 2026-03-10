import keytar from 'keytar'

const KEYTAR_SERVICE_NAME = 'kotoba'
const KEYTAR_GEMINI_API_KEY_ACCOUNT = 'gemini_api_key'

export interface KeytarClient {
  getPassword(service: string, account: string): Promise<string | null>
  setPassword(service: string, account: string, password: string): Promise<void>
  deletePassword(service: string, account: string): Promise<boolean>
}

export interface ApiKeySecretStore {
  get_api_key(): Promise<string | null>
  set_api_key(api_key: string): Promise<void>
  delete_api_key(): Promise<void>
}

export const create_keytar_secret_store = (keytar_client: KeytarClient): ApiKeySecretStore => ({
  async get_api_key(): Promise<string | null> {
    const secret = await keytar_client.getPassword(
      KEYTAR_SERVICE_NAME,
      KEYTAR_GEMINI_API_KEY_ACCOUNT
    )
    if (secret === null) {
      return null
    }

    const normalized = secret.trim()
    return normalized.length > 0 ? normalized : null
  },

  async set_api_key(api_key: string): Promise<void> {
    const normalized = api_key.trim()
    if (normalized.length === 0) {
      throw new Error('API key must not be empty.')
    }

    await keytar_client.setPassword(KEYTAR_SERVICE_NAME, KEYTAR_GEMINI_API_KEY_ACCOUNT, normalized)
  },

  async delete_api_key(): Promise<void> {
    await keytar_client.deletePassword(KEYTAR_SERVICE_NAME, KEYTAR_GEMINI_API_KEY_ACCOUNT)
  },
})

export const create_default_keytar_secret_store = (): ApiKeySecretStore =>
  create_keytar_secret_store(keytar)
