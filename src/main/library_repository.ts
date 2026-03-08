import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'

import {
  LIBRARY_SCHEMA_VERSION,
  library_root_schema,
  type LibraryRoot,
} from '../shared/domain_schema'

const LIBRARY_TEXT_ENCODING = 'utf8'

export interface LibraryRepositoryOptions {
  library_file_path: string
  backup_dir_path: string
  now?: () => Date
}

export interface StartupCheckResult {
  status: 'ok' | 'created' | 'recovered'
  message?: string
  recovered_from?: string
}

interface BackupCandidate {
  path: string
  mtime_ms: number
}

interface ValidBackup {
  path: string
  library: LibraryRoot
}

export const create_empty_library_root = (now: Date): LibraryRoot => ({
  schema_version: LIBRARY_SCHEMA_VERSION,
  updated_at: now.toISOString(),
  words: [],
  review_logs: [],
})

export class LibraryRepository {
  private readonly library_file_path: string
  private readonly backup_dir_path: string
  private readonly now: () => Date
  private write_queue: Promise<unknown> = Promise.resolve()
  private last_backup_local_day: string | null = null

  constructor(options: LibraryRepositoryOptions) {
    this.library_file_path = options.library_file_path
    this.backup_dir_path = options.backup_dir_path
    this.now = options.now ?? (() => new Date())
  }

  async initialize_on_startup(): Promise<StartupCheckResult> {
    await this.ensure_parent_dirs()

    const existing_state = await this.try_read_current_library()
    if (existing_state.exists === false) {
      await this.write_library_file_atomic(create_empty_library_root(this.now()))
      return { status: 'created' }
    }

    if (existing_state.library !== null) {
      return { status: 'ok' }
    }

    const recovered = await this.find_latest_valid_backup()
    if (recovered === null) {
      throw new Error(
        `Library file is corrupted and no valid backup was found: ${this.library_file_path}`
      )
    }

    await this.write_library_file_atomic(recovered.library)
    return {
      status: 'recovered',
      recovered_from: recovered.path,
      message: `Recovered library from backup: ${recovered.path}`,
    }
  }

  async read_library(): Promise<LibraryRoot> {
    const raw = await readFile(this.library_file_path, LIBRARY_TEXT_ENCODING)
    return parse_library_json(raw, this.library_file_path)
  }

  async write_library(next_library: LibraryRoot): Promise<void> {
    await this.enqueue_write(async () => {
      const validated = validate_library(next_library, this.library_file_path)
      await this.ensure_daily_backup_before_write()
      await this.write_library_file_atomic(validated)
    })
  }

  async update_library(
    updater: (current_library: LibraryRoot) => LibraryRoot | Promise<LibraryRoot>
  ): Promise<LibraryRoot> {
    return this.enqueue_write(async () => {
      const current_library = await this.read_library()
      const next_library = await updater(current_library)
      const validated = validate_library(next_library, this.library_file_path)

      await this.ensure_daily_backup_before_write()
      await this.write_library_file_atomic(validated)

      return validated
    })
  }

  private enqueue_write<T>(task: () => Promise<T>): Promise<T> {
    const queued = this.write_queue.then(task, task)
    this.write_queue = queued.then(
      () => undefined,
      () => undefined
    )
    return queued
  }

  private async ensure_parent_dirs(): Promise<void> {
    await mkdir(dirname(this.library_file_path), { recursive: true })
    await mkdir(this.backup_dir_path, { recursive: true })
  }

  private async ensure_daily_backup_before_write(): Promise<void> {
    const day_key = format_local_day_key(this.now())
    if (this.last_backup_local_day === day_key) {
      return
    }

    const current_state = await this.try_read_current_library()
    if (current_state.exists === false) {
      this.last_backup_local_day = day_key
      return
    }

    await mkdir(this.backup_dir_path, { recursive: true })
    const backup_name = `${basename(this.library_file_path, extname(this.library_file_path))}-${format_local_timestamp(
      this.now()
    )}.json`
    const backup_path = join(this.backup_dir_path, backup_name)

    await copyFile(this.library_file_path, backup_path)
    this.last_backup_local_day = day_key
  }

  private async write_library_file_atomic(next_library: LibraryRoot): Promise<void> {
    await this.ensure_parent_dirs()
    const serialized = `${JSON.stringify(next_library, null, 2)}\n`
    const temp_path = `${this.library_file_path}.tmp-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`

    await writeFile(temp_path, serialized, LIBRARY_TEXT_ENCODING)
    try {
      await rename(temp_path, this.library_file_path)
    } catch (error) {
      await unlink(temp_path).catch(() => undefined)
      throw error
    }
  }

  private async try_read_current_library(): Promise<
    { exists: false } | { exists: true; library: LibraryRoot | null }
  > {
    try {
      const raw = await readFile(this.library_file_path, LIBRARY_TEXT_ENCODING)
      const library = try_parse_library_json(raw)
      return { exists: true, library }
    } catch (error) {
      const node_error = error as NodeJS.ErrnoException
      if (node_error.code === 'ENOENT') {
        return { exists: false }
      }
      throw error
    }
  }

  private async find_latest_valid_backup(): Promise<ValidBackup | null> {
    const candidates = await this.list_backup_candidates()
    for (const candidate of candidates) {
      const raw = await readFile(candidate.path, LIBRARY_TEXT_ENCODING)
      const parsed = try_parse_library_json(raw)
      if (parsed !== null) {
        return {
          path: candidate.path,
          library: parsed,
        }
      }
    }
    return null
  }

  private async list_backup_candidates(): Promise<BackupCandidate[]> {
    await mkdir(this.backup_dir_path, { recursive: true })
    const entries = await readdir(this.backup_dir_path)

    const candidates = await Promise.all(
      entries
        .filter((entry) => entry.endsWith('.json'))
        .map(async (entry): Promise<BackupCandidate | null> => {
          const path = join(this.backup_dir_path, entry)
          const entry_stat = await stat(path)
          if (entry_stat.isFile() === false) {
            return null
          }
          return {
            path,
            mtime_ms: entry_stat.mtimeMs,
          }
        })
    )

    return candidates
      .filter((candidate): candidate is BackupCandidate => candidate !== null)
      .sort((left, right) => right.mtime_ms - left.mtime_ms)
  }
}

const parse_library_json = (raw: string, source_path: string): LibraryRoot => {
  const parsed = try_parse_library_json(raw)
  if (parsed === null) {
    throw new Error(`Invalid library data in ${source_path}`)
  }
  return parsed
}

const try_parse_library_json = (raw: string): LibraryRoot | null => {
  try {
    const json_data: unknown = JSON.parse(raw)
    const parsed = library_root_schema.safeParse(json_data)
    if (parsed.success === false) {
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

const validate_library = (library: LibraryRoot, source_path: string): LibraryRoot => {
  const parsed = library_root_schema.safeParse(library)
  if (parsed.success) {
    return parsed.data
  }

  const first_issue = parsed.error.issues[0]
  const issue_path = first_issue.path.join('.') || '(root)'
  throw new Error(
    `Invalid library payload for ${source_path}: ${issue_path}: ${first_issue.message}`
  )
}

const format_local_day_key = (date: Date): string => {
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const format_local_timestamp = (date: Date): string => {
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')
  return `${year}${month}${day}-${hour}${minute}${second}`
}
