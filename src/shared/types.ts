export type SearchEngineId = 'duckduckgo' | 'google' | 'brave' | 'bing' | 'startpage'

export interface SearchEngineConfig {
  id: SearchEngineId
  name: string
  searchUrlTemplate: string
  homeUrl: string
}

export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngineConfig> = {
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    searchUrlTemplate: 'https://duckduckgo.com/?q=%s',
    homeUrl: 'https://duckduckgo.com'
  },
  brave: {
    id: 'brave',
    name: 'Brave Search',
    searchUrlTemplate: 'https://search.brave.com/search?q=%s',
    homeUrl: 'https://search.brave.com'
  },
  google: {
    id: 'google',
    name: 'Google',
    searchUrlTemplate: 'https://www.google.com/search?q=%s',
    homeUrl: 'https://www.google.com'
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    searchUrlTemplate: 'https://www.bing.com/search?q=%s',
    homeUrl: 'https://www.bing.com'
  },
  startpage: {
    id: 'startpage',
    name: 'Startpage',
    searchUrlTemplate: 'https://www.startpage.com/do/dsearch?query=%s',
    homeUrl: 'https://www.startpage.com'
  }
}

export interface TabState {
  id: string
  title: string
  url: string
  favicon: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  isSecure: boolean
  hasCertError: boolean
  isAudioPlaying: boolean
  isMuted: boolean
  customColor?: string
  isPinned: boolean
}

export interface BrowserSettings {
  searchEngine: SearchEngineId
  homepageUrl: string
  newTabUrl: string
  restorePreviousSession: boolean
  accentColor: string
  chromeHeight: number
  sidebarOpenWidth: number
  enableSmoothScrolling: boolean
}

export const DEFAULT_SETTINGS: BrowserSettings = {
  searchEngine: 'duckduckgo',
  homepageUrl: 'https://duckduckgo.com',
  newTabUrl: 'https://duckduckgo.com',
  restorePreviousSession: true,
  accentColor: '#00f0ff',
  chromeHeight: 84,
  sidebarOpenWidth: 360,
  enableSmoothScrolling: true
}

export interface BrowserStatePayload {
  tabs: TabState[]
  activeTabId: string | null
  isMaximized: boolean
  settings: BrowserSettings
}

export interface KineticAPI {
  // Tab Management
  createTab: (url?: string) => Promise<string>
  closeTab: (tabId: string) => Promise<void>
  switchTab: (tabId: string) => Promise<void>
  duplicateTab: (tabId: string) => Promise<string>
  togglePinTab: (tabId: string) => Promise<void>
  toggleMuteTab: (tabId: string) => Promise<void>

  // Navigation
  navigate: (input: string) => Promise<void>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  reload: () => Promise<void>
  stop: () => Promise<void>
  goHome: () => Promise<void>
  toggleDevTools: () => Promise<void>

  // Layout & Overlays
  setRightDrawerOpen: (isOpen: boolean, width?: number) => Promise<void>

  // Settings
  getSettings: () => Promise<BrowserSettings>
  updateSettings: (partial: Partial<BrowserSettings>) => Promise<BrowserSettings>
  resetSettings: () => Promise<BrowserSettings>

  // Window Controls
  minimizeWindow: () => Promise<void>
  maximizeOrRestoreWindow: () => Promise<void>
  closeWindow: () => Promise<void>

  // State Subscription
  getInitialState: () => Promise<BrowserStatePayload>
  onStateChanged: (callback: (state: BrowserStatePayload) => void) => () => void
}
