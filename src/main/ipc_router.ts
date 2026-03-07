import { ipcMain } from 'electron'
import {
  ALLOWED_CHANNEL_SET,
  IPC_BRIDGE_CHANNEL,
  IPC_CHANNELS,
  create_failure_response,
  create_success_response,
  is_ipc_envelope,
  is_ping_payload,
  type IpcAllowedChannel,
  type IpcResponse,
  type PingResult,
} from '../shared/ipc'

type ChannelHandler = (payload: unknown) => IpcResponse | Promise<IpcResponse>

const app_ping_handler: ChannelHandler = (payload: unknown) => {
  if (!is_ping_payload(payload)) {
    console.warn('[IPC_REJECTED] code=IPC_PAYLOAD_INVALID channel=app:ping')
    return create_failure_response('IPC_PAYLOAD_INVALID', 'Payload for app:ping is invalid.')
  }

  const result: PingResult = {
    echoed_message: payload.message,
    received_at: new Date().toISOString(),
  }

  return create_success_response(result)
}

const channel_handler_map: Record<IpcAllowedChannel, ChannelHandler> = {
  [IPC_CHANNELS.APP_PING]: app_ping_handler,
}

export const register_ipc_router = (): void => {
  ipcMain.handle(IPC_BRIDGE_CHANNEL, async (_event, envelope: unknown): Promise<IpcResponse> => {
    if (!is_ipc_envelope(envelope)) {
      console.warn('[IPC_REJECTED] code=IPC_ENVELOPE_INVALID reason=malformed_envelope')
      return create_failure_response('IPC_ENVELOPE_INVALID', 'IPC envelope is invalid.')
    }

    if (!ALLOWED_CHANNEL_SET.has(envelope.channel)) {
      console.warn(`[IPC_REJECTED] code=IPC_CHANNEL_NOT_ALLOWED channel=${envelope.channel}`)
      return create_failure_response(
        'IPC_CHANNEL_NOT_ALLOWED',
        `Channel "${envelope.channel}" is not allowed.`
      )
    }

    const handler = channel_handler_map[envelope.channel as IpcAllowedChannel]

    try {
      return await handler(envelope.payload)
    } catch (error) {
      console.error(`[IPC_REJECTED] code=IPC_INTERNAL_ERROR channel=${envelope.channel}`, error)
      return create_failure_response('IPC_INTERNAL_ERROR', 'Internal IPC error.')
    }
  })
}
