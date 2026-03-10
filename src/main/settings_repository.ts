import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { DEFAULT_SETTINGS, settings_schema, type Settings } from '../shared/domain_schema'

const SETTINGS_TEXT_ENCODING = 'utf8'

export interface SettingsRepositoryOptions {
  settings_file_path: string
}

export class SettingsRepository {
  private readonly settings_file_path: string
  private write_queue: Promise<unknown> = Promise.resolve()

  constructor(options: SettingsRepositoryOptions) {
    this.settings_file_path = options.settings_file_path
  }

  async read_settings(): Promise<Settings> {
    const current = await this.try_read_current_settings()
    if (current !== null) {
      return current
    }

    const defaults = validate_settings(DEFAULT_SETTINGS, this.settings_file_path)
    await this.write_settings(defaults)
    return defaults
  }

  async write_settings(next_settings: Settings): Promise<Settings> {
    return this.enqueue_write(async () => {
      const validated = validate_settings(next_settings, this.settings_file_path)
      await this.write_settings_file_atomic(validated)
      return validated
    })
  }

  async update_settings(
    updater: (current_settings: Settings) => Settings | Promise<Settings>
  ): Promise<Settings> {
    return this.enqueue_write(async () => {
      const current_settings = await this.read_settings_for_update()
      const next_settings = await updater(current_settings)
      const validated = validate_settings(next_settings, this.settings_file_path)
      await this.write_settings_file_atomic(validated)
      return validated
    })
  }

  private async enqueue_write<T>(task: () => Promise<T>): Promise<T> {
    const queued = this.write_queue.then(task, task)
    this.write_queue = queued.then(
      () => undefined,
      () => undefined
    )
    return queued
  }

  private async read_settings_for_update(): Promise<Settings> {
    const current = await this.try_read_current_settings()
    if (current !== null) {
      return current
    }

    const defaults = validate_settings(DEFAULT_SETTINGS, this.settings_file_path)
    await this.write_settings_file_atomic(defaults)
    return defaults
  }

  private async try_read_current_settings(): Promise<Settings | null> {
    try {
      const raw = await readFile(this.settings_file_path, SETTINGS_TEXT_ENCODING)
      return parse_settings_json(raw, this.settings_file_path)
    } catch (error) {
      const node_error = error as NodeJS.ErrnoException
      if (node_error.code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  private async write_settings_file_atomic(next_settings: Settings): Promise<void> {
    await mkdir(dirname(this.settings_file_path), { recursive: true })

    const serialized = `${JSON.stringify(next_settings, null, 2)}\n`
    const temp_path = `${this.settings_file_path}.tmp-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`

    await writeFile(temp_path, serialized, SETTINGS_TEXT_ENCODING)
    try {
      await rename(temp_path, this.settings_file_path)
    } catch (error) {
      await unlink(temp_path).catch(() => undefined)
      throw error
    }
  }
}

const parse_settings_json = (raw: string, source_path: string): Settings => {
  let parsed_json: unknown
  try {
    parsed_json = JSON.parse(raw)
  } catch {
    throw new Error(`Invalid settings data in ${source_path}: malformed JSON`)
  }

  return validate_settings(parsed_json, source_path)
}

const validate_settings = (settings: unknown, source_path: string): Settings => {
  const parsed = settings_schema.safeParse(settings)
  if (parsed.success) {
    return parsed.data
  }

  const first_issue = parsed.error.issues[0]
  const issue_path = first_issue.path.join('.') || '(root)'
  throw new Error(
    `Invalid settings payload for ${source_path}: ${issue_path}: ${first_issue.message}`
  )
}
