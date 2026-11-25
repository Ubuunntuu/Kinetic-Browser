import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import {
  BookmarkItem,
  BrowserSettings,
  DEFAULT_SETTINGS,
  DownloadEntry,
  HistoryEntry,
  SavedSessionTab,
  SEARCH_ENGINES,
  UserProfile
} from '../shared/types'

interface PersistentDatabase {
  settings: BrowserSettings
  history: HistoryEntry[]
  bookmarks: BookmarkItem[]
  bookmarkFolders: string[]
  downloads: DownloadEntry[]
  profiles: UserProfile[]
  activeProfileId: string
  sessionsByProfile: Record<string, { tabs: SavedSessionTab[]; activeIndex: number }>
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  name: 'Main Gamer Profile',
  color: '#00f0ff',
  createdAt: Date.now()
}

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'bm-1',
    title: 'GitHub - Kinetic Browser',
    url: 'https://github.com/Ubuunntuu/Kinetic-Browser',
    favicon: '',
    folder: 'Bookmarks Bar',
    createdAt: Date.now()
  },
  {
    id: 'bm-2',
    title: 'DuckDuckGo',
    url: 'https://duckduckgo.com',
    favicon: '',
    folder: 'Bookmarks Bar',
    createdAt: Date.now()
  },
  {
    id: 'bm-3',
    title: 'Steam Store',
    url: 'https://store.steampowered.com',
    favicon: '',
    folder: 'Gaming',
    createdAt: Date.now()
  },
  {
    id: 'bm-4',
    title: 'PCGamingWiki',
    url: 'https://www.pcgamingwiki.com',
    favicon: '',
    folder: 'Gaming',
    createdAt: Date.now()
  }
]

export class SettingsStorage {
  private dbPath: string
  private db: PersistentDatabase

  constructor() {
    const userDataDir = app.getPath('userData')
    this.dbPath = path.join(userDataDir, 'kinetic-core-db.json')
    this.db = this.loadFromDisk()
  }

  private validateSettings(raw: Partial<BrowserSettings> | undefined): BrowserSettings {
    const s = raw || {}
    const engine =
      s.searchEngine && SEARCH_ENGINES[s.searchEngine]
        ? s.searchEngine
        : DEFAULT_SETTINGS.searchEngine

    const normalizeUrl = (val: unknown, fallback: string): string => {
      if (typeof val !== 'string' || !val.trim()) return fallback
      const trimmed = val.trim()
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      return `https://${trimmed}`
    }

    return {
      searchEngine: engine,
      homepageUrl: normalizeUrl(s.homepageUrl, DEFAULT_SETTINGS.homepageUrl),
      newTabUrl: normalizeUrl(s.newTabUrl, DEFAULT_SETTINGS.newTabUrl),
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
        s.sidebarOpenWidth <= 640
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

        return {
          settings: this.validateSettings(parsed.settings),
          history: Array.isArray(parsed.history) ? parsed.history.slice(0, 1500) : [],
          bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : DEFAULT_BOOKMARKS,
          bookmarkFolders:
            Array.isArray(parsed.bookmarkFolders) && parsed.bookmarkFolders.length > 0
              ? parsed.bookmarkFolders
              : ['Bookmarks Bar', 'Gaming', 'Work & Dev'],
          downloads: Array.isArray(parsed.downloads) ? parsed.downloads.slice(0, 200) : [],
          profiles,
          activeProfileId,
          sessionsByProfile:
            parsed.sessionsByProfile && typeof parsed.sessionsByProfile === 'object'
              ? parsed.sessionsByProfile
              : {}
        }
      }
    } catch (error) {
      console.error('[KineticStorage] Failed to load DB, initializing fresh defaults:', error)
    }

    const fresh: PersistentDatabase = {
      settings: { ...DEFAULT_SETTINGS },
      history: [],
      bookmarks: [...DEFAULT_BOOKMARKS],
      bookmarkFolders: ['Bookmarks Bar', 'Gaming', 'Work & Dev'],
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

  // Settings
  public getSettings(): BrowserSettings {
    return { ...this.db.settings }
  }

  public updateSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    this.db.settings = this.validateSettings({ ...this.db.settings, ...partial })
    this.saveToDisk()
    return this.getSettings()
  }

  public resetSettings(): BrowserSettings {
    this.db.settings = { ...DEFAULT_SETTINGS }
    this.saveToDisk()
    return this.getSettings()
  }

  // History
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
    if (!entry.url || entry.url === 'about:blank') return

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

  // Bookmarks
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
    const folder = data.folder && this.db.bookmarkFolders.includes(data.folder)
      ? data.folder
      : 'Bookmarks Bar'

    const existing = this.db.bookmarks.find((b) => b.url === data.url)
    if (existing) {
      existing.title = data.title || existing.title
      existing.folder = folder
      if (data.favicon) existing.favicon = data.favicon
      this.saveToDisk()
      return existing
    }

    const item: BookmarkItem = {
      id: randomUUID(),
      title: data.title || data.url,
      url: data.url,
      favicon: data.favicon || '',
      folder,
      createdAt: Date.now()
    }
    this.db.bookmarks.unshift(item)
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

  // Downloads
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
    this.db.downloads = this.db.downloads.filter((d) => d.status === 'progressing' || d.status === 'paused')
    this.saveToDisk()
  }

  // Profiles
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
      name: name.trim() || 'Gamer Profile',
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

  // Session Restoration per Profile
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