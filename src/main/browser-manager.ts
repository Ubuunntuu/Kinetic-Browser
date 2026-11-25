import { BaseWindow, WebContentsView } from 'electron'
import { randomUUID } from 'crypto'
import {
  BrowserSettings,
  BrowserStatePayload,
  SEARCH_ENGINES,
  TabState
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
  private rightDrawerWidth: number = 360

  constructor(baseWindow: BaseWindow, uiView: WebContentsView, storage: SettingsStorage) {
    this.baseWindow = baseWindow
    this.uiView = uiView
    this.storage = storage

    this.baseWindow.on('resize', () => this.updateLayoutBounds())
    this.baseWindow.on('maximize', () => {
      this.updateLayoutBounds()
      this.broadcastState()
    })
    this.baseWindow.on('unmaximize', () => {
      this.updateLayoutBounds()
      this.broadcastState()
    })
  }

  public resolveInputToUrl(rawInput: string): string {
    const trimmed = rawInput.trim()
    const settings = this.storage.getSettings()
    const engine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.duckduckgo

    if (!trimmed) {
      return settings.newTabUrl || engine.homeUrl
    }

    // Explicit protocol
    if (/^(https?:\/\/|file:\/\/|chrome:\/\/|about:)/i.test(trimmed)) {
      return trimmed
    }

    // Localhost or IPv4 address
    if (/^(localhost(:\d+)?|(\d{1,3}\.){3}\d{1,3}(:\d+)?)(\/.*)?$/i.test(trimmed)) {
      return `http://${trimmed}`
    }

    // Domain pattern without spaces (e.g., github.com, reddit.com/r/pcgaming)
    const isLikelyDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(trimmed)
    if (isLikelyDomain && !trimmed.includes(' ')) {
      return `https://${trimmed}`
    }

    // Fallback to configured search engine query
    return engine.searchUrlTemplate.replace('%s', encodeURIComponent(trimmed))
  }

  public createTab(initialInput?: string): string {
    const settings = this.storage.getSettings()
    const targetUrl = this.resolveInputToUrl(initialInput || settings.newTabUrl)
    const tabId = randomUUID()

    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: true,
        backgroundThrottling: true
      }
    })

    // Set a modern Chromium user-agent without Electron token leakage
    const defaultUA = view.webContents.getUserAgent()
    const cleanUA = defaultUA
      .replace(/\sElectron\/[\d.]+/, '')
      .replace(/\skinetic-browser\/[\d.]+/i, '')
    view.webContents.setUserAgent(`${cleanUA} Kinetic/0.2.0`)

    const initialState: TabState = {
      id: tabId,
      title: 'New Tab',
      url: targetUrl,
      favicon: '',
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      isSecure: targetUrl.startsWith('https://'),
      hasCertError: false,
      isAudioPlaying: false,
      isMuted: false,
      isPinned: false
    }

    const managedTab: ManagedTab = {
      state: initialState,
      view
    }

    this.tabs.set(tabId, managedTab)
    this.tabOrder.push(tabId)
    this.attachWebContentsListeners(tabId, view)

    // Switch immediately to the new tab
    this.switchTab(tabId)
    view.webContents.loadURL(targetUrl).catch((err) => {
      console.warn(`[KineticBrowser] Navigation load warning for ${targetUrl}:`, err.message)
    })

    return tabId
  }

  private attachWebContentsListeners(tabId: string, view: WebContentsView): void {
    const wc = view.webContents

    const syncNavigationState = (): void => {
      const tab = this.tabs.get(tabId)
      if (!tab) return
      const currentUrl = wc.getURL() || tab.state.url
      tab.state.url = currentUrl
      tab.state.title = wc.getTitle() || currentUrl || 'New Tab'
      tab.state.canGoBack = wc.navigationHistory.canGoBack()
      tab.state.canGoForward = wc.navigationHistory.canGoForward()
      tab.state.isSecure = currentUrl.startsWith('https://') && !tab.state.hasCertError
      tab.state.isMuted = wc.isAudioMuted()
      this.broadcastState()
    }

    wc.on('did-start-loading', () => {
      const tab = this.tabs.get(tabId)
      if (!tab) return
      tab.state.isLoading = true
      tab.state.hasCertError = false
      syncNavigationState()
    })

    wc.on('did-stop-loading', () => {
      const tab = this.tabs.get(tabId)
      if (!tab) return
      tab.state.isLoading = false
      syncNavigationState()
    })

    wc.on('did-navigate', () => syncNavigationState())
    wc.on('did-navigate-in-page', () => syncNavigationState())
    wc.on('page-title-updated', (_event, title) => {
      const tab = this.tabs.get(tabId)
      if (!tab) return
      tab.state.title = title
      this.broadcastState()
    })

    wc.on('page-favicon-updated', (_event, favicons) => {
      const tab = this.tabs.get(tabId)
      if (!tab || favicons.length === 0) return
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
      // Rule 8: Never bypass certificate errors silently
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

    // Open target="_blank" and window.open links inside a new Kinetic tab
    wc.setWindowOpenHandler((details) => {
      if (details.url && details.url !== 'about:blank') {
        this.createTab(details.url)
      }
      return { action: 'deny' }
    })
  }

  public switchTab(tabId: string): void {
    const target = this.tabs.get(tabId)
    if (!target) return

    // Detach previous active tab view from compositor
    if (this.activeTabId && this.activeTabId !== tabId) {
      const previous = this.tabs.get(this.activeTabId)
      if (previous) {
        try {
          this.baseWindow.contentView.removeChildView(previous.view)
        } catch {
          // Ignore if not attached
        }
      }
    }

    this.activeTabId = tabId
    this.baseWindow.contentView.addChildView(target.view)
    this.updateLayoutBounds()
    target.view.webContents.focus()
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
      // Ignore if not attached
    }

    target.view.webContents.close()
    this.tabs.delete(tabId)

    if (this.tabOrder.length === 0) {
      this.activeTabId = null
      this.createTab()
      return
    }

    if (this.activeTabId === tabId) {
      const nextIndex = Math.min(index, this.tabOrder.length - 1)
      this.switchTab(this.tabOrder[nextIndex])
    } else {
      this.broadcastState()
    }
  }

  public duplicateTab(tabId: string): string {
    const source = this.tabs.get(tabId)
    const url = source ? source.state.url : undefined
    return this.createTab(url)
  }

  public togglePinTab(tabId: string): void {
    const target = this.tabs.get(tabId)
    if (!target) return
    target.state.isPinned = !target.state.isPinned

    // Sort pinned tabs to the front of tabOrder
    const pinned = this.tabOrder.filter((id) => this.tabs.get(id)?.state.isPinned)
    const unpinned = this.tabOrder.filter((id) => !this.tabs.get(id)?.state.isPinned)
    this.tabOrder = [...pinned, ...unpinned]
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
    active.view.webContents.loadURL(url).catch((err) => {
      console.warn(`[KineticBrowser] Failed to load URL ${url}:`, err.message)
    })
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
    if (active) {
      active.view.webContents.reload()
    }
  }

  public stop(): void {
    const active = this.getActiveTab()
    if (active) {
      active.view.webContents.stop()
    }
  }

  public goHome(): void {
    const settings = this.storage.getSettings()
    this.navigateActiveTab(settings.homepageUrl)
  }

  public toggleActiveTabDevTools(): void {
    const active = this.getActiveTab()
    if (!active) return
    if (active.view.webContents.isDevToolsOpened()) {
      active.view.webContents.closeDevTools()
    } else {
      active.view.webContents.openDevTools({ mode: 'right' })
    }
  }

  public setRightDrawerOpen(isOpen: boolean, width?: number): void {
    this.rightDrawerOpen = isOpen
    if (typeof width === 'number' && width >= 260 && width <= 640) {
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
    const chromeHeight = settings.chromeHeight || 84

    // UI Shell always covers full window so drawers and bars can render anywhere
    this.uiView.setBounds({
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height
    })

    const active = this.getActiveTab()
    if (!active) return

    const rightInset = this.rightDrawerOpen ? this.rightDrawerWidth : 0
    const contentWidth = Math.max(200, bounds.width - rightInset)
    const contentHeight = Math.max(100, bounds.height - chromeHeight)

    active.view.setBounds({
      x: 0,
      y: chromeHeight,
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
      settings: this.storage.getSettings()
    }
  }

  public broadcastState(): void {
    if (this.uiView.webContents.isDestroyed()) return
    this.uiView.webContents.send('kinetic:state-changed', this.getStatePayload())
  }
}
