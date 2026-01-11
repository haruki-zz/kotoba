import { RendererApi } from "../shared/ipc";

declare global {
  interface Window {
    electronAPI: RendererApi;
  }
}

export {};
