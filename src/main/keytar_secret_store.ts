import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import keytar from 'keytar'

const KEYTAR_SERVICE_NAME = 'kotoba'
const KEYTAR_GEMINI_API_KEY_ACCOUNT = 'gemini_api_key'
const SECRET_TEXT_ENCODING = 'utf8'

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

export const create_file_secret_store = (secret_file_path: string): ApiKeySecretStore => ({
  async get_api_key(): Promise<string | null> {
    try {
      const secret = await readFile(secret_file_path, SECRET_TEXT_ENCODING)
      const normalized = secret.trim()
      return normalized.length > 0 ? normalized : null
    } catch (error) {
      const node_error = error as NodeJS.ErrnoException
      if (node_error.code === 'ENOENT') {
        return null
      }
      throw error
    }
  },

  async set_api_key(api_key: string): Promise<void> {
    const normalized = api_key.trim()
    if (normalized.length === 0) {
      throw new Error('API key must not be empty.')
    }

    await mkdir(dirname(secret_file_path), { recursive: true })
    await writeFile(secret_file_path, `${normalized}\n`, SECRET_TEXT_ENCODING)
  },

  async delete_api_key(): Promise<void> {
    await unlink(secret_file_path).catch((error: unknown) => {
      const node_error = error as NodeJS.ErrnoException
      if (node_error.code !== 'ENOENT') {
        throw error
      }
    })
  },
})

export const create_default_keytar_secret_store = (): ApiKeySecretStore => {
  const fake_secret_file_path = process.env.KOTOBA_FAKE_KEYTAR_FILE?.trim()
  if (typeof fake_secret_file_path === 'string' && fake_secret_file_path.length > 0) {
    return create_file_secret_store(fake_secret_file_path)
  }

  return create_keytar_secret_store(keytar)
}
