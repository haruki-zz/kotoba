export const IPC_BRIDGE_CHANNEL = 'kotoba:invoke' as const

export const IPC_CHANNELS = {
  APP_PING: 'app:ping',
} as const

export type IpcAllowedChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export type IpcErrorCode =
  | 'IPC_ENVELOPE_INVALID'
  | 'IPC_CHANNEL_NOT_ALLOWED'
  | 'IPC_PAYLOAD_INVALID'
  | 'IPC_INTERNAL_ERROR'

export interface IpcEnvelope {
  channel: string
  payload?: unknown
}

export interface PingPayload {
  message: string
}

export interface PingResult {
  echoed_message: string
  received_at: string
}

export interface IpcSuccess<T = unknown> {
  ok: true
  data: T
}

export interface IpcFailure {
  ok: false
  error: {
    code: IpcErrorCode
    message: string
  }
}

export type IpcResponse<T = unknown> = IpcSuccess<T> | IpcFailure

export const ALLOWED_CHANNEL_SET = new Set<string>(Object.values(IPC_CHANNELS))

export const create_success_response = <T>(data: T): IpcSuccess<T> => ({
  ok: true,
  data,
})

export const create_failure_response = (code: IpcErrorCode, message: string): IpcFailure => ({
  ok: false,
  error: {
    code,
    message,
  },
})

export const is_ipc_envelope = (value: unknown): value is IpcEnvelope => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_envelope = value as Partial<IpcEnvelope>
  return typeof maybe_envelope.channel === 'string'
}

export const is_ping_payload = (value: unknown): value is PingPayload => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const maybe_payload = value as Partial<PingPayload>
  return typeof maybe_payload.message === 'string' && maybe_payload.message.trim().length > 0
}
