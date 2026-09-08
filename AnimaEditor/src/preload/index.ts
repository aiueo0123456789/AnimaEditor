import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

const fileAPI = {
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('write-file', path, data),
  showSaveDialog: (defaultName: string) => ipcRenderer.invoke('show-save-dialog', defaultName),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('fileAPI', fileAPI);
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.fileAPI = fileAPI
}

