import type { IpcResponse } from '../shared/ipc'

declare global {
  interface Window {
    kotoba: {
      invoke: (channel: string, payload?: unknown) => Promise<IpcResponse>
    }
  }
}

export {}
