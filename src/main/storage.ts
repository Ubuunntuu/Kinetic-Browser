import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import {
  BookmarkItem,
  BrowserSettings,
  BUILTIN_THEME_PRESETS,
  CustomizationProfile,
  DEFAULT_SETTINGS,
  DownloadEntry,
  HistoryEntry,
  KINETIC_DARK_PRESET,
  KINETIC_NEWTAB_URL,
  QuickLinkItem,
  SavedSessionTab,
  SEARCH_ENGINES,
  UserProfile
} from '../shared/types'

interface PersistentDatabase {
  schemaVersion?: number
  settings: BrowserSettings
  customization: CustomizationProfile
  customThemes: CustomizationProfile[]
  history: HistoryEntry[]
  bookmarks: BookmarkItem[]
  bookmarkFolders: string[]
  quickLinks: QuickLinkItem[]
  downloads: DownloadEntry[]
  profiles: UserProfile[]
  activeProfileId: string
  sessionsByProfile: Record<string, { tabs: SavedSessionTab[]; activeIndex: number }>
}

const CURRENT_SCHEMA_VERSION = 3

const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  name: 'Default',
  color: '#00f0ff',
  createdAt: Date.now()
}

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'bm-youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=32',
    folder: 'Bookmarks Bar',
    createdAt: Date.now()
  },
  {
    id: 'bm-steam',
    title: 'Steam',
    url: 'https://store.steampowered.com',
    favicon: 'https://www.google.com/s2/favicons?domain=store.steampowered.com&sz=32',
    folder: 'Bookmarks Bar',
    createdAt: Date.now()
  },
  {
    id: 'bm-discord',
    title: 'Discord',
    url: 'https://discord.com/app',
    favicon: 'https://www.google.com/s2/favicons?domain=discord.com&sz=32',
    folder: 'Bookmarks Bar',
    createdAt: Date.now()
  }
]

const DEFAULT_QUICK_LINKS: QuickLinkItem[] = [
  {
    id: 'ql-youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    iconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64'
  },
  {
    id: 'ql-steam',
    title: 'Steam',
    url: 'https://store.steampowered.com',
    iconUrl: 'https://www.google.com/s2/favicons?domain=store.steampowered.com&sz=64'
  },
  {
    id: 'ql-discord',
    title: 'Discord',
    url: 'https://discord.com/app',
    iconUrl: 'https://www.google.com/s2/favicons?domain=discord.com&sz=64'
  }
]

function normalizeWebUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return 'https://www.google.com'
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function buildFaviconUrl(targetUrl: string, size: number = 64): string {
  try {
    const parsed = new URL(targetUrl)
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=${size}`
  } catch {
    return ''
  }
}

export class SettingsStorage {
  private dbPath: string
  private db: PersistentDatabase

  constructor() {
    const userDataDir = app.getPath('userData')
    this.dbPath = path.join(userDataDir, 'kinetic-core-db.json')
    this.db = this.loadFromDisk()
  }

  private mergeCustomization(raw?: Partial<CustomizationProfile>): CustomizationProfile {
    if (!raw) return JSON.parse(JSON.stringify(KINETIC_DARK_PRESET))
    return {
      id: raw.id || KINETIC_DARK_PRESET.id,
      name: raw.name || KINETIC_DARK_PRESET.name,
      isBuiltIn: raw.isBuiltIn ?? false,
      appearance: { ...KINETIC_DARK_PRESET.appearance, ...(raw.appearance || {}) },
      taskbar: { ...KINETIC_DARK_PRESET.taskbar, ...(raw.taskbar || {}) },
      tabs: { ...KINETIC_DARK_PRESET.tabs, ...(raw.tabs || {}) },
      searchBar: { ...KINETIC_DARK_PRESET.searchBar, ...(raw.searchBar || {}) },
      sounds: {
        ...KINETIC_DARK_PRESET.sounds,
        ...(raw.sounds || {}),
        events: {
          ...KINETIC_DARK_PRESET.sounds.events,
          ...(raw.sounds?.events || {})
        }
      },
      customCss: typeof raw.customCss === 'string' ? raw.customCss : KINETIC_DARK_PRESET.customCss
    }
  }

  private validateSettings(raw: Partial<BrowserSettings> | undefined): BrowserSettings {
    const s = raw || {}
    const engine =
      s.searchEngine && SEARCH_ENGINES[s.searchEngine]
        ? s.searchEngine
        : DEFAULT_SETTINGS.searchEngine

    const normalizeSettingUrl = (val: unknown, fallback: string): string => {
      if (typeof val !== 'string' || !val.trim()) return fallback
      const trimmed = val.trim()
      if (trimmed === KINETIC_NEWTAB_URL) return KINETIC_NEWTAB_URL
      if (trimmed === 'https://duckduckgo.com') return KINETIC_NEWTAB_URL
      if (/^(https?:\/\/|kinetic:\/\/)/i.test(trimmed)) return trimmed
      return `https://${trimmed}`
    }

    return {
      searchEngine: engine,
      homepageUrl: normalizeSettingUrl(s.homepageUrl, KINETIC_NEWTAB_URL),
      newTabUrl: normalizeSettingUrl(s.newTabUrl, KINETIC_NEWTAB_URL),
      restorePreviousSession:
        typeof s.restorePreviousSession === 'boolean'
          ? s.restorePreviousSession
          : DEFAULT_SETTINGS.restorePreviousSession,
      showBookmarksBar:
        typeof s.showBookmarksBar === 'boolean'
          ? s.showBookmarksBar
          : DEFAULT_SETTINGS.showBookmarksBar,
      accentColor:
        typeof s.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.accentColor)
          ? s.accentColor
          : DEFAULT_SETTINGS.accentColor,
      chromeHeight:
        typeof s.chromeHeight === 'number' && s.chromeHeight >= 72 && s.chromeHeight <= 150
          ? s.chromeHeight
          : DEFAULT_SETTINGS.chromeHeight,
      sidebarOpenWidth:
        typeof s.sidebarOpenWidth === 'number' &&
        s.sidebarOpenWidth >= 280 &&
        s.sidebarOpenWidth <= 680
          ? s.sidebarOpenWidth
          : DEFAULT_SETTINGS.sidebarOpenWidth,
      enableSmoothScrolling:
        typeof s.enableSmoothScrolling === 'boolean'
          ? s.enableSmoothScrolling
          : DEFAULT_SETTINGS.enableSmoothScrolling
    }
  }

  private loadFromDisk(): PersistentDatabase {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8')
        const parsed = JSON.parse(content) as Partial<PersistentDatabase>

        const profiles =
          Array.isArray(parsed.profiles) && parsed.profiles.length > 0
            ? parsed.profiles
            : [DEFAULT_PROFILE]

        const activeProfileId =
          parsed.activeProfileId && profiles.some((p) => p.id === parsed.activeProfileId)
            ? parsed.activeProfileId
            : profiles[0].id

        let bookmarks: BookmarkItem[] = Array.isArray(parsed.bookmarks)
          ? parsed.bookmarks
          : [...DEFAULT_BOOKMARKS]

        if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
          const oldPremadeIds = new Set(['bm-1', 'bm-2', 'bm-3', 'bm-4'])
          const userCustomBookmarks = bookmarks.filter((b) => !oldPremadeIds.has(b.id))
          const existingUrls = new Set(userCustomBookmarks.map((b) => b.url))
          const cleanDefaults = DEFAULT_BOOKMARKS.filter((d) => !existingUrls.has(d.url))
          bookmarks = [...cleanDefaults, ...userCustomBookmarks]
        }

        const quickLinks: QuickLinkItem[] =
          Array.isArray(parsed.quickLinks) && parsed.schemaVersion && parsed.schemaVersion >= 2
            ? parsed.quickLinks
            : [...DEFAULT_QUICK_LINKS]

        const loaded: PersistentDatabase = {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          settings: this.validateSettings(parsed.settings),
          customization: this.mergeCustomization(parsed.customization),
          customThemes: Array.isArray(parsed.customThemes)
            ? parsed.customThemes.map((t) => this.mergeCustomization(t))
            : [],
          history: Array.isArray(parsed.history) ? parsed.history.slice(0, 1500) : [],
          bookmarks,
          bookmarkFolders:
            Array.isArray(parsed.bookmarkFolders) && parsed.bookmarkFolders.length > 0
              ? parsed.bookmarkFolders
              : ['Bookmarks Bar', 'Gaming', 'Custom'],
          quickLinks,
          downloads: Array.isArray(parsed.downloads) ? parsed.downloads.slice(0, 200) : [],
          profiles,
          activeProfileId,
          sessionsByProfile:
            parsed.sessionsByProfile && typeof parsed.sessionsByProfile === 'object'
              ? parsed.sessionsByProfile
              : {}
        }
        this.saveToDisk(loaded)
        return loaded
      }
    } catch (error) {
      console.error('[KineticStorage] Failed to load DB, initializing fresh defaults:', error)
    }

    const fresh: PersistentDatabase = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: { ...DEFAULT_SETTINGS },
      customization: JSON.parse(JSON.stringify(KINETIC_DARK_PRESET)),
      customThemes: [],
      history: [],
      bookmarks: [...DEFAULT_BOOKMARKS],
      bookmarkFolders: ['Bookmarks Bar', 'Gaming', 'Custom'],
      quickLinks: [...DEFAULT_QUICK_LINKS],
      downloads: [],
      profiles: [DEFAULT_PROFILE],
      activeProfileId: DEFAULT_PROFILE.id,
      sessionsByProfile: {}
    }
    this.saveToDisk(fresh)
    return fresh
  }

  public saveToDisk(data: PersistentDatabase = this.db): void {
    try {
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error('[KineticStorage] Failed to save DB:', error)
    }
  }

  public getSettings(): BrowserSettings {
    return { ...this.db.settings }
  }

  public updateSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    this.db.settings = this.validateSettings({ ...this.db.settings, ...partial })
    if (partial.accentColor) {
      this.db.customization.appearance.accentPrimary = partial.accentColor
      this.db.customization.tabs.activeTabBorderColor = partial.accentColor
    }
    this.saveToDisk()
    return this.getSettings()
  }

  public resetSettings(): BrowserSettings {
    this.db.settings = { ...DEFAULT_SETTINGS }
    this.saveToDisk()
    return this.getSettings()
  }

  // Phase 4 Customization Methods
  public getCustomization(): CustomizationProfile {
    return JSON.parse(JSON.stringify(this.db.customization))
  }

  public getAllThemes(): CustomizationProfile[] {
    return [...BUILTIN_THEME_PRESETS, ...this.db.customThemes]
  }

  public updateCustomization(partial: Partial<CustomizationProfile>): CustomizationProfile {
    this.db.customization = this.mergeCustomization({
      ...this.db.customization,
      ...partial,
      appearance: {
        ...this.db.customization.appearance,
        ...(partial.appearance || {})
      },
      taskbar: {
        ...this.db.customization.taskbar,
        ...(partial.taskbar || {})
      },
      tabs: {
        ...this.db.customization.tabs,
        ...(partial.tabs || {})
      },
      searchBar: {
        ...this.db.customization.searchBar,
        ...(partial.searchBar || {})
      },
      sounds: {
        ...this.db.customization.sounds,
        ...(partial.sounds || {}),
        events: {
          ...this.db.customization.sounds.events,
          ...(partial.sounds?.events || {})
        }
      }
    })
    this.db.settings.accentColor = this.db.customization.appearance.accentPrimary
    this.saveToDisk()
    return this.getCustomization()
  }

  public applyThemePreset(presetId: string): CustomizationProfile {
    const all = this.getAllThemes()
    const found = all.find((t) => t.id === presetId)
    if (found) {
      // Preserve current user sound preferences & custom CSS unless preset overrides
      const currentSounds = this.db.customization.sounds
      this.db.customization = this.mergeCustomization({
        ...JSON.parse(JSON.stringify(found)),
        sounds: currentSounds
      })
      this.db.settings.accentColor = this.db.customization.appearance.accentPrimary
      this.saveToDisk()
    }
    return this.getCustomization()
  }

  public saveCustomTheme(name: string): CustomizationProfile {
    const cleanName = name.trim() || `Custom Theme ${this.db.customThemes.length + 1}`
    const theme: CustomizationProfile = {
      ...this.getCustomization(),
      id: `custom-${randomUUID().slice(0, 8)}`,
      name: cleanName,
      isBuiltIn: false
    }
    this.db.customThemes.push(theme)
    this.db.customization.id = theme.id
    this.db.customization.name = theme.name
    this.saveToDisk()
    return theme
  }

  public deleteCustomTheme(themeId: string): void {
    this.db.customThemes = this.db.customThemes.filter((t) => t.id !== themeId)
    if (this.db.customization.id === themeId) {
      this.db.customization = JSON.parse(JSON.stringify(KINETIC_DARK_PRESET))
    }
    this.saveToDisk()
  }

  public importCustomizationJson(jsonString: string): CustomizationProfile {
    const parsed = JSON.parse(jsonString) as Partial<CustomizationProfile>
    const merged = this.mergeCustomization({
      ...parsed,
      id: `imported-${randomUUID().slice(0, 6)}`,
      name: parsed.name ? `${parsed.name} (Imported)` : 'Imported Profile',
      isBuiltIn: false
    })
    this.db.customThemes.push(merged)
    this.db.customization = JSON.parse(JSON.stringify(merged))
    this.db.settings.accentColor = this.db.customization.appearance.accentPrimary
    this.saveToDisk()
    return this.getCustomization()
  }

  public resetCustomization(): CustomizationProfile {
    this.db.customization = JSON.parse(JSON.stringify(KINETIC_DARK_PRESET))
    this.db.settings.accentColor = KINETIC_DARK_PRESET.appearance.accentPrimary
    this.saveToDisk()
    return this.getCustomization()
  }

  public getHistory(profileId?: string): HistoryEntry[] {
    const pid = profileId || this.db.activeProfileId
    return this.db.history.filter((h) => h.profileId === pid)
  }

  public recordHistoryVisit(entry: {
    url: string
    title: string
    favicon: string
    profileId: string
  }): void {
    if (!entry.url || entry.url === 'about:blank' || entry.url === KINETIC_NEWTAB_URL) return

    const existingIndex = this.db.history.findIndex(
      (h) => h.url === entry.url && h.profileId === entry.profileId
    )

    if (existingIndex !== -1) {
      const existing = this.db.history[existingIndex]
      this.db.history.splice(existingIndex, 1)
      this.db.history.unshift({
        ...existing,
        title: entry.title || existing.title,
        favicon: entry.favicon || existing.favicon,
        visitedAt: Date.now(),
        visitCount: existing.visitCount + 1
      })
    } else {
      this.db.history.unshift({
        id: randomUUID(),
        url: entry.url,
        title: entry.title || entry.url,
        favicon: entry.favicon || '',
        visitedAt: Date.now(),
        visitCount: 1,
        profileId: entry.profileId
      })
    }

    if (this.db.history.length > 1500) {
      this.db.history = this.db.history.slice(0, 1500)
    }
    this.saveToDisk()
  }

  public deleteHistoryItem(id: string): void {
    this.db.history = this.db.history.filter((h) => h.id !== id)
    this.saveToDisk()
  }

  public clearHistory(profileId?: string): void {
    const pid = profileId || this.db.activeProfileId
    this.db.history = this.db.history.filter((h) => h.profileId !== pid)
    this.saveToDisk()
  }

  public getBookmarks(): BookmarkItem[] {
    return [...this.db.bookmarks]
  }

  public getBookmarkFolders(): string[] {
    return [...this.db.bookmarkFolders]
  }

  public addBookmark(data: {
    title: string
    url: string
    favicon?: string
    folder?: string
  }): BookmarkItem {
    const normalizedUrl = normalizeWebUrl(data.url)
    const folder =
      data.folder && this.db.bookmarkFolders.includes(data.folder)
        ? data.folder
        : 'Bookmarks Bar'

    const existing = this.db.bookmarks.find((b) => b.url === normalizedUrl)
    if (existing) {
      existing.title = data.title.trim() || existing.title
      existing.folder = folder
      existing.favicon = data.favicon || existing.favicon || buildFaviconUrl(normalizedUrl, 32)
      this.saveToDisk()
      return existing
    }

    const item: BookmarkItem = {
      id: randomUUID(),
      title: data.title.trim() || normalizedUrl,
      url: normalizedUrl,
      favicon: data.favicon || buildFaviconUrl(normalizedUrl, 32),
      folder,
      createdAt: Date.now()
    }
    this.db.bookmarks.push(item)
    this.saveToDisk()
    return item
  }

  public removeBookmark(id: string): void {
    this.db.bookmarks = this.db.bookmarks.filter((b) => b.id !== id)
    this.saveToDisk()
  }

  public createBookmarkFolder(folderName: string): string[] {
    const clean = folderName.trim()
    if (clean && !this.db.bookmarkFolders.includes(clean)) {
      this.db.bookmarkFolders.push(clean)
      this.saveToDisk()
    }
    return this.getBookmarkFolders()
  }

  public getQuickLinks(): QuickLinkItem[] {
    return [...this.db.quickLinks]
  }

  public addQuickLink(data: { title: string; url: string }): QuickLinkItem {
    const normalizedUrl = normalizeWebUrl(data.url)
    const cleanTitle = data.title.trim() || normalizedUrl.replace(/^https?:\/\/(www\.)?/i, '')
    const item: QuickLinkItem = {
      id: `ql-${randomUUID().slice(0, 8)}`,
      title: cleanTitle,
      url: normalizedUrl,
      iconUrl: buildFaviconUrl(normalizedUrl, 64)
    }
    this.db.quickLinks.push(item)
    this.saveToDisk()
    return item
  }

  public removeQuickLink(id: string): void {
    this.db.quickLinks = this.db.quickLinks.filter((q) => q.id !== id)
    this.saveToDisk()
  }

  public getDownloads(): DownloadEntry[] {
    return [...this.db.downloads]
  }

  public upsertDownload(entry: DownloadEntry): void {
    const idx = this.db.downloads.findIndex((d) => d.id === entry.id)
    if (idx !== -1) {
      this.db.downloads[idx] = { ...entry }
    } else {
      this.db.downloads.unshift({ ...entry })
    }
    this.saveToDisk()
  }

  public clearCompletedDownloads(): void {
    this.db.downloads = this.db.downloads.filter(
      (d) => d.status === 'progressing' || d.status === 'paused'
    )
    this.saveToDisk()
  }

  public getProfiles(): UserProfile[] {
    return [...this.db.profiles]
  }

  public getActiveProfileId(): string {
    return this.db.activeProfileId
  }

  public setActiveProfileId(profileId: string): void {
    if (this.db.profiles.some((p) => p.id === profileId)) {
      this.db.activeProfileId = profileId
      this.saveToDisk()
    }
  }

  public createProfile(name: string, color: string): UserProfile {
    const profile: UserProfile = {
      id: `profile-${randomUUID().slice(0, 8)}`,
      name: name.trim() || 'Custom Profile',
      color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#00f0ff',
      createdAt: Date.now()
    }
    this.db.profiles.push(profile)
    this.saveToDisk()
    return profile
  }

  public deleteProfile(profileId: string): void {
    if (profileId === 'default' || this.db.profiles.length <= 1) return
    this.db.profiles = this.db.profiles.filter((p) => p.id !== profileId)
    delete this.db.sessionsByProfile[profileId]
    this.db.history = this.db.history.filter((h) => h.profileId !== profileId)
    if (this.db.activeProfileId === profileId) {
      this.db.activeProfileId = this.db.profiles[0].id
    }
    this.saveToDisk()
  }

  public saveProfileSession(
    profileId: string,
    tabs: SavedSessionTab[],
    activeIndex: number
  ): void {
    this.db.sessionsByProfile[profileId] = {
      tabs,
      activeIndex: Math.max(0, activeIndex)
    }
    this.saveToDisk()
  }

  public getProfileSession(
    profileId: string
  ): { tabs: SavedSessionTab[]; activeIndex: number } | undefined {
    return this.db.sessionsByProfile[profileId]
  }
}