import { contextBridge, ipcRenderer } from 'electron'
import {
  BrowserSettings,
  BrowserStatePayload,
  CustomizationProfile,
  KineticAPI,
  PermissionPolicy,
  PermissionType,
  PrivacyConfig,
  SecurityConfig,
  TabCustomStyle
} from '../shared/types'

const kineticApi: KineticAPI = {
  createTab: (url?: string, options?: { isPrivate?: boolean }) =>
    ipcRenderer.invoke('kinetic:create-tab', url, options),
  closeTab: (tabId: string) => ipcRenderer.invoke('kinetic:close-tab', tabId),
  switchTab: (tabId: string) => ipcRenderer.invoke('kinetic:switch-tab', tabId),
  duplicateTab: (tabId: string) => ipcRenderer.invoke('kinetic:duplicate-tab', tabId),
  togglePinTab: (tabId: string) => ipcRenderer.invoke('kinetic:toggle-pin-tab', tabId),
  toggleMuteTab: (tabId: string) => ipcRenderer.invoke('kinetic:toggle-mute-tab', tabId),
  updateTabCustomStyle: (tabId: string, style: TabCustomStyle) =>
    ipcRenderer.invoke('kinetic:update-tab-style', tabId, style),

  navigate: (input: string) => ipcRenderer.invoke('kinetic:navigate', input),
  goBack: () => ipcRenderer.invoke('kinetic:go-back'),
  goForward: () => ipcRenderer.invoke('kinetic:go-forward'),
  reload: () => ipcRenderer.invoke('kinetic:reload'),
  stop: () => ipcRenderer.invoke('kinetic:stop'),
  goHome: () => ipcRenderer.invoke('kinetic:go-home'),
  toggleDevTools: () => ipcRenderer.invoke('kinetic:toggle-devtools'),

  deleteHistoryItem: (id: string) => ipcRenderer.invoke('kinetic:delete-history-item', id),
  clearHistory: () => ipcRenderer.invoke('kinetic:clear-history'),

  addBookmark: (data) => ipcRenderer.invoke('kinetic:add-bookmark', data),
  removeBookmark: (id: string) => ipcRenderer.invoke('kinetic:remove-bookmark', id),
  createBookmarkFolder: (folderName: string) =>
    ipcRenderer.invoke('kinetic:create-bookmark-folder', folderName),

  addQuickLink: (data) => ipcRenderer.invoke('kinetic:add-quick-link', data),
  removeQuickLink: (id: string) => ipcRenderer.invoke('kinetic:remove-quick-link', id),

  pauseDownload: (id: string) => ipcRenderer.invoke('kinetic:pause-download', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('kinetic:resume-download', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('kinetic:cancel-download', id),
  showDownloadInFolder: (id: string) => ipcRenderer.invoke('kinetic:show-download-folder', id),
  clearCompletedDownloads: () => ipcRenderer.invoke('kinetic:clear-downloads'),

  createProfile: (name: string, color: string) =>
    ipcRenderer.invoke('kinetic:create-profile', name, color),
  switchProfile: (profileId: string) => ipcRenderer.invoke('kinetic:switch-profile', profileId),
  deleteProfile: (profileId: string) => ipcRenderer.invoke('kinetic:delete-profile', profileId),

  updateCustomization: (partial: Partial<CustomizationProfile>) =>
    ipcRenderer.invoke('kinetic:update-customization', partial),
  applyThemePreset: (presetId: string) =>
    ipcRenderer.invoke('kinetic:apply-theme-preset', presetId),
  saveCustomTheme: (name: string) => ipcRenderer.invoke('kinetic:save-custom-theme', name),
  deleteCustomTheme: (themeId: string) =>
    ipcRenderer.invoke('kinetic:delete-custom-theme', themeId),
  importCustomizationJson: (jsonString: string) =>
    ipcRenderer.invoke('kinetic:import-customization-json', jsonString),
  resetCustomization: () => ipcRenderer.invoke('kinetic:reset-customization'),

  // Phase 5 Privacy & Security
  updatePrivacyConfig: (partial: Partial<PrivacyConfig>) =>
    ipcRenderer.invoke('kinetic:update-privacy-config', partial),
  toggleDomainWhitelist: (domain: string) =>
    ipcRenderer.invoke('kinetic:toggle-domain-whitelist', domain),
  addCustomBlockRule: (rule: string) =>
    ipcRenderer.invoke('kinetic:add-custom-block-rule', rule),
  removeCustomBlockRule: (rule: string) =>
    ipcRenderer.invoke('kinetic:remove-custom-block-rule', rule),
  toggleRestoreScrubbedElements: () =>
    ipcRenderer.invoke('kinetic:toggle-restore-scrubbed'),
  clearBlockedLogs: () => ipcRenderer.invoke('kinetic:clear-blocked-logs'),
  clearBrowsingData: (options) =>
    ipcRenderer.invoke('kinetic:clear-browsing-data', options),

  updateSecurityConfig: (partial: Partial<SecurityConfig>) =>
    ipcRenderer.invoke('kinetic:update-security-config', partial),
  setSitePermission: (origin: string, permission: PermissionType, policy: PermissionPolicy) =>
    ipcRenderer.invoke('kinetic:set-site-permission', origin, permission, policy),
  removeSitePermission: (id: string) =>
    ipcRenderer.invoke('kinetic:remove-site-permission', id),

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