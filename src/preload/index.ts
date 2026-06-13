import { contextBridge, ipcRenderer } from 'electron'

const desktopInfo = Object.freeze({
  platform: process.platform
})

contextBridge.exposeInMainWorld('desktopInfo', desktopInfo)

contextBridge.exposeInMainWorld('abcApi', {
  testConnection: (config: unknown) => ipcRenderer.invoke('abc:test-connection', config),
  query: (request: unknown) => ipcRenderer.invoke('abc:query', request)
})
