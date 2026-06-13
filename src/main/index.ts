import { join } from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'
import { createAbcQueryService } from '../application/abc/abc-query-service'
import { createRealAbcClient } from '../application/abc/real-abc-client'

const abcQueryService = createAbcQueryService(createRealAbcClient())

ipcMain.handle('abc:test-connection', (_event, config) => {
  return abcQueryService.testConnection(config)
})

ipcMain.handle('abc:query', (_event, request) => {
  return abcQueryService.query(request)
})

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
