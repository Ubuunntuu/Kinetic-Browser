import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { BrowserSettings, DEFAULT_SETTINGS, SEARCH_ENGINES } from '../shared/types'

export class SettingsStorage {
  private filePath: string
  private settings: BrowserSettings

  constructor() {
    const userDataDir = app.getPath('userData')
    this.filePath = path.join(userDataDir, 'kinetic-settings.json')
    this.settings = this.loadFromDisk()
  }

  private validate(raw: Partial<BrowserSettings>): BrowserSettings {
    const engine = raw.searchEngine && SEARCH_ENGINES[raw.searchEngine]
      ? raw.searchEngine
      : DEFAULT_SETTINGS.searchEngine

    const normalizeUrl = (val: unknown, fallback: string): string => {
      if (typeof val !== 'string' || !val.trim()) return fallback
      const trimmed = val.trim()
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      return `https://${trimmed}`
    }

    return {
      searchEngine: engine,
      homepageUrl: normalizeUrl(raw.homepageUrl, DEFAULT_SETTINGS.homepageUrl),
      newTabUrl: normalizeUrl(raw.newTabUrl, DEFAULT_SETTINGS.newTabUrl),
      restorePreviousSession:
        typeof raw.restorePreviousSession === 'boolean'
          ? raw.restorePreviousSession
          : DEFAULT_SETTINGS.restorePreviousSession,
      accentColor:
        typeof raw.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.accentColor)
          ? raw.accentColor
          : DEFAULT_SETTINGS.accentColor,
      chromeHeight:
        typeof raw.chromeHeight === 'number' && raw.chromeHeight >= 72 && raw.chromeHeight <= 140
          ? raw.chromeHeight
          : DEFAULT_SETTINGS.chromeHeight,
      sidebarOpenWidth:
        typeof raw.sidebarOpenWidth === 'number' && raw.sidebarOpenWidth >= 280 && raw.sidebarOpenWidth <= 600
          ? raw.sidebarOpenWidth
          : DEFAULT_SETTINGS.sidebarOpenWidth,
      enableSmoothScrolling:
        typeof raw.enableSmoothScrolling === 'boolean'
          ? raw.enableSmoothScrolling
          : DEFAULT_SETTINGS.enableSmoothScrolling
    }
  }

  private loadFromDisk(): BrowserSettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(content) as Partial<BrowserSettings>
        return this.validate(parsed)
      }
    } catch (error) {
      console.error('[KineticStorage] Failed to load settings, using defaults:', error)
    }
    this.saveToDisk(DEFAULT_SETTINGS)
    return { ...DEFAULT_SETTINGS }
  }

  private saveToDisk(data: BrowserSettings): void {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error('[KineticStorage] Failed to write settings:', error)
    }
  }

  public getSettings(): BrowserSettings {
    return { ...this.settings }
  }

  public updateSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    this.settings = this.validate({ ...this.settings, ...partial })
    this.saveToDisk(this.settings)
    return this.getSettings()
  }

  public resetSettings(): BrowserSettings {
    this.settings = { ...DEFAULT_SETTINGS }
    this.saveToDisk(this.settings)
    return this.getSettings()
  }
}
