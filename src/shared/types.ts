export type SearchEngineId = 'duckduckgo' | 'google' | 'brave' | 'bing' | 'startpage'

export type DrawerPanelId = 'none' | 'bookmarks' | 'history' | 'downloads' | 'profiles' | 'settings'

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
  isPinned: boolean
  isPrivate: boolean
  profileId: string
  customColor?: string
}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  favicon: string
  visitedAt: number
  visitCount: number
  profileId: string
}

export interface BookmarkItem {
  id: string
  title: string
  url: string
  favicon: string
  folder: string
  createdAt: number
}

export type DownloadStatus = 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused'

export interface DownloadEntry {
  id: string
  fileName: string
  url: string
  savePath: string
  receivedBytes: number
  totalBytes: number
  status: DownloadStatus
  startedAt: number
}

export interface UserProfile {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface SavedSessionTab {
  url: string
  title: string
  isPinned: boolean
}

export interface BrowserSettings {
  searchEngine: SearchEngineId
  homepageUrl: string
  newTabUrl: string
  restorePreviousSession: boolean
  showBookmarksBar: boolean
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
  showBookmarksBar: true,
  accentColor: '#00f0ff',
  chromeHeight: 84,
  sidebarOpenWidth: 380,
  enableSmoothScrolling: true
}

export interface BrowserStatePayload {
  tabs: TabState[]
  activeTabId: string | null
  isMaximized: boolean
  settings: BrowserSettings
  history: HistoryEntry[]
  bookmarks: BookmarkItem[]
  bookmarkFolders: string[]
  downloads: DownloadEntry[]
  profiles: UserProfile[]
  activeProfileId: string
}

export interface KineticAPI {
  // Tab Management
  createTab: (url?: string, options?: { isPrivate?: boolean }) => Promise<string>
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

  // History Subsystem
  deleteHistoryItem: (id: string) => Promise<void>
  clearHistory: () => Promise<void>

  // Bookmarks Subsystem
  addBookmark: (data: { title: string; url: string; favicon?: string; folder?: string }) => Promise<BookmarkItem>
  removeBookmark: (id: string) => Promise<void>
  createBookmarkFolder: (folderName: string) => Promise<string[]>

  // Downloads Subsystem
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  showDownloadInFolder: (id: string) => Promise<void>
  clearCompletedDownloads: () => Promise<void>

  // Profiles Subsystem
  createProfile: (name: string, color: string) => Promise<UserProfile>
  switchProfile: (profileId: string) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>

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