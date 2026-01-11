import { ipcMain } from "electron";
import { IPC_CHANNELS, IpcChannel } from "../../shared/ipc";
import { createIpcHandlers, IpcContext } from "./handlers";

export const registerIpcHandlers = (
  context: IpcContext,
  ipc: Pick<typeof ipcMain, "handle" | "removeHandler"> = ipcMain,
) => {
  const handlers = createIpcHandlers(context);

  (Object.keys(handlers) as IpcChannel[]).forEach((channel) => {
    ipc.removeHandler(channel);
    ipc.handle(channel, (_event, payload) => handlers[channel](payload));
  });

  return () => {
    (Object.keys(handlers) as IpcChannel[]).forEach((channel) => {
      ipc.removeHandler(channel);
    });
  };
};

export type { IpcContext } from "./handlers";
