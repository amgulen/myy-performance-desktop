import { contextBridge } from 'electron'

const desktopInfo = Object.freeze({
  platform: process.platform
})

contextBridge.exposeInMainWorld('desktopInfo', desktopInfo)
