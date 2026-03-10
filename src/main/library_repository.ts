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
  library_root_v0_schema,
  type LibraryRoot,
} from '../shared/domain_schema'

const LIBRARY_TEXT_ENCODING = 'utf8'

interface MigrationContext {
  now: Date
}

export interface LibraryMigration {
  from_version: number
  to_version: number
  migrate: (input: unknown, context: MigrationContext) => unknown
}

const migrate_library_v0_to_v1: LibraryMigration = {
  from_version: 0,
  to_version: 1,
  migrate: (input, context) => {
    const parsed = library_root_v0_schema.safeParse(input)
    if (parsed.success === false) {
      const first_issue = parsed.error.issues[0]
      const issue_path = first_issue.path.join('.') || '(root)'
      throw new Error(`Invalid schema v0 library payload: ${issue_path}: ${first_issue.message}`)
    }

    return {
      schema_version: 1,
      updated_at: context.now.toISOString(),
      words: parsed.data.words,
      review_logs: [],
    }
  },
}

export const default_library_migrations: readonly LibraryMigration[] = [migrate_library_v0_to_v1]

export interface LibraryRepositoryOptions {
  library_file_path: string
  backup_dir_path: string
  now?: () => Date
  migrations?: readonly LibraryMigration[]
}

export interface StartupCheckResult {
  status: 'ok' | 'created' | 'recovered' | 'migrated'
  message?: string
  recovered_from?: string
  migrated_from_version?: number
  migration_backup_path?: string
}

interface BackupCandidate {
  path: string
  mtime_ms: number
}

interface ValidBackup {
  path: string
  library: LibraryRoot
}

interface MigrationResult {
  library: LibraryRoot
  from_version: number
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
  private readonly migrations: readonly LibraryMigration[]
  private write_queue: Promise<unknown> = Promise.resolve()
  private last_backup_local_day: string | null = null

  constructor(options: LibraryRepositoryOptions) {
    this.library_file_path = options.library_file_path
    this.backup_dir_path = options.backup_dir_path
    this.now = options.now ?? (() => new Date())
    this.migrations = options.migrations ?? default_library_migrations
  }

  async initialize_on_startup(): Promise<StartupCheckResult> {
    await this.ensure_parent_dirs()

    const existing_state = await this.try_read_current_library_raw()
    if (existing_state.exists === false) {
      await this.write_library_file_atomic(create_empty_library_root(this.now()))
      return { status: 'created' }
    }

    const current_library = try_parse_library_json(existing_state.raw)
    if (current_library !== null) {
      return { status: 'ok' }
    }

    const migration_result = await this.try_migrate_current_library(existing_state.raw)
    if (migration_result !== null) {
      return migration_result
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

  private async enqueue_write<T>(task: () => Promise<T>): Promise<T> {
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

    const backup_path = this.build_backup_path('daily')
    await copyFile(this.library_file_path, backup_path)
    this.last_backup_local_day = day_key
  }

  private async create_forced_backup(reason: 'migration'): Promise<string> {
    await mkdir(this.backup_dir_path, { recursive: true })
    const backup_path = this.build_backup_path(reason)
    await copyFile(this.library_file_path, backup_path)
    return backup_path
  }

  private build_backup_path(reason: 'daily' | 'migration'): string {
    const backup_name = `${basename(this.library_file_path, extname(this.library_file_path))}-${reason}-${format_local_timestamp(
      this.now()
    )}.json`
    return join(this.backup_dir_path, backup_name)
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

  private async try_read_current_library_raw(): Promise<
    { exists: false } | { exists: true; raw: string }
  > {
    try {
      const raw = await readFile(this.library_file_path, LIBRARY_TEXT_ENCODING)
      return { exists: true, raw }
    } catch (error) {
      const node_error = error as NodeJS.ErrnoException
      if (node_error.code === 'ENOENT') {
        return { exists: false }
      }
      throw error
    }
  }

  private async try_read_current_library(): Promise<
    { exists: false } | { exists: true; library: LibraryRoot | null }
  > {
    const state = await this.try_read_current_library_raw()
    if (state.exists === false) {
      return state
    }
    return {
      exists: true,
      library: try_parse_library_json(state.raw),
    }
  }

  private async try_migrate_current_library(raw: string): Promise<StartupCheckResult | null> {
    const json_data = try_parse_json(raw)
    if (json_data === null) {
      return null
    }

    const schema_version = read_schema_version(json_data)
    if (schema_version === null) {
      return null
    }

    if (schema_version === LIBRARY_SCHEMA_VERSION) {
      return null
    }

    if (schema_version > LIBRARY_SCHEMA_VERSION) {
      throw new Error(
        `Library schema_version ${schema_version} is newer than supported ${LIBRARY_SCHEMA_VERSION}`
      )
    }

    const migration_backup_path = await this.create_forced_backup('migration')

    try {
      const migrated = this.migrate_to_latest(json_data)
      await this.write_library_file_atomic(migrated.library)
      return {
        status: 'migrated',
        migrated_from_version: migrated.from_version,
        migration_backup_path,
        message: `Migrated library from schema v${migrated.from_version} to v${LIBRARY_SCHEMA_VERSION}`,
      }
    } catch (migration_error) {
      const rollback_error = await this.rollback_from_backup(migration_backup_path)
      if (rollback_error !== null) {
        throw new Error(
          `Library migration failed and rollback also failed. migration_error=${format_unknown_error(
            migration_error
          )}; rollback_error=${format_unknown_error(rollback_error)}`
        )
      }

      throw new Error(
        `Library migration failed and was rolled back from backup: ${migration_backup_path}. ${format_unknown_error(
          migration_error
        )}`
      )
    }
  }

  private migrate_to_latest(json_data: unknown): MigrationResult {
    const from_version = read_schema_version(json_data)
    if (from_version === null) {
      throw new Error('Cannot migrate library without integer schema_version')
    }

    const context: MigrationContext = { now: this.now() }
    let current_data = json_data
    let current_version = from_version

    while (current_version < LIBRARY_SCHEMA_VERSION) {
      const next_version = current_version + 1
      const migration = this.find_sequential_migration(current_version, next_version)
      if (migration === null) {
        throw new Error(
          `No migration path found for schema_version ${current_version} -> ${next_version}`
        )
      }
      current_data = migration.migrate(current_data, context)
      current_version = next_version
    }

    const final_parsed = library_root_schema.safeParse(current_data)
    if (final_parsed.success === false) {
      const first_issue = final_parsed.error.issues[0]
      const issue_path = first_issue.path.join('.') || '(root)'
      throw new Error(`Migrated library payload is invalid: ${issue_path}: ${first_issue.message}`)
    }

    return {
      library: final_parsed.data,
      from_version,
    }
  }

  private find_sequential_migration(
    from_version: number,
    to_version: number
  ): LibraryMigration | null {
    return (
      this.migrations.find(
        (migration) =>
          migration.from_version === from_version && migration.to_version === to_version
      ) ?? null
    )
  }

  private async rollback_from_backup(backup_path: string): Promise<Error | null> {
    try {
      await copyFile(backup_path, this.library_file_path)
      return null
    } catch (error) {
      if (error instanceof Error) {
        return error
      }
      return new Error(String(error))
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

const try_parse_json = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const try_parse_library_json = (raw: string): LibraryRoot | null => {
  const json_data = try_parse_json(raw)
  if (json_data === null) {
    return null
  }

  const parsed = library_root_schema.safeParse(json_data)
  if (parsed.success === false) {
    return null
  }
  return parsed.data
}

const read_schema_version = (json_data: unknown): number | null => {
  if (typeof json_data !== 'object' || json_data === null) {
    return null
  }

  const { schema_version } = json_data as { schema_version?: unknown }
  if (typeof schema_version !== 'number' || Number.isInteger(schema_version) === false) {
    return null
  }

  return schema_version
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
  const millisecond = date.getMilliseconds().toString().padStart(3, '0')
  return `${year}${month}${day}-${hour}${minute}${second}-${millisecond}`
}

const format_unknown_error = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
