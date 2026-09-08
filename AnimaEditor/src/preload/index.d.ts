import type { ElectronAPI } from '@electron-toolkit/preload';

interface FileAPI {
  readFile: (path: string) => Promise<string | null>;
  writeFile: (path: string, data: string) => Promise<boolean>;
  showSaveDialog: (defaultName: string) => Promise<string | null>;
  showOpenDialog: () => Promise<string | null>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: unknown;
    fileAPI: FileAPI;
  }
}

export {};