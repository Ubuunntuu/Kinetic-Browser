import { app, BaseWindow, ipcMain, WebContentsView } from 'electron'
import { join } from 'path'
import { BrowserManager } from './browser-manager'
import { SettingsStorage } from './storage'
import { BrowserSettings } from '../shared/types'

let mainWindow: BaseWindow | null = null
let browserManager: BrowserManager | null = null
let storage: SettingsStorage | null = null

function createBrowserWindow(): void {
  storage = new SettingsStorage()

  mainWindow = new BaseWindow({
    width: 1480,
    height: 940,
    minWidth: 940,
    minHeight: 620,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#090a0f',
    show: false
  })

  const uiView = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.contentView.addChildView(uiView)
  browserManager = new BrowserManager(mainWindow, uiView, storage)

  if (process.env['ELECTRON_RENDERER_URL']) {
    uiView.webContents.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    uiView.webContents.loadFile(join(__dirname, '../renderer/index.html'))
  }

  uiView.webContents.once('did-finish-load', () => {
    if (!mainWindow || !browserManager) return
    browserManager.initializeStartupTabs()
    browserManager.updateLayoutBounds()
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    browserManager = null
  })
}

function registerIpcHandlers(): void {
  ipcMain.handle('kinetic:get-initial-state', () => {
    return browserManager?.getStatePayload()
  })

  ipcMain.handle(
    'kinetic:create-tab',
    (_e, url?: string, options?: { isPrivate?: boolean }) => {
      return browserManager?.createTab(url, options)
    }
  )

  ipcMain.handle('kinetic:close-tab', (_e, tabId: string) => {
    browserManager?.closeTab(tabId)
  })

  ipcMain.handle('kinetic:switch-tab', (_e, tabId: string) => {
    browserManager?.switchTab(tabId)
  })

  ipcMain.handle('kinetic:duplicate-tab', (_e, tabId: string) => {
    return browserManager?.duplicateTab(tabId)
  })

  ipcMain.handle('kinetic:toggle-pin-tab', (_e, tabId: string) => {
    browserManager?.togglePinTab(tabId)
  })

  ipcMain.handle('kinetic:toggle-mute-tab', (_e, tabId: string) => {
    browserManager?.toggleMuteTab(tabId)
  })

  ipcMain.handle('kinetic:navigate', (_e, input: string) => {
    browserManager?.navigateActiveTab(input)
  })

  ipcMain.handle('kinetic:go-back', () => {
    browserManager?.goBack()
  })

  ipcMain.handle('kinetic:go-forward', () => {
    browserManager?.goForward()
  })

  ipcMain.handle('kinetic:reload', () => {
    browserManager?.reload()
  })

  ipcMain.handle('kinetic:stop', () => {
    browserManager?.stop()
  })

  ipcMain.handle('kinetic:go-home', () => {
    browserManager?.goHome()
  })

  ipcMain.handle('kinetic:toggle-devtools', () => {
    browserManager?.toggleActiveTabDevTools()
  })

  // History
  ipcMain.handle('kinetic:delete-history-item', (_e, id: string) => {
    browserManager?.deleteHistoryItem(id)
  })

  ipcMain.handle('kinetic:clear-history', () => {
    browserManager?.clearHistory()
  })

  // Bookmarks
  ipcMain.handle(
    'kinetic:add-bookmark',
    (_e, data: { title: string; url: string; favicon?: string; folder?: string }) => {
      return browserManager?.addBookmark(data)
    }
  )

  ipcMain.handle('kinetic:remove-bookmark', (_e, id: string) => {
    browserManager?.removeBookmark(id)
  })

  ipcMain.handle('kinetic:create-bookmark-folder', (_e, folderName: string) => {
    return browserManager?.createBookmarkFolder(folderName)
  })

  // Downloads
  ipcMain.handle('kinetic:pause-download', (_e, id: string) => {
    browserManager?.pauseDownload(id)
  })

  ipcMain.handle('kinetic:resume-download', (_e, id: string) => {
    browserManager?.resumeDownload(id)
  })

  ipcMain.handle('kinetic:cancel-download', (_e, id: string) => {
    browserManager?.cancelDownload(id)
  })

  ipcMain.handle('kinetic:show-download-folder', (_e, id: string) => {
    browserManager?.showDownloadInFolder(id)
  })

  ipcMain.handle('kinetic:clear-downloads', () => {
    browserManager?.clearCompletedDownloads()
  })

  // Profiles
  ipcMain.handle('kinetic:create-profile', (_e, name: string, color: string) => {
    return browserManager?.createProfile(name, color)
  })

  ipcMain.handle('kinetic:switch-profile', (_e, profileId: string) => {
    browserManager?.switchProfile(profileId)
  })

  ipcMain.handle('kinetic:delete-profile', (_e, profileId: string) => {
    browserManager?.deleteProfile(profileId)
  })

  // Layout & Settings
  ipcMain.handle('kinetic:set-right-drawer', (_e, isOpen: boolean, width?: number) => {
    browserManager?.setRightDrawerOpen(isOpen, width)
  })

  ipcMain.handle('kinetic:get-settings', () => {
    return storage?.getSettings()
  })

  ipcMain.handle('kinetic:update-settings', (_e, partial: Partial<BrowserSettings>) => {
    return browserManager?.updateSettings(partial)
  })

  ipcMain.handle('kinetic:reset-settings', () => {
    return browserManager?.resetSettings()
  })

  // Window Controls
  ipcMain.handle('kinetic:window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('kinetic:window-maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.handle('kinetic:window-close', () => {
    mainWindow?.close()
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createBrowserWindow()

  app.on('activate', () => {
    if (BaseWindow.getAllWindows().length === 0) {
      createBrowserWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})