import { contextBridge, ipcRenderer } from 'electron'
import { BrowserSettings, BrowserStatePayload, KineticAPI } from '../shared/types'

const kineticApi: KineticAPI = {
  createTab: (url?: string) => ipcRenderer.invoke('kinetic:create-tab', url),
  closeTab: (tabId: string) => ipcRenderer.invoke('kinetic:close-tab', tabId),
  switchTab: (tabId: string) => ipcRenderer.invoke('kinetic:switch-tab', tabId),
  duplicateTab: (tabId: string) => ipcRenderer.invoke('kinetic:duplicate-tab', tabId),
  togglePinTab: (tabId: string) => ipcRenderer.invoke('kinetic:toggle-pin-tab', tabId),
  toggleMuteTab: (tabId: string) => ipcRenderer.invoke('kinetic:toggle-mute-tab', tabId),

  navigate: (input: string) => ipcRenderer.invoke('kinetic:navigate', input),
  goBack: () => ipcRenderer.invoke('kinetic:go-back'),
  goForward: () => ipcRenderer.invoke('kinetic:go-forward'),
  reload: () => ipcRenderer.invoke('kinetic:reload'),
  stop: () => ipcRenderer.invoke('kinetic:stop'),
  goHome: () => ipcRenderer.invoke('kinetic:go-home'),
  toggleDevTools: () => ipcRenderer.invoke('kinetic:toggle-devtools'),

  setRightDrawerOpen: (isOpen: boolean, width?: number) =>
    ipcRenderer.invoke('kinetic:set-right-drawer', isOpen, width),

  getSettings: () => ipcRenderer.invoke('kinetic:get-settings'),
  updateSettings: (partial: Partial<BrowserSettings>) =>
    ipcRenderer.invoke('kinetic:update-settings', partial),
  resetSettings: () => ipcRenderer.invoke('kinetic:reset-settings'),

  minimizeWindow: () => ipcRenderer.invoke('kinetic:window-minimize'),
  maximizeOrRestoreWindow: () => ipcRenderer.invoke('kinetic:window-maximize'),
  closeWindow: () => ipcRenderer.invoke('kinetic:window-close'),

  getInitialState: () => ipcRenderer.invoke('kinetic:get-initial-state'),
  onStateChanged: (callback: (state: BrowserStatePayload) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: BrowserStatePayload): void => {
      callback(payload)
    }
    ipcRenderer.on('kinetic:state-changed', handler)
    return () => {
      ipcRenderer.removeListener('kinetic:state-changed', handler)
    }
  }
}

contextBridge.exposeInMainWorld('kinetic', kineticApi)
