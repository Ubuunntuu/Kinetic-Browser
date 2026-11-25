export type SearchEngineId = 'duckduckgo' | 'google' | 'brave' | 'bing' | 'startpage'

export type DrawerPanelId =
  | 'none'
  | 'customize'
  | 'bookmarks'
  | 'history'
  | 'downloads'
  | 'profiles'
  | 'settings'

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

export const KINETIC_NEWTAB_URL = 'kinetic://newtab'

export interface TabCustomStyle {
  customTitle?: string
  customColor?: string
  customBg?: string
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
  customStyle?: TabCustomStyle
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

export interface QuickLinkItem {
  id: string
  title: string
  url: string
  iconUrl: string
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
  customStyle?: TabCustomStyle
}

// ============================================================================
// PHASE 4: EXTREME CUSTOMIZATION ENGINE SCHEMA
// ============================================================================

export type SoundPackId = 'sci-fi' | 'mechanical' | 'minimal' | 'retro'
export type SoundEventId =
  | 'click'
  | 'tabOpen'
  | 'tabClose'
  | 'tabSwitch'
  | 'navigate'
  | 'download'

export interface SoundCustomization {
  enabled: boolean
  masterVolume: number
  pack: SoundPackId
  events: Record<SoundEventId, { enabled: boolean; volume: number; customAudioDataUrl?: string }>
}

export interface AppearanceCustomization {
  bgPrimary: string
  bgElevated: string
  bgGlassOpacity: number
  textPrimary: string
  textSecondary: string
  accentPrimary: string
  accentSecondary: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  glowIntensity: number
  fontFamily: string
  fontSize: number
  uiScale: number
  enableAnimations: boolean
  rgbCycleMode: boolean
}

export interface TaskbarCustomization {
  position: 'top' | 'bottom'
  height: number
  bgColor: string
  buttonSize: number
  buttonSpacing: number
  buttonRadius: number
  showHomeButton: boolean
  showPinButton: boolean
  showDuplicateButton: boolean
  showPrivateButton: boolean
  showBookmarksButton: boolean
  showHistoryButton: boolean
  showDownloadsButton: boolean
  showProfilesButton: boolean
  showDevToolsButton: boolean
}

export interface TabsCustomization {
  orientation: 'horizontal' | 'vertical'
  verticalSidebarWidth: number
  tabWidth: number
  tabHeight: number
  tabSpacing: number
  tabRadius: number
  activeTabBg: string
  inactiveTabBg: string
  activeTabBorderColor: string
}

export interface SearchBarCustomization {
  widthPercent: number
  height: number
  alignment: 'left' | 'center' | 'right'
  bgColor: string
  textColor: string
  borderColor: string
  borderRadius: number
  borderWidth: number
  paddingHorizontal: number
  showSecurityBadge: boolean
}

export interface CustomizationProfile {
  id: string
  name: string
  isBuiltIn?: boolean
  appearance: AppearanceCustomization
  taskbar: TaskbarCustomization
  tabs: TabsCustomization
  searchBar: SearchBarCustomization
  sounds: SoundCustomization
  customCss: string
}

export const DEFAULT_SOUND_CONFIG: SoundCustomization = {
  enabled: false,
  masterVolume: 0.45,
  pack: 'sci-fi',
  events: {
    click: { enabled: true, volume: 0.5 },
    tabOpen: { enabled: true, volume: 0.65 },
    tabClose: { enabled: true, volume: 0.6 },
    tabSwitch: { enabled: true, volume: 0.5 },
    navigate: { enabled: true, volume: 0.6 },
    download: { enabled: true, volume: 0.8 }
  }
}

export const KINETIC_DARK_PRESET: CustomizationProfile = {
  id: 'kinetic-dark',
  name: 'Kinetic Dark',
  isBuiltIn: true,
  appearance: {
    bgPrimary: '#090a0f',
    bgElevated: '#11131c',
    bgGlassOpacity: 0.92,
    textPrimary: '#f0f3f8',
    textSecondary: '#8c95aa',
    accentPrimary: '#00f0ff',
    accentSecondary: '#b537f2',
    borderColor: '#232738',
    borderWidth: 1,
    borderRadius: 8,
    glowIntensity: 0.16,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: 13,
    uiScale: 100,
    enableAnimations: true,
    rgbCycleMode: false
  },
  taskbar: {
    position: 'top',
    height: 42,
    bgColor: '#0e1018',
    buttonSize: 30,
    buttonSpacing: 4,
    buttonRadius: 6,
    showHomeButton: true,
    showPinButton: true,
    showDuplicateButton: true,
    showPrivateButton: true,
    showBookmarksButton: true,
    showHistoryButton: true,
    showDownloadsButton: true,
    showProfilesButton: true,
    showDevToolsButton: true
  },
  tabs: {
    orientation: 'horizontal',
    verticalSidebarWidth: 210,
    tabWidth: 200,
    tabHeight: 30,
    tabSpacing: 4,
    tabRadius: 6,
    activeTabBg: '#202436',
    inactiveTabBg: '#121520',
    activeTabBorderColor: '#00f0ff'
  },
  searchBar: {
    widthPercent: 100,
    height: 32,
    alignment: 'center',
    bgColor: '#07080c',
    textColor: '#f0f3f8',
    borderColor: '#232738',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    showSecurityBadge: true
  },
  sounds: DEFAULT_SOUND_CONFIG,
  customCss: '/* Custom Browser UI CSS - Live Applied */\n'
}

function createPreset(
  id: string,
  name: string,
  overrides: {
    bgPrimary: string
    bgElevated: string
    textPrimary?: string
    textSecondary?: string
    accentPrimary: string
    accentSecondary: string
    borderColor: string
    activeTabBg: string
    inactiveTabBg: string
    taskbarBg: string
    searchBg: string
    borderRadius?: number
    rgbCycleMode?: boolean
  }
): CustomizationProfile {
  return {
    ...KINETIC_DARK_PRESET,
    id,
    name,
    isBuiltIn: true,
    appearance: {
      ...KINETIC_DARK_PRESET.appearance,
      bgPrimary: overrides.bgPrimary,
      bgElevated: overrides.bgElevated,
      textPrimary: overrides.textPrimary || '#f0f3f8',
      textSecondary: overrides.textSecondary || '#8c95aa',
      accentPrimary: overrides.accentPrimary,
      accentSecondary: overrides.accentSecondary,
      borderColor: overrides.borderColor,
      borderRadius: overrides.borderRadius ?? 8,
      rgbCycleMode: Boolean(overrides.rgbCycleMode)
    },
    taskbar: {
      ...KINETIC_DARK_PRESET.taskbar,
      bgColor: overrides.taskbarBg,
      buttonRadius: overrides.borderRadius ?? 6
    },
    tabs: {
      ...KINETIC_DARK_PRESET.tabs,
      activeTabBg: overrides.activeTabBg,
      inactiveTabBg: overrides.inactiveTabBg,
      activeTabBorderColor: overrides.accentPrimary,
      tabRadius: overrides.borderRadius ?? 6
    },
    searchBar: {
      ...KINETIC_DARK_PRESET.searchBar,
      bgColor: overrides.searchBg,
      textColor: overrides.textPrimary || '#f0f3f8',
      borderColor: overrides.borderColor,
      borderRadius: overrides.borderRadius ?? 8
    }
  }
}

export const BUILTIN_THEME_PRESETS: CustomizationProfile[] = [
  KINETIC_DARK_PRESET,
  createPreset('kinetic-light', 'Kinetic Light', {
    bgPrimary: '#f1f5f9',
    bgElevated: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    accentPrimary: '#0284c7',
    accentSecondary: '#6366f1',
    borderColor: '#cbd5e1',
    activeTabBg: '#e2e8f0',
    inactiveTabBg: '#f8fafc',
    taskbarBg: '#f8fafc',
    searchBg: '#ffffff'
  }),
  createPreset('cyberpunk', 'Cyberpunk', {
    bgPrimary: '#0b0711',
    bgElevated: '#160d24',
    accentPrimary: '#fcee0a',
    accentSecondary: '#ff0055',
    borderColor: '#3a1c54',
    activeTabBg: '#27123d',
    inactiveTabBg: '#130a1e',
    taskbarBg: '#10091a',
    searchBg: '#08040d',
    borderRadius: 2
  }),
  createPreset('midnight', 'Midnight', {
    bgPrimary: '#040711',
    bgElevated: '#0a1024',
    accentPrimary: '#3b82f6',
    accentSecondary: '#60a5fa',
    borderColor: '#172554',
    activeTabBg: '#172554',
    inactiveTabBg: '#080d1e',
    taskbarBg: '#070b19',
    searchBg: '#03050c'
  }),
  createPreset('crimson', 'Crimson', {
    bgPrimary: '#0c0507',
    bgElevated: '#190a0e',
    accentPrimary: '#ff1e42',
    accentSecondary: '#ff6b81',
    borderColor: '#3b1219',
    activeTabBg: '#2e0e15',
    inactiveTabBg: '#14080b',
    taskbarBg: '#12070a',
    searchBg: '#080304'
  }),
  createPreset('arctic', 'Arctic', {
    bgPrimary: '#071018',
    bgElevated: '#0d1d2a',
    accentPrimary: '#38bdf8',
    accentSecondary: '#7dd3fc',
    borderColor: '#1e3a52',
    activeTabBg: '#163045',
    inactiveTabBg: '#0a1620',
    taskbarBg: '#0a1622',
    searchBg: '#050c12'
  }),
  createPreset('neon-purple', 'Neon Purple', {
    bgPrimary: '#0a0512',
    bgElevated: '#150b26',
    accentPrimary: '#d946ef',
    accentSecondary: '#8b5cf6',
    borderColor: '#351a5c',
    activeTabBg: '#281347',
    inactiveTabBg: '#11081f',
    taskbarBg: '#10081c',
    searchBg: '#07030c'
  }),
  createPreset('minimal', 'Minimal', {
    bgPrimary: '#121212',
    bgElevated: '#1a1a1a',
    accentPrimary: '#e5e5e5',
    accentSecondary: '#a3a3a3',
    borderColor: '#2a2a2a',
    activeTabBg: '#262626',
    inactiveTabBg: '#161616',
    taskbarBg: '#161616',
    searchBg: '#0e0e0e',
    borderRadius: 4
  }),
  createPreset('stealth', 'Stealth (OLED True Black)', {
    bgPrimary: '#000000',
    bgElevated: '#050505',
    accentPrimary: '#00e599',
    accentSecondary: '#10b981',
    borderColor: '#141414',
    activeTabBg: '#0d0d0d',
    inactiveTabBg: '#000000',
    taskbarBg: '#000000',
    searchBg: '#000000'
  }),
  createPreset('gaming-rgb', 'Gaming RGB', {
    bgPrimary: '#08090d',
    bgElevated: '#10121a',
    accentPrimary: '#00f0ff',
    accentSecondary: '#ff007f',
    borderColor: '#25293a',
    activeTabBg: '#1c2030',
    inactiveTabBg: '#0e1018',
    taskbarBg: '#0c0e15',
    searchBg: '#050609',
    rgbCycleMode: true
  })
]

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
  searchEngine: 'google',
  homepageUrl: KINETIC_NEWTAB_URL,
  newTabUrl: KINETIC_NEWTAB_URL,
  restorePreviousSession: true,
  showBookmarksBar: true,
  accentColor: '#00f0ff',
  chromeHeight: 84,
  sidebarOpenWidth: 420,
  enableSmoothScrolling: true
}

export interface BrowserStatePayload {
  tabs: TabState[]
  activeTabId: string | null
  isMaximized: boolean
  settings: BrowserSettings
  customization: CustomizationProfile
  savedThemes: CustomizationProfile[]
  history: HistoryEntry[]
  bookmarks: BookmarkItem[]
  bookmarkFolders: string[]
  quickLinks: QuickLinkItem[]
  downloads: DownloadEntry[]
  profiles: UserProfile[]
  activeProfileId: string
}

export interface KineticAPI {
  createTab: (url?: string, options?: { isPrivate?: boolean }) => Promise<string>
  closeTab: (tabId: string) => Promise<void>
  switchTab: (tabId: string) => Promise<void>
  duplicateTab: (tabId: string) => Promise<string>
  togglePinTab: (tabId: string) => Promise<void>
  toggleMuteTab: (tabId: string) => Promise<void>
  updateTabCustomStyle: (tabId: string, style: TabCustomStyle) => Promise<void>

  navigate: (input: string) => Promise<void>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  reload: () => Promise<void>
  stop: () => Promise<void>
  goHome: () => Promise<void>
  toggleDevTools: () => Promise<void>

  deleteHistoryItem: (id: string) => Promise<void>
  clearHistory: () => Promise<void>

  addBookmark: (data: {
    title: string
    url: string
    favicon?: string
    folder?: string
  }) => Promise<BookmarkItem>
  removeBookmark: (id: string) => Promise<void>
  createBookmarkFolder: (folderName: string) => Promise<string[]>

  addQuickLink: (data: { title: string; url: string }) => Promise<QuickLinkItem>
  removeQuickLink: (id: string) => Promise<void>

  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  showDownloadInFolder: (id: string) => Promise<void>
  clearCompletedDownloads: () => Promise<void>

  createProfile: (name: string, color: string) => Promise<UserProfile>
  switchProfile: (profileId: string) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>

  // Phase 4: Extreme Customization Engine API
  updateCustomization: (partial: Partial<CustomizationProfile>) => Promise<CustomizationProfile>
  applyThemePreset: (presetId: string) => Promise<CustomizationProfile>
  saveCustomTheme: (name: string) => Promise<CustomizationProfile>
  deleteCustomTheme: (themeId: string) => Promise<void>
  importCustomizationJson: (jsonString: string) => Promise<CustomizationProfile>
  resetCustomization: () => Promise<CustomizationProfile>

  setRightDrawerOpen: (isOpen: boolean, width?: number) => Promise<void>

  getSettings: () => Promise<BrowserSettings>
  updateSettings: (partial: Partial<BrowserSettings>) => Promise<BrowserSettings>
  resetSettings: () => Promise<BrowserSettings>

  minimizeWindow: () => Promise<void>
  maximizeOrRestoreWindow: () => Promise<void>
  closeWindow: () => Promise<void>

  getInitialState: () => Promise<BrowserStatePayload>
  onStateChanged: (callback: (state: BrowserStatePayload) => void) => () => void
}