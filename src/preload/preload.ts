import { contextBridge, ipcRenderer } from 'electron'
import { IPC_BRIDGE_CHANNEL, type IpcResponse } from '../shared/ipc'

const kotoba_api = {
  invoke: (channel: string, payload?: unknown): Promise<IpcResponse> => {
    return ipcRenderer.invoke(IPC_BRIDGE_CHANNEL, { channel, payload })
  },
}

contextBridge.exposeInMainWorld('kotoba', kotoba_api)
