import { BaseWindow, DownloadItem, session, shell, WebContentsView } from 'electron'
import { randomUUID } from 'crypto'
import * as path from 'path'
import {
  BookmarkItem,
  BrowserSettings,
  BrowserStatePayload,
  CustomizationProfile,
  DownloadEntry,
  KINETIC_NEWTAB_URL,
  QuickLinkItem,
  SavedSessionTab,
  SEARCH_ENGINES,
  TabCustomStyle,
  TabState,
  UserProfile
} from '../shared/types'
import { SettingsStorage } from './storage'

interface ManagedTab {
  state: TabState
  view: WebContentsView
}

export class BrowserManager {
  private baseWindow: BaseWindow
  private uiView: WebContentsView
  private storage: SettingsStorage
  private tabs: Map<string, ManagedTab> = new Map()
  private tabOrder: string[] = []
  private activeTabId: string | null = null
  private rightDrawerOpen: boolean = false
  private rightDrawerWidth: number = 420
  private activeDownloads: Map<string, DownloadItem> = new Map()
  private hookedPartitions: Set<string> = new Set()

  constructor(baseWindow: BaseWindow, uiView: WebContentsView, storage: SettingsStorage) {
    this.baseWindow = baseWindow
    this.uiView = uiView
    this.storage = storage
    this.rightDrawerWidth = storage.getSettings().sidebarOpenWidth

    this.baseWindow.on('resize', () => this.updateLayoutBounds())
    this.baseWindow.on('maximize', () => {
      this.updateLayoutBounds()
      this.broadcastState()
    })
    this.baseWindow.on('unmaximize', () => {
      this.updateLayoutBounds()
      this.broadcastState()
    })
    this.baseWindow.on('close', () => {
      this.persistCurrentSession()
    })
  }

  public initializeStartupTabs(): void {
    const settings = this.storage.getSettings()
    const profileId = this.storage.getActiveProfileId()
    const saved = this.storage.getProfileSession(profileId)

    if (settings.restorePreviousSession && saved && saved.tabs.length > 0) {
      const createdIds: string[] = []
      for (const savedTab of saved.tabs) {
        const urlToLoad =
          savedTab.url === 'https://duckduckgo.com/' || savedTab.url === 'https://duckduckgo.com'
            ? KINETIC_NEWTAB_URL
            : savedTab.url
        const id = this.createTab(urlToLoad, {
          isPrivate: false,
          isPinned: savedTab.isPinned,
          customStyle: savedTab.customStyle,
          skipSessionSave: true
        })
        createdIds.push(id)
      }
      const targetIndex = Math.min(saved.activeIndex, createdIds.length - 1)
      if (createdIds[targetIndex]) {
        this.switchTab(createdIds[targetIndex])
      }
    } else {
      this.createTab(KINETIC_NEWTAB_URL)
    }
  }

  private ensureDownloadListenerForPartition(partitionName: string): void {
    if (this.hookedPartitions.has(partitionName)) return
    this.hookedPartitions.add(partitionName)

    const targetSession = session.fromPartition(partitionName)
    targetSession.on('will-download', (_event, item) => {
      const downloadId = randomUUID()
      const fileName = item.getFilename()
      const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads')
      const savePath = path.join(downloadsDir, fileName)
      item.setSavePath(savePath)

      this.activeDownloads.set(downloadId, item)

      const buildEntry = (statusOverride?: DownloadEntry['status']): DownloadEntry => ({
        id: downloadId,
        fileName,
        url: item.getURL(),
        savePath: item.getSavePath() || savePath,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        status:
          statusOverride ||
          (item.isPaused() ? 'paused' : (item.getState() as DownloadEntry['status'])),
        startedAt: Date.now()
      })

      this.storage.upsertDownload(buildEntry('progressing'))
      this.broadcastState()

      item.on('updated', (_e, state) => {
        const status: DownloadEntry['status'] = item.isPaused()
          ? 'paused'
          : state === 'progressing'
            ? 'progressing'
            : 'interrupted'
        this.storage.upsertDownload(buildEntry(status))
        this.broadcastState()
      })

      item.once('done', (_e, state) => {
        this.activeDownloads.delete(downloadId)
        const finalStatus: DownloadEntry['status'] =
          state === 'completed'
            ? 'completed'
            : state === 'cancelled'
              ? 'cancelled'
              : 'interrupted'
        this.storage.upsertDownload(buildEntry(finalStatus))
        this.broadcastState()
      })
    })
  }

  public resolveInputToUrl(rawInput: string): string {
    const trimmed = rawInput.trim()
    const settings = this.storage.getSettings()
    const engine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.google

    if (!trimmed || trimmed.toLowerCase() === KINETIC_NEWTAB_URL) {
      return KINETIC_NEWTAB_URL
    }

    if (/^(https?:\/\/|file:\/\/|chrome:\/\/|about:)/i.test(trimmed)) {
      return trimmed
    }

    if (/^(localhost(:\d+)?|(\d{1,3}\.){3}\d{1,3}(:\d+)?)(\/.*)?$/i.test(trimmed)) {
      return `http://${trimmed}`
    }

    const isLikelyDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(trimmed)
    if (isLikelyDomain && !trimmed.includes(' ')) {
      return `https://${trimmed}`
    }

    return engine.searchUrlTemplate.replace('%s', encodeURIComponent(trimmed))
  }

  public createTab(
    initialInput?: string,
    options?: {
      isPrivate?: boolean
      isPinned?: boolean
      customStyle?: TabCustomStyle
      skipSessionSave?: boolean
    }
  ): string {
    const settings = this.storage.getSettings()
    const targetUrl = initialInput
      ? this.resolveInputToUrl(initialInput)
      : settings.newTabUrl || KINETIC_NEWTAB_URL
    const isInternalNewTab = targetUrl === KINETIC_NEWTAB_URL

    const tabId = randomUUID()
    const isPrivate = Boolean(options?.isPrivate)
    const profileId = this.storage.getActiveProfileId()

    const partitionName = isPrivate
      ? `kinetic-private-${tabId}`
      : `persist:kinetic-profile-${profileId}`

    this.ensureDownloadListenerForPartition(partitionName)

    const view = new WebContentsView({
      webPreferences: {
        partition: partitionName,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: true,
        backgroundThrottling: true
      }
    })

    const defaultUA = view.webContents.getUserAgent()
    const cleanUA = defaultUA
      .replace(/\sElectron\/[\d.]+/, '')
      .replace(/\skinetic-browser\/[\d.]+/i, '')
    view.webContents.setUserAgent(`${cleanUA} Kinetic/0.4.0`)

    const initialState: TabState = {
      id: tabId,
      title: isPrivate ? 'Private Tab' : 'New Tab',
      url: targetUrl,
      favicon: '',
      isLoading: !isInternalNewTab,
      canGoBack: false,
      canGoForward: false,
      isSecure: true,
      hasCertError: false,
      isAudioPlaying: false,
      isMuted: false,
      isPinned: Boolean(options?.isPinned),
      isPrivate,
      profileId,
      customStyle: options?.customStyle
    }

    this.tabs.set(tabId, { state: initialState, view })
    this.tabOrder.push(tabId)
    this.attachWebContentsListeners(tabId, view)

    this.switchTab(tabId)

    if (!isInternalNewTab) {
      view.webContents.loadURL(targetUrl).catch((err) => {
        console.warn(`[KineticBrowser] Navigation warning for ${targetUrl}:`, err.message)
      })
    }

    if (!options?.skipSessionSave) {
      this.persistCurrentSession()
    }

    return tabId
  }

  public updateTabCustomStyle(tabId: string, style: TabCustomStyle): void {
    const tab = this.tabs.get(tabId)
    if (!tab) return
    tab.state.customStyle = {
      ...tab.state.customStyle,
      ...style
    }
    this.persistCurrentSession()
    this.broadcastState()
  }

  private attachWebContentsListeners(tabId: string, view: WebContentsView): void {
    const wc = view.webContents

    const syncNavigationState = (recordHistory = false): void => {
      const tab = this.tabs.get(tabId)
      if (!tab) return

      const rawWcUrl = wc.getURL()
      if (!rawWcUrl || rawWcUrl === 'about:blank') {
        if (tab.state.url === KINETIC_NEWTAB_URL) {
          this.broadcastState()
          return
        }
      }

      const currentUrl = rawWcUrl || tab.state.url
      tab.state.url = currentUrl
      tab.state.title =
        currentUrl === KINETIC_NEWTAB_URL
          ? tab.state.isPrivate
            ? 'Private Tab'
            : 'New Tab'
          : wc.getTitle() || currentUrl || 'New Tab'
      tab.state.canGoBack = wc.navigationHistory.canGoBack()
      tab.state.canGoForward = wc.navigationHistory.canGoForward()
      tab.state.isSecure =
        currentUrl === KINETIC_NEWTAB_URL ||
        (currentUrl.startsWith('https://') && !tab.state.hasCertError)
      tab.state.isMuted = wc.isAudioMuted()

      if (recordHistory && !tab.state.isPrivate && currentUrl.startsWith('http')) {
        this.storage.recordHistoryVisit({
          url: currentUrl,
          title: tab.state.title,
          favicon: tab.state.favicon,
          profileId: tab.state.profileId
        })
      }

      this.updateLayoutBounds()
      this.persistCurrentSession()
      this.broadcastState()
    }

    wc.on('did-start-loading', () => {
      const tab = this.tabs.get(tabId)
      if (!tab || tab.state.url === KINETIC_NEWTAB_URL) return
      tab.state.isLoading = true
      tab.state.hasCertError = false
      syncNavigationState(false)
    })

    wc.on('did-stop-loading', () => {
      const tab = this.tabs.get(tabId)
      if (!tab || tab.state.url === KINETIC_NEWTAB_URL) return
      tab.state.isLoading = false
      syncNavigationState(true)
    })

    wc.on('did-navigate', () => syncNavigationState(true))
    wc.on('did-navigate-in-page', () => syncNavigationState(false))

    wc.on('page-title-updated', (_event, title) => {
      const tab = this.tabs.get(tabId)
      if (!tab || tab.state.url === KINETIC_NEWTAB_URL) return
      tab.state.title = title
      if (!tab.state.isPrivate && tab.state.url.startsWith('http')) {
        this.storage.recordHistoryVisit({
          url: tab.state.url,
          title,
          favicon: tab.state.favicon,
          profileId: tab.state.profileId
        })
      }
      this.persistCurrentSession()
      this.broadcastState()
    })

    wc.on('page-favicon-updated', (_event, favicons) => {
      const tab = this.tabs.get(tabId)
      if (!tab || favicons.length === 0 || tab.state.url === KINETIC_NEWTAB_URL) return
      tab.state.favicon = favicons[0]
      this.broadcastState()
    })

    wc.on('media-started-playing', () => {
      const tab = this.tabs.get(tabId)
      if (!tab) return
      tab.state.isAudioPlaying = true
      this.broadcastState()
    })

    wc.on('media-paused', () => {
      const tab = this.tabs.get(tabId)
      if (!tab) return
      tab.state.isAudioPlaying = false
      this.broadcastState()
    })

    wc.on('certificate-error', (event, url, error, _certificate, callback) => {
      event.preventDefault()
      callback(false)
      const tab = this.tabs.get(tabId)
      if (tab) {
        tab.state.hasCertError = true
        tab.state.isSecure = false
        tab.state.isLoading = false
        this.broadcastState()
      }
      console.warn(`[Security] Blocked invalid TLS certificate on ${url}: ${error}`)
    })

    wc.setWindowOpenHandler((details) => {
      const tab = this.tabs.get(tabId)
      if (details.url && details.url !== 'about:blank') {
        this.createTab(details.url, { isPrivate: tab?.state.isPrivate })
      }
      return { action: 'deny' }
    })
  }

  private persistCurrentSession(): void {
    const profileId = this.storage.getActiveProfileId()
    const nonPrivateTabs: SavedSessionTab[] = []
    let activeIdx = 0

    for (const id of this.tabOrder) {
      const tab = this.tabs.get(id)
      if (tab && !tab.state.isPrivate && tab.state.profileId === profileId) {
        if (id === this.activeTabId) {
          activeIdx = nonPrivateTabs.length
        }
        nonPrivateTabs.push({
          url: tab.state.url,
          title: tab.state.title,
          isPinned: tab.state.isPinned,
          customStyle: tab.state.customStyle
        })
      }
    }

    if (nonPrivateTabs.length > 0) {
      this.storage.saveProfileSession(profileId, nonPrivateTabs, activeIdx)
    }
  }

  public switchTab(tabId: string): void {
    const target = this.tabs.get(tabId)
    if (!target) return

    if (this.activeTabId && this.activeTabId !== tabId) {
      const previous = this.tabs.get(this.activeTabId)
      if (previous) {
        try {
          this.baseWindow.contentView.removeChildView(previous.view)
        } catch {
          // Ignore
        }
      }
    }

    this.activeTabId = tabId
    this.baseWindow.contentView.addChildView(target.view)
    this.updateLayoutBounds()
    if (target.state.url !== KINETIC_NEWTAB_URL) {
      target.view.webContents.focus()
    } else {
      this.uiView.webContents.focus()
    }
    this.persistCurrentSession()
    this.broadcastState()
  }

  public closeTab(tabId: string): void {
    const target = this.tabs.get(tabId)
    if (!target) return

    const index = this.tabOrder.indexOf(tabId)
    if (index !== -1) {
      this.tabOrder.splice(index, 1)
    }

    try {
      this.baseWindow.contentView.removeChildView(target.view)
    } catch {
      // Ignore
    }

    if (target.state.isPrivate) {
      target.view.webContents.session.clearStorageData().catch(() => {})
    }

    target.view.webContents.close()
    this.tabs.delete(tabId)

    if (this.tabOrder.length === 0) {
      this.activeTabId = null
      this.createTab(KINETIC_NEWTAB_URL)
      return
    }

    if (this.activeTabId === tabId) {
      const nextIndex = Math.min(index, this.tabOrder.length - 1)
      this.switchTab(this.tabOrder[nextIndex])
    } else {
      this.persistCurrentSession()
      this.broadcastState()
    }
  }

  public duplicateTab(tabId: string): string {
    const source = this.tabs.get(tabId)
    return this.createTab(source?.state.url, {
      isPrivate: source?.state.isPrivate,
      customStyle: source?.state.customStyle
    })
  }

  public togglePinTab(tabId: string): void {
    const target = this.tabs.get(tabId)
    if (!target) return
    target.state.isPinned = !target.state.isPinned

    const pinned = this.tabOrder.filter((id) => this.tabs.get(id)?.state.isPinned)
    const unpinned = this.tabOrder.filter((id) => !this.tabs.get(id)?.state.isPinned)
    this.tabOrder = [...pinned, ...unpinned]
    this.persistCurrentSession()
    this.broadcastState()
  }

  public toggleMuteTab(tabId: string): void {
    const target = this.tabs.get(tabId)
    if (!target) return
    const nextMute = !target.view.webContents.isAudioMuted()
    target.view.webContents.setAudioMuted(nextMute)
    target.state.isMuted = nextMute
    this.broadcastState()
  }

  public navigateActiveTab(rawInput: string): void {
    if (!this.activeTabId) {
      this.createTab(rawInput)
      return
    }
    const active = this.tabs.get(this.activeTabId)
    if (!active) return

    const url = this.resolveInputToUrl(rawInput)
    active.state.url = url

    if (url === KINETIC_NEWTAB_URL) {
      active.state.title = active.state.isPrivate ? 'Private Tab' : 'New Tab'
      active.state.favicon = ''
      active.state.isLoading = false
      active.state.isSecure = true
      this.updateLayoutBounds()
      this.broadcastState()
      return
    }

    this.updateLayoutBounds()
    active.view.webContents.loadURL(url).catch((err) => {
      console.warn(`[KineticBrowser] Failed to load URL ${url}:`, err.message)
    })
    active.view.webContents.focus()
    this.broadcastState()
  }

  public goBack(): void {
    const active = this.getActiveTab()
    if (active && active.view.webContents.navigationHistory.canGoBack()) {
      active.view.webContents.navigationHistory.goBack()
    }
  }

  public goForward(): void {
    const active = this.getActiveTab()
    if (active && active.view.webContents.navigationHistory.canGoForward()) {
      active.view.webContents.navigationHistory.goForward()
    }
  }

  public reload(): void {
    const active = this.getActiveTab()
    if (active && active.state.url !== KINETIC_NEWTAB_URL) {
      active.view.webContents.reload()
    }
  }

  public stop(): void {
    this.getActiveTab()?.view.webContents.stop()
  }

  public goHome(): void {
    this.navigateActiveTab(this.storage.getSettings().homepageUrl)
  }

  public toggleActiveTabDevTools(): void {
    const active = this.getActiveTab()
    if (!active) return
    const targetWc =
      active.state.url === KINETIC_NEWTAB_URL
        ? this.uiView.webContents
        : active.view.webContents
    if (targetWc.isDevToolsOpened()) {
      targetWc.closeDevTools()
    } else {
      targetWc.openDevTools({ mode: 'right' })
    }
  }

  public deleteHistoryItem(id: string): void {
    this.storage.deleteHistoryItem(id)
    this.broadcastState()
  }

  public clearHistory(): void {
    this.storage.clearHistory()
    this.broadcastState()
  }

  public addBookmark(data: {
    title: string
    url: string
    favicon?: string
    folder?: string
  }): BookmarkItem {
    const item = this.storage.addBookmark(data)
    this.broadcastState()
    return item
  }

  public removeBookmark(id: string): void {
    this.storage.removeBookmark(id)
    this.broadcastState()
  }

  public createBookmarkFolder(folderName: string): string[] {
    const folders = this.storage.createBookmarkFolder(folderName)
    this.broadcastState()
    return folders
  }

  public addQuickLink(data: { title: string; url: string }): QuickLinkItem {
    const item = this.storage.addQuickLink(data)
    this.broadcastState()
    return item
  }

  public removeQuickLink(id: string): void {
    this.storage.removeQuickLink(id)
    this.broadcastState()
  }

  public pauseDownload(id: string): void {
    const item = this.activeDownloads.get(id)
    if (item && !item.isPaused()) {
      item.pause()
    }
  }

  public resumeDownload(id: string): void {
    const item = this.activeDownloads.get(id)
    if (item && item.isPaused()) {
      item.resume()
    }
  }

  public cancelDownload(id: string): void {
    const item = this.activeDownloads.get(id)
    if (item) {
      item.cancel()
    }
  }

  public showDownloadInFolder(id: string): void {
    const entry = this.storage.getDownloads().find((d) => d.id === id)
    if (entry && entry.savePath) {
      shell.showItemInFolder(entry.savePath)
    }
  }

  public clearCompletedDownloads(): void {
    this.storage.clearCompletedDownloads()
    this.broadcastState()
  }

  public createProfile(name: string, color: string): UserProfile {
    const created = this.storage.createProfile(name, color)
    this.broadcastState()
    return created
  }

  public switchProfile(profileId: string): void {
    if (profileId === this.storage.getActiveProfileId()) return

    this.persistCurrentSession()

    for (const id of [...this.tabOrder]) {
      const tab = this.tabs.get(id)
      if (tab) {
        try {
          this.baseWindow.contentView.removeChildView(tab.view)
        } catch {
          // Ignore
        }
        tab.view.webContents.close()
      }
    }
    this.tabs.clear()
    this.tabOrder = []
    this.activeTabId = null

    this.storage.setActiveProfileId(profileId)
    this.initializeStartupTabs()
    this.broadcastState()
  }

  public deleteProfile(profileId: string): void {
    if (profileId === 'default') return
    const wasActive = this.storage.getActiveProfileId() === profileId
    this.storage.deleteProfile(profileId)
    if (wasActive) {
      this.switchProfile('default')
    } else {
      this.broadcastState()
    }
  }

  // Phase 4 Customization Handlers
  public updateCustomization(partial: Partial<CustomizationProfile>): CustomizationProfile {
    const updated = this.storage.updateCustomization(partial)
    this.updateLayoutBounds()
    this.broadcastState()
    return updated
  }

  public applyThemePreset(presetId: string): CustomizationProfile {
    const updated = this.storage.applyThemePreset(presetId)
    this.updateLayoutBounds()
    this.broadcastState()
    return updated
  }

  public saveCustomTheme(name: string): CustomizationProfile {
    const saved = this.storage.saveCustomTheme(name)
    this.broadcastState()
    return saved
  }

  public deleteCustomTheme(themeId: string): void {
    this.storage.deleteCustomTheme(themeId)
    this.updateLayoutBounds()
    this.broadcastState()
  }

  public importCustomizationJson(jsonString: string): CustomizationProfile {
    const imported = this.storage.importCustomizationJson(jsonString)
    this.updateLayoutBounds()
    this.broadcastState()
    return imported
  }

  public resetCustomization(): CustomizationProfile {
    const reset = this.storage.resetCustomization()
    this.updateLayoutBounds()
    this.broadcastState()
    return reset
  }

  public setRightDrawerOpen(isOpen: boolean, width?: number): void {
    this.rightDrawerOpen = isOpen
    if (typeof width === 'number' && width >= 260 && width <= 680) {
      this.rightDrawerWidth = width
    } else {
      this.rightDrawerWidth = this.storage.getSettings().sidebarOpenWidth
    }
    this.updateLayoutBounds()
  }

  public updateLayoutBounds(): void {
    if (this.baseWindow.isDestroyed()) return
    const bounds = this.baseWindow.getContentBounds()
    const settings = this.storage.getSettings()
    const custom = this.storage.getCustomization()

    this.uiView.setBounds({
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height
    })

    const active = this.getActiveTab()
    if (!active) return

    if (active.state.url === KINETIC_NEWTAB_URL) {
      active.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
      return
    }

    const isVerticalTabs = custom.tabs.orientation === 'vertical'
    const isBottomTaskbar = custom.taskbar.position === 'bottom'

    const topTabStripHeight = isVerticalTabs ? 36 : Math.max(36, custom.tabs.tabHeight + 10)
    const navbarHeight = custom.taskbar.height
    const bookmarksHeight = settings.showBookmarksBar ? 30 : 0

    const topOffset = isBottomTaskbar
      ? topTabStripHeight + bookmarksHeight
      : topTabStripHeight + navbarHeight + bookmarksHeight

    const bottomOffset = isBottomTaskbar ? navbarHeight : 0
    const leftOffset = isVerticalTabs ? custom.tabs.verticalSidebarWidth : 0
    const rightOffset = this.rightDrawerOpen ? this.rightDrawerWidth : 0

    const contentWidth = Math.max(200, bounds.width - leftOffset - rightOffset)
    const contentHeight = Math.max(100, bounds.height - topOffset - bottomOffset)

    active.view.setBounds({
      x: leftOffset,
      y: topOffset,
      width: contentWidth,
      height: contentHeight
    })
  }

  public updateSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    const updated = this.storage.updateSettings(partial)
    this.rightDrawerWidth = updated.sidebarOpenWidth
    this.updateLayoutBounds()
    this.broadcastState()
    return updated
  }

  public resetSettings(): BrowserSettings {
    const defaults = this.storage.resetSettings()
    this.rightDrawerWidth = defaults.sidebarOpenWidth
    this.updateLayoutBounds()
    this.broadcastState()
    return defaults
  }

  private getActiveTab(): ManagedTab | undefined {
    if (!this.activeTabId) return undefined
    return this.tabs.get(this.activeTabId)
  }

  public getStatePayload(): BrowserStatePayload {
    const orderedTabs: TabState[] = []
    for (const id of this.tabOrder) {
      const tab = this.tabs.get(id)
      if (tab) {
        orderedTabs.push({ ...tab.state })
      }
    }

    return {
      tabs: orderedTabs,
      activeTabId: this.activeTabId,
      isMaximized: this.baseWindow.isMaximized(),
      settings: this.storage.getSettings(),
      customization: this.storage.getCustomization(),
      savedThemes: this.storage.getAllThemes(),
      history: this.storage.getHistory(),
      bookmarks: this.storage.getBookmarks(),
      bookmarkFolders: this.storage.getBookmarkFolders(),
      quickLinks: this.storage.getQuickLinks(),
      downloads: this.storage.getDownloads(),
      profiles: this.storage.getProfiles(),
      activeProfileId: this.storage.getActiveProfileId()
    }
  }

  public broadcastState(): void {
    if (this.uiView.webContents.isDestroyed()) return
    this.uiView.webContents.send('kinetic:state-changed', this.getStatePayload())
  }
}