import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Plus,
  Home,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Settings,
  Terminal,
  Copy,
  Pin,
  Volume2,
  VolumeX,
  Minus,
  Square,
  Globe,
  Star,
  Bookmark,
  History,
  Download,
  Users,
  EyeOff,
  Trash2,
  FolderOpen,
  Pause,
  Play,
  FolderPlus,
  Search,
  Palette,
  RotateCcw
} from 'lucide-react'
import {
  BlockedRequestLog,
  BookmarkItem,
  BrowserSettings,
  BrowserStatePayload,
  BUILTIN_THEME_PRESETS,
  CustomizationProfile,
  DEFAULT_PRIVACY_CONFIG,
  DEFAULT_PRIVACY_STATS,
  DEFAULT_SECURITY_CONFIG,
  DEFAULT_SETTINGS,
  DohProviderId,
  DownloadEntry,
  DrawerPanelId,
  HistoryEntry,
  KINETIC_DARK_PRESET,
  KINETIC_NEWTAB_URL,
  PermissionPolicy,
  PermissionType,
  PrivacyConfig,
  PrivacyStats,
  QuickLinkItem,
  SEARCH_ENGINES,
  SearchEngineId,
  SecurityConfig,
  SoundEventId,
  SoundPackId,
  TabState,
  UserProfile
} from '../../shared/types'
import { soundEngine } from './utils/sound-engine'

type CustomizeTabId =
  | 'themes'
  | 'appearance'
  | 'taskbar'
  | 'tabs'
  | 'searchbar'
  | 'sounds'
  | 'css'

type ShieldSubTabId = 'overview' | 'scrubber' | 'rules' | 'logs'

const FONT_OPTIONS = [
  { label: 'Segoe UI (Modern Default)', value: "'Segoe UI', system-ui, sans-serif" },
  { label: 'Inter / Sans', value: "'Inter', 'Segoe UI', sans-serif" },
  { label: 'Consolas / Developer Mono', value: "'Consolas', 'Courier New', monospace" },
  { label: 'Trebuchet / Geometric', value: "'Trebuchet MS', sans-serif" },
  { label: 'Georgia / Editorial Serif', value: "'Georgia', serif" }
]

const SOUND_EVENT_LABELS: Record<SoundEventId, string> = {
  click: 'UI Button Clicks',
  tabOpen: 'Tab Opened',
  tabClose: 'Tab Closed',
  tabSwitch: 'Tab Switched',
  navigate: 'Page Navigation',
  download: 'Download Triggered'
}

const PERMISSION_LABELS: Record<PermissionType, string> = {
  media: 'Camera & Microphone',
  geolocation: 'Location Access',
  notifications: 'Desktop Notifications',
  'clipboard-read': 'Clipboard Read Access',
  midi: 'MIDI / Hardware Devices'
}

function getSiteFaviconUrl(siteUrl: string, size: number = 64): string {
  try {
    const parsed = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`)
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=${size}`
  } catch {
    return ''
  }
}

function getHostnameFromUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export default function App(): JSX.Element {
  const [tabs, setTabs] = useState<TabState[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS)
  const [custom, setCustom] = useState<CustomizationProfile>(KINETIC_DARK_PRESET)
  const [savedThemes, setSavedThemes] = useState<CustomizationProfile[]>(BUILTIN_THEME_PRESETS)

  // Phase 5 Privacy & Security State
  const [privacyConfig, setPrivacyConfig] = useState<PrivacyConfig>(DEFAULT_PRIVACY_CONFIG)
  const [privacyStats, setPrivacyStats] = useState<PrivacyStats>(DEFAULT_PRIVACY_STATS)
  const [blockedLogs, setBlockedLogs] = useState<BlockedRequestLog[]>([])
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(DEFAULT_SECURITY_CONFIG)
  const [shieldSubTab, setShieldSubTab] = useState<ShieldSubTabId>('overview')
  const [newBlockRuleInput, setNewBlockRuleInput] = useState<string>('')
  const [newPermOriginInput, setNewPermOriginInput] = useState<string>('')
  const [newPermTypeInput, setNewPermTypeInput] = useState<PermissionType>('media')
  const [newPermPolicyInput, setNewPermPolicyInput] = useState<PermissionPolicy>('block')
  const [clearCookiesCheck, setClearCookiesCheck] = useState<boolean>(true)
  const [clearCacheCheck, setClearCacheCheck] = useState<boolean>(true)
  const [clearHistoryCheck, setClearHistoryCheck] = useState<boolean>(false)

  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [bookmarkFolders, setBookmarkFolders] = useState<string[]>(['Bookmarks Bar'])
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([])
  const [downloads, setDownloads] = useState<DownloadEntry[]>([])
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string>('default')

  const [addressInput, setAddressInput] = useState<string>('')
  const [newTabSearchQuery, setNewTabSearchQuery] = useState<string>('')
  const [isAddressFocused, setIsAddressFocused] = useState<boolean>(false)
  const [activeDrawer, setActiveDrawer] = useState<DrawerPanelId>('none')
  const [customizeSubTab, setCustomizeSubTab] = useState<CustomizeTabId>('themes')
  const [clockNow, setClockNow] = useState<Date>(new Date())

  const [customThemeNameInput, setCustomThemeNameInput] = useState<string>('')
  const [importJsonInput, setImportJsonInput] = useState<string>('')
  const [cssDraft, setCssDraft] = useState<string>('')
  const [cssError, setCssError] = useState<string>('')

  const [tabCustomTitleDraft, setTabCustomTitleDraft] = useState<string>('')
  const [tabCustomColorDraft, setTabCustomColorDraft] = useState<string>('#00f0ff')
  const [tabCustomBgDraft, setTabCustomBgDraft] = useState<string>('#202436')

  const [isAddingQuickLink, setIsAddingQuickLink] = useState<boolean>(false)
  const [customQuickTitle, setCustomQuickTitle] = useState<string>('')
  const [customQuickUrl, setCustomQuickUrl] = useState<string>('')
  const [customBmTitle, setCustomBmTitle] = useState<string>('')
  const [customBmUrl, setCustomBmUrl] = useState<string>('')
  const [customBmFolder, setCustomBmFolder] = useState<string>('Bookmarks Bar')

  const [historySearch, setHistorySearch] = useState<string>('')
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL')
  const [newFolderInput, setNewFolderInput] = useState<string>('')
  const [newProfileName, setNewProfileName] = useState<string>('')
  const [newProfileColor, setNewProfileColor] = useState<string>('#00f0ff')
  const [homepageDraft, setHomepageDraft] = useState<string>(DEFAULT_SETTINGS.homepageUrl)
  const [newTabDraft, setNewTabDraft] = useState<string>(DEFAULT_SETTINGS.newTabUrl)

  const activeTab = tabs.find((t) => t.id === activeTabId) || null
  const isNewTabActive = !activeTab || activeTab.url === KINETIC_NEWTAB_URL
  const activeHostname = activeTab && !isNewTabActive ? getHostnameFromUrl(activeTab.url) : ''
  const isCurrentSiteWhitelisted =
    Boolean(activeHostname) && privacyConfig.whitelistedDomains.includes(activeHostname)
  const currentEngine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.google
  const currentBookmark =
    activeTab && !isNewTabActive ? bookmarks.find((b) => b.url === activeTab.url) : undefined
  const hasActiveDownloads = downloads.some((d) => d.status === 'progressing')

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const { appearance, taskbar, tabs: tabCfg, searchBar } = custom

    root.style.setProperty('--kb-bg-primary', appearance.bgPrimary)
    root.style.setProperty('--kb-bg-elevated', appearance.bgElevated)
    root.style.setProperty('--kb-text-primary', appearance.textPrimary)
    root.style.setProperty('--kb-text-secondary', appearance.textSecondary)
    root.style.setProperty('--kb-accent', appearance.accentPrimary)
    root.style.setProperty('--kb-accent-secondary', appearance.accentSecondary)
    root.style.setProperty('--kb-border', appearance.borderColor)
    root.style.setProperty('--kb-border-width', `${appearance.borderWidth}px`)
    root.style.setProperty('--kb-radius', `${appearance.borderRadius}px`)
    root.style.setProperty('--kb-glow-intensity', `${appearance.glowIntensity}`)
    root.style.setProperty('--kb-font-family', appearance.fontFamily)
    root.style.setProperty('--kb-font-size', `${appearance.fontSize}px`)

    root.style.setProperty('--kb-taskbar-height', `${taskbar.height}px`)
    root.style.setProperty('--kb-taskbar-bg', taskbar.bgColor)
    root.style.setProperty('--kb-btn-size', `${taskbar.buttonSize}px`)
    root.style.setProperty('--kb-btn-spacing', `${taskbar.buttonSpacing}px`)
    root.style.setProperty('--kb-btn-radius', `${taskbar.buttonRadius}px`)

    root.style.setProperty('--kb-tab-width', `${tabCfg.tabWidth}px`)
    root.style.setProperty('--kb-tab-height', `${tabCfg.tabHeight}px`)
    root.style.setProperty('--kb-tab-spacing', `${tabCfg.tabSpacing}px`)
    root.style.setProperty('--kb-tab-radius', `${tabCfg.tabRadius}px`)
    root.style.setProperty('--kb-tab-active-bg', tabCfg.activeTabBg)
    root.style.setProperty('--kb-tab-inactive-bg', tabCfg.inactiveTabBg)
    root.style.setProperty('--kb-tab-active-border', tabCfg.activeTabBorderColor)
    root.style.setProperty('--kb-vtab-width', `${tabCfg.verticalSidebarWidth}px`)

    root.style.setProperty('--kb-search-width', `${searchBar.widthPercent}%`)
    root.style.setProperty('--kb-search-height', `${searchBar.height}px`)
    root.style.setProperty('--kb-search-bg', searchBar.bgColor)
    root.style.setProperty('--kb-search-text', searchBar.textColor)
    root.style.setProperty('--kb-search-border', searchBar.borderColor)
    root.style.setProperty('--kb-search-radius', `${searchBar.borderRadius}px`)
    root.style.setProperty('--kb-search-border-width', `${searchBar.borderWidth}px`)
    root.style.setProperty('--kb-search-padding', `${searchBar.paddingHorizontal}px`)

    let styleTag = document.getElementById('kinetic-user-custom-css') as HTMLStyleElement | null
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'kinetic-user-custom-css'
      document.head.appendChild(styleTag)
    }
    styleTag.textContent = custom.customCss || ''
  }, [custom])

  useEffect(() => {
    const applyState = (payload: BrowserStatePayload): void => {
      if (!payload) return
      setTabs(payload.tabs)
      setActiveTabId(payload.activeTabId)
      setSettings(payload.settings)
      if (payload.customization) {
        setCustom(payload.customization)
        setCssDraft(payload.customization.customCss || '')
      }
      if (payload.savedThemes) {
        setSavedThemes(payload.savedThemes)
      }
      if (payload.privacyConfig) {
        setPrivacyConfig(payload.privacyConfig)
      }
      if (payload.privacyStats) {
        setPrivacyStats(payload.privacyStats)
      }
      if (payload.blockedLogs) {
        setBlockedLogs(payload.blockedLogs)
      }
      if (payload.securityConfig) {
        setSecurityConfig(payload.securityConfig)
      }
      setHistory(payload.history || [])
      setBookmarks(payload.bookmarks || [])
      setBookmarkFolders(payload.bookmarkFolders || ['Bookmarks Bar'])
      setQuickLinks(payload.quickLinks || [])
      setDownloads(payload.downloads || [])
      setProfiles(payload.profiles || [])
      setActiveProfileId(payload.activeProfileId || 'default')

      document.documentElement.style.setProperty(
        '--kb-drawer-width',
        `${payload.settings.sidebarOpenWidth}px`
      )
    }

    window.kinetic.getInitialState().then((initial) => {
      if (initial) {
        applyState(initial)
        setHomepageDraft(initial.settings.homepageUrl)
        setNewTabDraft(initial.settings.newTabUrl)
      }
    })

    const unsubscribe = window.kinetic.onStateChanged((nextState) => {
      applyState(nextState)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAddressFocused && activeTab) {
      setAddressInput(activeTab.url === KINETIC_NEWTAB_URL ? '' : activeTab.url)
    }
    if (activeTab) {
      setTabCustomTitleDraft(activeTab.customStyle?.customTitle || '')
      setTabCustomColorDraft(
        activeTab.customStyle?.customColor || custom.tabs.activeTabBorderColor
      )
      setTabCustomBgDraft(activeTab.customStyle?.customBg || custom.tabs.activeTabBg)
    }
  }, [activeTab?.url, activeTabId, isAddressFocused])

  const triggerSound = (event: SoundEventId): void => {
    soundEngine.play(event, custom.sounds)
  }

  const toggleDrawerPanel = (panel: DrawerPanelId): void => {
    triggerSound('click')
    const next = activeDrawer === panel ? 'none' : panel
    setActiveDrawer(next)
    window.kinetic.setRightDrawerOpen(next !== 'none', settings.sidebarOpenWidth)
  }

  const openDrawerPanel = (panel: DrawerPanelId): void => {
    triggerSound('click')
    setActiveDrawer(panel)
    window.kinetic.setRightDrawerOpen(true, settings.sidebarOpenWidth)
  }

  const handleCreateTab = (url?: string, isPrivate?: boolean): void => {
    triggerSound('tabOpen')
    window.kinetic.createTab(url, { isPrivate })
  }

  const handleCloseTab = (tabId: string): void => {
    triggerSound('tabClose')
    window.kinetic.closeTab(tabId)
  }

  const handleSwitchTab = (tabId: string): void => {
    if (tabId !== activeTabId) {
      triggerSound('tabSwitch')
      window.kinetic.switchTab(tabId)
    }
  }

  const handleNavigateSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    triggerSound('navigate')
    window.kinetic.navigate(addressInput)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const handleNewTabSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!newTabSearchQuery.trim()) return
    triggerSound('navigate')
    window.kinetic.navigate(newTabSearchQuery)
    setNewTabSearchQuery('')
  }

  const handleAddQuickLinkSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!customQuickUrl.trim()) return
    triggerSound('click')
    await window.kinetic.addQuickLink({
      title: customQuickTitle.trim() || customQuickUrl.trim(),
      url: customQuickUrl.trim()
    })
    setCustomQuickTitle('')
    setCustomQuickUrl('')
    setIsAddingQuickLink(false)
  }

  const handleAddCustomBookmarkSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!customBmUrl.trim()) return
    triggerSound('click')
    await window.kinetic.addBookmark({
      title: customBmTitle.trim() || customBmUrl.trim(),
      url: customBmUrl.trim(),
      folder: customBmFolder
    })
    setCustomBmTitle('')
    setCustomBmUrl('')
  }

  const handleToggleBookmarkActiveTab = async (): Promise<void> => {
    if (!activeTab || isNewTabActive) return
    triggerSound('click')
    if (currentBookmark) {
      await window.kinetic.removeBookmark(currentBookmark.id)
    } else {
      await window.kinetic.addBookmark({
        title: activeTab.title,
        url: activeTab.url,
        favicon: activeTab.favicon || getSiteFaviconUrl(activeTab.url, 32),
        folder: 'Bookmarks Bar'
      })
    }
  }

  const handleApplyLiveCss = async (): Promise<void> => {
    if (cssDraft.includes('</style>') || cssDraft.includes('<script')) {
      setCssError('Invalid characters detected in CSS block.')
      return
    }
    setCssError('')
    await window.kinetic.updateCustomization({ customCss: cssDraft })
  }

  const handleCustomSoundUpload = (
    eventKey: SoundEventId,
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      window.kinetic.updateCustomization({
        sounds: {
          ...custom.sounds,
          events: {
            ...custom.sounds.events,
            [eventKey]: {
              ...custom.sounds.events[eventKey],
              customAudioDataUrl: dataUrl
            }
          }
        }
      })
    }
    reader.readAsDataURL(file)
  }

  const handleExportProfileJson = (): void => {
    const json = JSON.stringify(custom, null, 2)
    navigator.clipboard.writeText(json)
    setImportJsonInput(json)
  }

  const handleCreateFolder = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!newFolderInput.trim()) return
    await window.kinetic.createBookmarkFolder(newFolderInput.trim())
    setNewFolderInput('')
  }

  const handleCreateProfile = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!newProfileName.trim()) return
    await window.kinetic.createProfile(newProfileName.trim(), newProfileColor)
    setNewProfileName('')
  }

  const handleSaveSettings = async (): Promise<void> => {
    const updated = await window.kinetic.updateSettings({
      homepageUrl: homepageDraft,
      newTabUrl: newTabDraft
    })
    setHomepageDraft(updated.homepageUrl)
    setNewTabDraft(updated.newTabUrl)
  }

  const filteredHistory = history.filter(
    (h) =>
      h.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.url.toLowerCase().includes(historySearch.toLowerCase())
  )

  const filteredBookmarks =
    selectedFolder === 'ALL'
      ? bookmarks
      : bookmarks.filter((b) => b.folder === selectedFolder)

  const renderTabItem = (tab: TabState): JSX.Element => {
    const isActive = tab.id === activeTabId
    const displayTitle = tab.customStyle?.customTitle?.trim() || tab.title
    const tabInlineStyle: React.CSSProperties = {}
    if (tab.customStyle?.customBg) {
      tabInlineStyle.backgroundColor = tab.customStyle.customBg
    }
    if (tab.customStyle?.customColor) {
      tabInlineStyle.borderColor = tab.customStyle.customColor
    }

    return (
      <div
        key={tab.id}
        style={tabInlineStyle}
        className={`kb-tab ${isActive ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''} ${tab.isPrivate ? 'private' : ''}`}
        onClick={() => handleSwitchTab(tab.id)}
        onAuxClick={(e) => {
          if (e.button === 1) handleCloseTab(tab.id)
        }}
        title={`${displayTitle}${tab.url !== KINETIC_NEWTAB_URL ? `\n${tab.url}` : ''}${tab.isPrivate ? '\n[Private Session]' : ''}`}
      >
        {tab.isPrivate ? (
          <EyeOff size={13} color="#d896ff" style={{ flexShrink: 0 }} />
        ) : tab.favicon ? (
          <img src={tab.favicon} alt="" className="kb-tab-favicon" />
        ) : (
          <Globe
            size={13}
            style={{
              flexShrink: 0,
              opacity: 0.75,
              color: tab.customStyle?.customColor || undefined
            }}
          />
        )}

        {!tab.isPinned && (
          <>
            {tab.isPrivate && <span className="kb-private-tag">PRIV</span>}
            <span
              className="kb-tab-title"
              style={
                tab.customStyle?.customColor ? { color: tab.customStyle.customColor } : undefined
              }
            >
              {displayTitle}
            </span>
          </>
        )}

        {(tab.isAudioPlaying || tab.isMuted) && (
          <button
            type="button"
            className="kb-tab-action-btn"
            title={tab.isMuted ? 'Unmute Tab' : 'Mute Tab'}
            onClick={(e) => {
              e.stopPropagation()
              window.kinetic.toggleMuteTab(tab.id)
            }}
          >
            {tab.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        )}

        {!tab.isPinned && (
          <button
            type="button"
            className="kb-tab-action-btn"
            title="Close Tab"
            onClick={(e) => {
              e.stopPropagation()
              handleCloseTab(tab.id)
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    )
  }

  const renderNavbarRow = (isBottom = false): JSX.Element => (
    <div className={`kb-navbar-row ${isBottom ? 'bottom' : ''}`}>
      <div className="kb-nav-group">
        <button
          type="button"
          className="kb-icon-btn"
          disabled={!activeTab?.canGoBack}
          onClick={() => {
            triggerSound('click')
            window.kinetic.goBack()
          }}
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          type="button"
          className="kb-icon-btn"
          disabled={!activeTab?.canGoForward}
          onClick={() => {
            triggerSound('click')
            window.kinetic.goForward()
          }}
          title="Forward"
        >
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          className="kb-icon-btn"
          onClick={() => {
            triggerSound('click')
            activeTab?.isLoading ? window.kinetic.stop() : window.kinetic.reload()
          }}
          title={activeTab?.isLoading ? 'Stop Loading' : 'Reload Page'}
        >
          {activeTab?.isLoading ? <X size={16} /> : <RotateCw size={15} />}
        </button>
        {custom.taskbar.showHomeButton && (
          <button
            type="button"
            className="kb-icon-btn"
            onClick={() => {
              triggerSound('navigate')
              window.kinetic.goHome()
            }}
            title="Home / New Tab Studio"
          >
            <Home size={15} />
          </button>
        )}
      </div>

      {/* Customizable Search / Address Bar Slot */}
      <div className={`kb-omnibox-slot align-${custom.searchBar.alignment}`}>
        <form className="kb-omnibox-form" onSubmit={handleNavigateSubmit}>
          {custom.searchBar.showSecurityBadge &&
            (activeTab?.isPrivate ? (
              <span className="kb-security-badge private" title="Private Tab">
                <EyeOff size={12} />
                <span>PRIVATE</span>
              </span>
            ) : isNewTabActive ? (
              <span
                className="kb-security-badge neutral"
                title={`Active Search Engine: ${currentEngine.name}`}
              >
                <Search size={12} />
                <span>{currentEngine.name.toUpperCase()}</span>
              </span>
            ) : activeTab?.hasCertError ? (
              <span className="kb-security-badge error" title="Invalid TLS Certificate Blocked">
                <ShieldAlert size={13} />
                <span>CERT ERROR</span>
              </span>
            ) : activeTab?.isSecure ? (
              <span className="kb-security-badge secure" title="Encrypted HTTPS Connection">
                <ShieldCheck size={13} />
                <span>HTTPS</span>
              </span>
            ) : (
              <span className="kb-security-badge insecure" title="Unencrypted Connection">
                <ShieldAlert size={13} />
                <span>HTTP</span>
              </span>
            ))}

          <input
            type="text"
            className="kb-omnibox-input"
            value={addressInput}
            onFocus={(e) => {
              setIsAddressFocused(true)
              e.currentTarget.select()
            }}
            onBlur={() => setIsAddressFocused(false)}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder={`Search with ${currentEngine.name} or enter web address...`}
            spellCheck={false}
          />

          {/* Live Per-Tab Ad/Tracker Block Badge inside Omnibox */}
          {activeTab && !isNewTabActive && activeTab.blockedCount > 0 && (
            <button
              type="button"
              className="kb-security-badge neutral"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={() => openDrawerPanel('shield')}
              title={`${activeTab.blockedCount} Ads/Trackers blocked on this page (Click to inspect)`}
            >
              <Shield size={11} />
              <span>{activeTab.blockedCount}</span>
            </button>
          )}

          {!isNewTabActive && (
            <button
              type="button"
              className={`kb-star-btn ${currentBookmark ? 'bookmarked' : ''}`}
              onClick={handleToggleBookmarkActiveTab}
              title={currentBookmark ? 'Remove Bookmark' : 'Bookmark This Page'}
            >
              <Star size={15} fill={currentBookmark ? 'currentColor' : 'none'} />
            </button>
          )}
        </form>
      </div>

      <div className="kb-nav-group">
        {activeTab && custom.taskbar.showPinButton && (
          <button
            type="button"
            className={`kb-icon-btn ${activeTab.isPinned ? 'active' : ''}`}
            onClick={() => {
              triggerSound('click')
              window.kinetic.togglePinTab(activeTab.id)
            }}
            title={activeTab.isPinned ? 'Unpin Tab' : 'Pin Tab'}
          >
            <Pin size={15} />
          </button>
        )}

        {activeTab && custom.taskbar.showDuplicateButton && (
          <button
            type="button"
            className="kb-icon-btn"
            onClick={() => {
              triggerSound('tabOpen')
              window.kinetic.duplicateTab(activeTab.id)
            }}
            title="Duplicate Tab"
          >
            <Copy size={15} />
          </button>
        )}

        {/* Phase 5: Kinetic Privacy Shield Trigger */}
        <button
          type="button"
          className={`kb-icon-btn ${activeDrawer === 'shield' ? 'active' : ''}`}
          onClick={() => toggleDrawerPanel('shield')}
          title={`Kinetic Privacy Shield (${privacyStats.adsBlocked + privacyStats.trackersBlocked} total blocked)`}
        >
          <Shield size={15} />
        </button>

        {/* Phase 5: Security & Permissions Dashboard Trigger */}
        <button
          type="button"
          className={`kb-icon-btn ${activeDrawer === 'security' ? 'active' : ''}`}
          onClick={() => toggleDrawerPanel('security')}
          title="Security & Permissions Dashboard"
        >
          <Lock size={15} />
        </button>

        {/* Phase 4: Extreme Customization Studio Trigger */}
        <button
          type="button"
          className={`kb-icon-btn ${activeDrawer === 'customize' ? 'active' : ''}`}
          onClick={() => toggleDrawerPanel('customize')}
          title="Extreme Customization Studio"
        >
          <Palette size={15} />
        </button>

        {custom.taskbar.showPrivateButton && (
          <button
            type="button"
            className="kb-icon-btn"
            onClick={() => handleCreateTab(undefined, true)}
            title="New Private Tab"
          >
            <EyeOff size={15} />
          </button>
        )}

        {custom.taskbar.showBookmarksButton && (
          <button
            type="button"
            className={`kb-icon-btn ${activeDrawer === 'bookmarks' ? 'active' : ''}`}
            onClick={() => toggleDrawerPanel('bookmarks')}
            title="Bookmarks"
          >
            <Bookmark size={15} />
          </button>
        )}

        {custom.taskbar.showHistoryButton && (
          <button
            type="button"
            className={`kb-icon-btn ${activeDrawer === 'history' ? 'active' : ''}`}
            onClick={() => toggleDrawerPanel('history')}
            title="History"
          >
            <History size={15} />
          </button>
        )}

        {custom.taskbar.showDownloadsButton && (
          <button
            type="button"
            className={`kb-icon-btn ${activeDrawer === 'downloads' ? 'active' : ''}`}
            onClick={() => toggleDrawerPanel('downloads')}
            title="Downloads"
          >
            <Download size={15} />
            {hasActiveDownloads && <span className="kb-badge-dot" />}
          </button>
        )}

        {custom.taskbar.showProfilesButton && (
          <button
            type="button"
            className={`kb-icon-btn ${activeDrawer === 'profiles' ? 'active' : ''}`}
            onClick={() => toggleDrawerPanel('profiles')}
            title="User Profiles"
          >
            <Users size={15} />
          </button>
        )}

        {custom.taskbar.showDevToolsButton && (
          <button
            type="button"
            className="kb-icon-btn"
            onClick={() => window.kinetic.toggleDevTools()}
            title="Developer Tools"
          >
            <Terminal size={15} />
          </button>
        )}

        <button
          type="button"
          className={`kb-icon-btn ${activeDrawer === 'settings' ? 'active' : ''}`}
          onClick={() => toggleDrawerPanel('settings')}
          title="General Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <div
      className={`kb-shell ${!custom.appearance.enableAnimations ? 'no-animations' : ''} ${custom.appearance.rgbCycleMode ? 'rgb-mode' : ''}`}
    >
      {/* TOP CHROME */}
      <header>
        <div className="kb-tabstrip-row">
          {custom.tabs.orientation === 'horizontal' ? (
            <div className="kb-tabs-container">
              {tabs.map((tab) => renderTabItem(tab))}
              <button
                type="button"
                className="kb-newtab-btn"
                title="New Tab"
                onClick={() => handleCreateTab()}
              >
                <Plus size={15} />
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--kb-text-secondary)', paddingLeft: 6 }}>
              VERTICAL TABS MODE •{' '}
              {activeTab?.customStyle?.customTitle || activeTab?.title || 'Kinetic'}
            </div>
          )}

          <div className="kb-window-controls">
            <button
              type="button"
              className="kb-win-btn"
              title="Minimize"
              onClick={() => window.kinetic.minimizeWindow()}
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              className="kb-win-btn"
              title="Maximize / Restore"
              onClick={() => window.kinetic.maximizeOrRestoreWindow()}
            >
              <Square size={12} />
            </button>
            <button
              type="button"
              className="kb-win-btn close"
              title="Close Kinetic Browser"
              onClick={() => window.kinetic.closeWindow()}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {custom.taskbar.position === 'top' && renderNavbarRow(false)}

        {settings.showBookmarksBar && (
          <div className="kb-bookmarks-bar">
            {bookmarks.map((bm) => {
              const iconSrc = bm.favicon || getSiteFaviconUrl(bm.url, 32)
              return (
                <button
                  key={bm.id}
                  type="button"
                  className="kb-bm-pill"
                  onClick={() => {
                    triggerSound('navigate')
                    window.kinetic.navigate(bm.url)
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1) handleCreateTab(bm.url)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    window.kinetic.removeBookmark(bm.id)
                  }}
                  title={`${bm.title}\n${bm.url}\n(Right-click to remove)`}
                >
                  {iconSrc ? (
                    <img src={iconSrc} alt="" className="kb-bm-icon" />
                  ) : (
                    <Globe size={12} color="var(--kb-accent)" />
                  )}
                  <span>{bm.title}</span>
                </button>
              )
            })}

            <button
              type="button"
              className="kb-bm-pill add-pill"
              onClick={() => openDrawerPanel('bookmarks')}
              title="Add a Custom Bookmark"
            >
              <Plus size={12} />
              <span>Add Bookmark</span>
            </button>
          </div>
        )}
      </header>

      {/* MAIN WORKSPACE */}
      <main className="kb-workspace">
        {custom.tabs.orientation === 'vertical' && (
          <aside className="kb-vertical-tabs-sidebar">
            {tabs.map((tab) => renderTabItem(tab))}
            <button
              type="button"
              className="kb-btn"
              style={{ flex: '0 0 32px', marginTop: 4 }}
              onClick={() => handleCreateTab()}
            >
              + New Tab
            </button>
          </aside>
        )}

        {isNewTabActive ? (
          <section className="kb-newtab-studio">
            <div className="kb-newtab-inner">
              <div className="kb-clock-block">
                <div className="kb-clock-time">
                  {clockNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="kb-clock-date">
                  {clockNow.toLocaleDateString([], {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                  {activeTab?.isPrivate ? ' • PRIVATE SESSION' : ''}
                </div>
              </div>

              <form className="kb-newtab-search-form" onSubmit={handleNewTabSearchSubmit}>
                <select
                  className="kb-engine-selector-pill"
                  value={settings.searchEngine}
                  onChange={(e) =>
                    window.kinetic.updateSettings({
                      searchEngine: e.target.value as SearchEngineId
                    })
                  }
                  title="Switch Active Search Engine"
                >
                  {Object.values(SEARCH_ENGINES).map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  className="kb-newtab-search-input"
                  value={newTabSearchQuery}
                  onChange={(e) => setNewTabSearchQuery(e.target.value)}
                  placeholder={`Search the web with ${currentEngine.name} or type a URL...`}
                  autoFocus
                />

                <button type="submit" className="kb-newtab-search-btn">
                  Search
                </button>
              </form>

              <div className="kb-speed-dial-grid">
                {quickLinks.map((item) => (
                  <div
                    key={item.id}
                    className="kb-speed-card"
                    onClick={() => {
                      triggerSound('navigate')
                      window.kinetic.navigate(item.url)
                    }}
                    onAuxClick={(e) => {
                      if (e.button === 1) handleCreateTab(item.url)
                    }}
                    title={item.url}
                  >
                    <button
                      type="button"
                      className="kb-speed-remove-btn"
                      title={`Remove ${item.title}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.kinetic.removeQuickLink(item.id)
                      }}
                    >
                      <X size={12} />
                    </button>
                    <div className="kb-speed-icon-box">
                      <img
                        src={item.iconUrl || getSiteFaviconUrl(item.url, 64)}
                        alt={item.title}
                        className="kb-speed-logo-img"
                      />
                    </div>
                    <span className="kb-speed-label">{item.title}</span>
                  </div>
                ))}

                <div
                  className="kb-speed-card add-card"
                  onClick={() => setIsAddingQuickLink(!isAddingQuickLink)}
                  title="Add Custom Shortcut to New Tab"
                >
                  <div className="kb-speed-icon-box">
                    <Plus size={22} />
                  </div>
                  <span className="kb-speed-label">Add Shortcut</span>
                </div>
              </div>

              {isAddingQuickLink && (
                <form className="kb-add-shortcut-box" onSubmit={handleAddQuickLinkSubmit}>
                  <input
                    type="text"
                    className="kb-input"
                    style={{ width: 170 }}
                    placeholder="Name (e.g. Twitch)"
                    value={customQuickTitle}
                    onChange={(e) => setCustomQuickTitle(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="text"
                    className="kb-input"
                    style={{ flex: 1 }}
                    placeholder="URL (e.g. twitch.tv)"
                    value={customQuickUrl}
                    onChange={(e) => setCustomQuickUrl(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="kb-btn primary"
                    style={{ flex: '0 0 auto', padding: '0 16px' }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="kb-btn"
                    style={{ flex: '0 0 auto' }}
                    onClick={() => setIsAddingQuickLink(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </section>
        ) : (
          <div className="kb-webview-placeholder" />
        )}

        {/* RIGHT MULTI-PANEL DRAWER */}
        {activeDrawer !== 'none' && (
          <aside className="kb-settings-drawer">
            <div className="kb-drawer-header">
              <span className="kb-drawer-title">
                {activeDrawer === 'shield'
                  ? 'KINETIC PRIVACY SHIELD'
                  : activeDrawer === 'security'
                    ? 'SECURITY & PERMISSIONS'
                    : activeDrawer === 'customize'
                      ? 'EXTREME CUSTOMIZATION ENGINE'
                      : activeDrawer}
              </span>
              <button
                type="button"
                className="kb-tab-action-btn"
                onClick={() => toggleDrawerPanel('none')}
                title="Close Drawer"
              >
                <X size={15} />
              </button>
            </div>

            {/* =============================================================== */}
            {/* PHASE 5: PRIVACY ENGINE & WEBSITE SCRUBBER DASHBOARD            */}
            {/* =============================================================== */}
            {activeDrawer === 'shield' && (
              <>
                <div className="kb-subtab-strip">
                  {(
                    [
                      ['overview', 'Shield & Stats'],
                      ['scrubber', 'DOM Scrubber'],
                      ['rules', 'Filter Rules'],
                      ['logs', `Live Log (${blockedLogs.length})`]
                    ] as [ShieldSubTabId, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`kb-subtab-btn ${shieldSubTab === id ? 'active' : ''}`}
                      onClick={() => setShieldSubTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {shieldSubTab === 'overview' && (
                  <div className="kb-list-container">
                    {/* Telemetry Counters Grid */}
                    <div className="kb-theme-grid">
                      <div className="kb-card-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="kb-setting-desc">Ads Blocked</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--kb-accent)' }}>
                          {privacyStats.adsBlocked}
                        </span>
                      </div>
                      <div className="kb-card-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="kb-setting-desc">Trackers Blocked</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--kb-secure)' }}>
                          {privacyStats.trackersBlocked}
                        </span>
                      </div>
                      <div className="kb-card-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="kb-setting-desc">URL Params Stripped</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--kb-warning)' }}>
                          {privacyStats.paramsStripped}
                        </span>
                      </div>
                      <div className="kb-card-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="kb-setting-desc">Est. Data Saved</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--kb-text-primary)' }}>
                          {formatBytes(privacyStats.estimatedBytesSaved)}
                        </span>
                      </div>
                    </div>

                    {/* Per-Site Shield Whitelist Toggle */}
                    {activeHostname && (
                      <div
                        className="kb-card-item"
                        style={{
                          borderColor: isCurrentSiteWhitelisted
                            ? 'var(--kb-warning)'
                            : 'var(--kb-secure)'
                        }}
                      >
                        <div className="kb-card-main">
                          <span className="kb-card-title">Site: {activeHostname}</span>
                          <span className="kb-card-sub">
                            {isCurrentSiteWhitelisted
                              ? 'Shield Disabled (Whitelisted)'
                              : `Shield Active • ${activeTab?.blockedCount || 0} blocked on this tab`}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`kb-btn ${isCurrentSiteWhitelisted ? 'primary' : 'danger'}`}
                          style={{ flex: '0 0 auto' }}
                          onClick={() => window.kinetic.toggleDomainWhitelist(activeHostname)}
                        >
                          {isCurrentSiteWhitelisted ? 'Enable Shield' : 'Whitelist Site'}
                        </button>
                      </div>
                    )}

                    <div className="kb-checkbox-row">
                      <div>
                        <div className="kb-setting-label">Native Ad Blocker (EasyList Core)</div>
                        <div className="kb-setting-desc">Block ad networks & video pre-roll domains</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyConfig.adBlockEnabled}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({ adBlockEnabled: e.target.checked })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <div>
                        <div className="kb-setting-label">Third-Party Tracker Blocker</div>
                        <div className="kb-setting-desc">Block analytics, telemetry & behavioral pixels</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyConfig.trackerBlockEnabled}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({
                            trackerBlockEnabled: e.target.checked
                          })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <div>
                        <div className="kb-setting-label">Strip URL Tracking Parameters</div>
                        <div className="kb-setting-desc">Remove utm_*, fbclid, gclid, msclkid on navigate</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyConfig.stripTrackingParams}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({
                            stripTrackingParams: e.target.checked
                          })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <div>
                        <div className="kb-setting-label">Automatic HTTPS Upgrade</div>
                        <div className="kb-setting-desc">Upgrade unencrypted HTTP links to HTTPS</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyConfig.httpsUpgrade}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({ httpsUpgrade: e.target.checked })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <div>
                        <div className="kb-setting-label">Fingerprinting & GPC Defense</div>
                        <div className="kb-setting-desc">Enforce Global Privacy Control (Sec-GPC: 1) & DNT</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyConfig.fingerprintProtection}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({
                            fingerprintProtection: e.target.checked,
                            sendDoNotTrack: e.target.checked
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Encrypted DNS-over-HTTPS (DoH)</label>
                      <select
                        className="kb-select"
                        value={privacyConfig.dohProvider}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({
                            dohProvider: e.target.value as DohProviderId
                          })
                        }
                      >
                        <option value="cloudflare">Cloudflare (1.1.1.1 Encrypted DoH)</option>
                        <option value="quad9">Quad9 (9.9.9.9 Malware-Blocking DoH)</option>
                        <option value="mullvad">Mullvad Privacy DoH</option>
                        <option value="system">System Default DNS</option>
                      </select>
                    </div>
                  </div>
                )}

                {shieldSubTab === 'scrubber' && (
                  <div className="kb-list-container">
                    <span className="kb-setting-desc">
                      Non-destructively hides residual page ad containers, sponsored widgets, and
                      cookie walls. You can restore hidden elements at any time with 1 click.
                    </span>

                    <div className="kb-card-item">
                      <div className="kb-card-main">
                        <span className="kb-card-title">
                          Scrubbed on Active Tab: {activeTab?.scrubbedElementsCount || 0} elements
                        </span>
                        <span className="kb-card-sub">
                          Total Scrubbed Session-Wide: {privacyStats.elementsScrubbed}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="kb-btn primary"
                        style={{ flex: '0 0 auto' }}
                        onClick={() => window.kinetic.toggleRestoreScrubbedElements()}
                      >
                        {activeTab?.isScrubberRestored ? 'Re-Apply Scrubber' : 'Restore Elements'}
                      </button>
                    </div>

                    <div className="kb-checkbox-row">
                      <span className="kb-setting-label">Enable Cosmetic DOM Scrubber</span>
                      <input
                        type="checkbox"
                        checked={privacyConfig.domScrubberEnabled}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({
                            domScrubberEnabled: e.target.checked
                          })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <span className="kb-setting-label">Scrub Sponsored Content Cards</span>
                      <input
                        type="checkbox"
                        checked={privacyConfig.scrubSponsoredCards}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({
                            scrubSponsoredCards: e.target.checked
                          })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <span className="kb-setting-label">Scrub Intrusive Cookie Banners</span>
                      <input
                        type="checkbox"
                        checked={privacyConfig.scrubCookieBanners}
                        onChange={(e) =>
                          window.kinetic.updatePrivacyConfig({
                            scrubCookieBanners: e.target.checked
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {shieldSubTab === 'rules' && (
                  <div className="kb-list-container">
                    <form
                      className="kb-setting-group"
                      onSubmit={async (e) => {
                        e.preventDefault()
                        if (!newBlockRuleInput.trim()) return
                        await window.kinetic.addCustomBlockRule(newBlockRuleInput.trim())
                        setNewBlockRuleInput('')
                      }}
                    >
                      <label className="kb-setting-label">Add Custom Filter Rule</label>
                      <span className="kb-setting-desc">
                        Supports EasyList domain syntax (e.g. <code>||ads.example.com^</code>) or URL
                        substrings.
                      </span>
                      <div className="kb-btn-row">
                        <input
                          type="text"
                          className="kb-input"
                          style={{ flex: 1 }}
                          placeholder="||ads.example.com^"
                          value={newBlockRuleInput}
                          onChange={(e) => setNewBlockRuleInput(e.target.value)}
                        />
                        <button type="submit" className="kb-btn primary" style={{ flex: '0 0 auto' }}>
                          Add Rule
                        </button>
                      </div>
                    </form>

                    <label className="kb-setting-label" style={{ marginTop: 6 }}>
                      Custom Filter Rules ({privacyConfig.customBlockRules.length})
                    </label>
                    {privacyConfig.customBlockRules.length === 0 ? (
                      <div className="kb-empty-state">No custom block rules added yet.</div>
                    ) : (
                      privacyConfig.customBlockRules.map((rule) => (
                        <div key={rule} className="kb-card-item">
                          <span className="kb-card-title">{rule}</span>
                          <button
                            type="button"
                            className="kb-tab-action-btn"
                            onClick={() => window.kinetic.removeCustomBlockRule(rule)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}

                    <label className="kb-setting-label" style={{ marginTop: 8 }}>
                      Whitelisted Websites ({privacyConfig.whitelistedDomains.length})
                    </label>
                    {privacyConfig.whitelistedDomains.map((dom) => (
                      <div key={dom} className="kb-card-item">
                        <span className="kb-card-title">{dom}</span>
                        <button
                          type="button"
                          className="kb-tab-action-btn"
                          onClick={() => window.kinetic.toggleDomainWhitelist(dom)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {shieldSubTab === 'logs' && (
                  <div className="kb-list-container">
                    <div className="kb-btn-row">
                      <button
                        type="button"
                        className="kb-btn"
                        onClick={() => window.kinetic.clearBlockedLogs()}
                      >
                        Clear Inspection Log
                      </button>
                    </div>
                    {blockedLogs.length === 0 ? (
                      <div className="kb-empty-state">
                        No blocked requests logged yet. Browse a website to see live interceptions.
                      </div>
                    ) : (
                      blockedLogs.map((log) => (
                        <div key={log.id} className="kb-card-item">
                          <div className="kb-card-main">
                            <span className="kb-card-title">
                              [{log.category.toUpperCase()}] {log.domain}
                            </span>
                            <span className="kb-card-sub">
                              Rule: {log.ruleMatched} • {log.url}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {/* =============================================================== */}
            {/* PHASE 5: SECURITY & PERMISSIONS DASHBOARD                       */}
            {/* =============================================================== */}
            {activeDrawer === 'security' && (
              <div className="kb-list-container">
                <span className="kb-setting-desc">
                  All tabs execute in isolated Chromium sandboxes (`sandbox: true`,
                  `contextIsolation: true`) with strict TLS validation.
                </span>

                <div className="kb-checkbox-row">
                  <div>
                    <div className="kb-setting-label">Block Dangerous Script Downloads</div>
                    <div className="kb-setting-desc">Block automatic .bat, .cmd, .scr, .vbs downloads</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityConfig.blockDangerousDownloads}
                    onChange={(e) =>
                      window.kinetic.updateSecurityConfig({
                        blockDangerousDownloads: e.target.checked
                      })
                    }
                  />
                </div>

                <label className="kb-setting-label" style={{ marginTop: 6 }}>
                  Default Hardware & Sensor Permissions
                </label>
                {(Object.keys(PERMISSION_LABELS) as PermissionType[]).map((perm) => (
                  <div key={perm} className="kb-setting-row">
                    <span className="kb-setting-desc">{PERMISSION_LABELS[perm]}</span>
                    <select
                      className="kb-select"
                      style={{ width: 110 }}
                      value={securityConfig.defaultPermissions[perm]}
                      onChange={(e) =>
                        window.kinetic.updateSecurityConfig({
                          defaultPermissions: {
                            ...securityConfig.defaultPermissions,
                            [perm]: e.target.value as PermissionPolicy
                          }
                        })
                      }
                    >
                      <option value="block">Block</option>
                      <option value="allow">Allow</option>
                    </select>
                  </div>
                ))}

                <form
                  className="kb-setting-group"
                  style={{ marginTop: 8 }}
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!newPermOriginInput.trim()) return
                    await window.kinetic.setSitePermission(
                      newPermOriginInput.trim(),
                      newPermTypeInput,
                      newPermPolicyInput
                    )
                    setNewPermOriginInput('')
                  }}
                >
                  <label className="kb-setting-label">Add Per-Site Permission Rule</label>
                  <input
                    type="text"
                    className="kb-input"
                    placeholder="Domain (e.g. discord.com)"
                    value={newPermOriginInput}
                    onChange={(e) => setNewPermOriginInput(e.target.value)}
                  />
                  <div className="kb-btn-row">
                    <select
                      className="kb-select"
                      style={{ flex: 1 }}
                      value={newPermTypeInput}
                      onChange={(e) => setNewPermTypeInput(e.target.value as PermissionType)}
                    >
                      {(Object.keys(PERMISSION_LABELS) as PermissionType[]).map((p) => (
                        <option key={p} value={p}>
                          {PERMISSION_LABELS[p]}
                        </option>
                      ))}
                    </select>
                    <select
                      className="kb-select"
                      value={newPermPolicyInput}
                      onChange={(e) => setNewPermPolicyInput(e.target.value as PermissionPolicy)}
                    >
                      <option value="allow">Allow</option>
                      <option value="block">Block</option>
                    </select>
                    <button type="submit" className="kb-btn primary" style={{ flex: '0 0 auto' }}>
                      Save
                    </button>
                  </div>
                </form>

                {securityConfig.sitePermissions.length > 0 && (
                  <>
                    <label className="kb-setting-label" style={{ marginTop: 6 }}>
                      Site Permission Rules
                    </label>
                    {securityConfig.sitePermissions.map((rule) => (
                      <div key={rule.id} className="kb-card-item">
                        <div className="kb-card-main">
                          <span className="kb-card-title">{rule.origin}</span>
                          <span className="kb-card-sub">
                            {PERMISSION_LABELS[rule.permission]} •{' '}
                            <strong
                              style={{
                                color:
                                  rule.policy === 'allow'
                                    ? 'var(--kb-secure)'
                                    : 'var(--kb-danger)'
                              }}
                            >
                              {rule.policy.toUpperCase()}
                            </strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          className="kb-tab-action-btn"
                          onClick={() => window.kinetic.removeSitePermission(rule.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Granular Clear Browsing Data */}
                <div
                  className="kb-card-item"
                  style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: 10 }}
                >
                  <span className="kb-setting-label">Granular Data Scrubber</span>
                  <div className="kb-checkbox-row">
                    <span className="kb-setting-desc">Cookies & Site Storage</span>
                    <input
                      type="checkbox"
                      checked={clearCookiesCheck}
                      onChange={(e) => setClearCookiesCheck(e.target.checked)}
                    />
                  </div>
                  <div className="kb-checkbox-row">
                    <span className="kb-setting-desc">Cached Images & Files</span>
                    <input
                      type="checkbox"
                      checked={clearCacheCheck}
                      onChange={(e) => setClearCacheCheck(e.target.checked)}
                    />
                  </div>
                  <div className="kb-checkbox-row">
                    <span className="kb-setting-desc">Browsing History</span>
                    <input
                      type="checkbox"
                      checked={clearHistoryCheck}
                      onChange={(e) => setClearHistoryCheck(e.target.checked)}
                    />
                  </div>
                  <button
                    type="button"
                    className="kb-btn danger"
                    onClick={() =>
                      window.kinetic.clearBrowsingData({
                        cookies: clearCookiesCheck,
                        cache: clearCacheCheck,
                        history: clearHistoryCheck,
                        downloads: false
                      })
                    }
                  >
                    Purge Selected Browsing Data
                  </button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* PHASE 4: EXTREME CUSTOMIZATION STUDIO                           */}
            {/* =============================================================== */}
            {activeDrawer === 'customize' && (
              <>
                <div className="kb-subtab-strip">
                  {(
                    [
                      ['themes', 'Themes'],
                      ['appearance', 'Colors & Fonts'],
                      ['taskbar', 'Taskbar'],
                      ['tabs', 'Tabs'],
                      ['searchbar', 'Search Bar'],
                      ['sounds', 'Sounds'],
                      ['css', 'Custom CSS']
                    ] as [CustomizeTabId, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`kb-subtab-btn ${customizeSubTab === id ? 'active' : ''}`}
                      onClick={() => {
                        triggerSound('click')
                        setCustomizeSubTab(id)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {customizeSubTab === 'themes' && (
                  <div className="kb-list-container">
                    <span className="kb-setting-desc">
                      Active Profile: <strong>{custom.name}</strong>. Switch instantly between 10
                      built-in presets or save unlimited custom profiles.
                    </span>

                    <div className="kb-theme-grid">
                      {savedThemes.map((theme) => (
                        <div
                          key={theme.id}
                          className={`kb-theme-card ${custom.id === theme.id ? 'active' : ''}`}
                          onClick={() => {
                            triggerSound('click')
                            window.kinetic.applyThemePreset(theme.id)
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="kb-card-title">{theme.name}</span>
                            {!theme.isBuiltIn && (
                              <button
                                type="button"
                                className="kb-tab-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.kinetic.deleteCustomTheme(theme.id)
                                }}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <div className="kb-theme-swatches">
                            <span
                              className="kb-theme-dot"
                              style={{ background: theme.appearance.bgPrimary }}
                            />
                            <span
                              className="kb-theme-dot"
                              style={{ background: theme.appearance.bgElevated }}
                            />
                            <span
                              className="kb-theme-dot"
                              style={{ background: theme.appearance.accentPrimary }}
                            />
                            <span
                              className="kb-theme-dot"
                              style={{ background: theme.appearance.accentSecondary }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="kb-setting-group" style={{ marginTop: 8 }}>
                      <label className="kb-setting-label">Save Current Look as Profile</label>
                      <div className="kb-btn-row">
                        <input
                          type="text"
                          className="kb-input"
                          style={{ flex: 1 }}
                          placeholder="Theme name (e.g. OLED Red)"
                          value={customThemeNameInput}
                          onChange={(e) => setCustomThemeNameInput(e.target.value)}
                        />
                        <button
                          type="button"
                          className="kb-btn primary"
                          style={{ flex: '0 0 auto' }}
                          onClick={async () => {
                            await window.kinetic.saveCustomTheme(customThemeNameInput)
                            setCustomThemeNameInput('')
                          }}
                        >
                          Save Theme
                        </button>
                      </div>
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Import / Export Profile JSON</label>
                      <textarea
                        className="kb-css-editor"
                        style={{ height: 76 }}
                        placeholder="Paste Customization JSON here to import..."
                        value={importJsonInput}
                        onChange={(e) => setImportJsonInput(e.target.value)}
                      />
                      <div className="kb-btn-row">
                        <button
                          type="button"
                          className="kb-btn"
                          onClick={handleExportProfileJson}
                        >
                          Copy Current JSON
                        </button>
                        <button
                          type="button"
                          className="kb-btn primary"
                          onClick={() => {
                            if (importJsonInput.trim()) {
                              window.kinetic.importCustomizationJson(importJsonInput.trim())
                            }
                          }}
                        >
                          Import JSON
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="kb-btn danger"
                      onClick={() => window.kinetic.resetCustomization()}
                    >
                      <RotateCcw size={12} style={{ marginRight: 6 }} />
                      Reset Entire Customization Engine
                    </button>
                  </div>
                )}

                {customizeSubTab === 'appearance' && (
                  <div className="kb-list-container">
                    {(
                      [
                        ['bgPrimary', 'Window Background'],
                        ['bgElevated', 'Elevated Panels & Cards'],
                        ['textPrimary', 'Primary Text Color'],
                        ['textSecondary', 'Secondary Muted Text'],
                        ['accentPrimary', 'Primary Accent Color'],
                        ['accentSecondary', 'Secondary Accent Color'],
                        ['borderColor', 'Global Border Color']
                      ] as [keyof CustomizationProfile['appearance'], string][]
                    ).map(([key, label]) => (
                      <div key={key} className="kb-setting-row">
                        <span className="kb-setting-label">{label}</span>
                        <input
                          type="color"
                          value={String(custom.appearance[key])}
                          onChange={(e) =>
                            window.kinetic.updateCustomization({
                              appearance: { ...custom.appearance, [key]: e.target.value }
                            })
                          }
                        />
                      </div>
                    ))}

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Border Thickness ({custom.appearance.borderWidth}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={4}
                        value={custom.appearance.borderWidth}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            appearance: {
                              ...custom.appearance,
                              borderWidth: Number(e.target.value)
                            }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Global Corner Radius ({custom.appearance.borderRadius}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={custom.appearance.borderRadius}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            appearance: {
                              ...custom.appearance,
                              borderRadius: Number(e.target.value)
                            }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Neon Glow Intensity ({Math.round(custom.appearance.glowIntensity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={0.6}
                        step={0.02}
                        value={custom.appearance.glowIntensity}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            appearance: {
                              ...custom.appearance,
                              glowIntensity: Number(e.target.value)
                            }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Browser Font Family</label>
                      <select
                        className="kb-select"
                        value={custom.appearance.fontFamily}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            appearance: { ...custom.appearance, fontFamily: e.target.value }
                          })
                        }
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Base Font Size ({custom.appearance.fontSize}px)
                      </label>
                      <input
                        type="range"
                        min={11}
                        max={16}
                        value={custom.appearance.fontSize}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            appearance: { ...custom.appearance, fontSize: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <span className="kb-setting-label">Enable UI Animations</span>
                      <input
                        type="checkbox"
                        checked={custom.appearance.enableAnimations}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            appearance: {
                              ...custom.appearance,
                              enableAnimations: e.target.checked
                            }
                          })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <span className="kb-setting-label">Gaming RGB Chroma Cycle</span>
                      <input
                        type="checkbox"
                        checked={custom.appearance.rgbCycleMode}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            appearance: { ...custom.appearance, rgbCycleMode: e.target.checked }
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {customizeSubTab === 'taskbar' && (
                  <div className="kb-list-container">
                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Taskbar Dock Position</label>
                      <select
                        className="kb-select"
                        value={custom.taskbar.position}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            taskbar: {
                              ...custom.taskbar,
                              position: e.target.value as 'top' | 'bottom'
                            }
                          })
                        }
                      >
                        <option value="top">Top (Standard Desktop)</option>
                        <option value="bottom">Bottom (Gaming Dock)</option>
                      </select>
                    </div>

                    <div className="kb-setting-row">
                      <span className="kb-setting-label">Taskbar Background Color</span>
                      <input
                        type="color"
                        value={custom.taskbar.bgColor}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            taskbar: { ...custom.taskbar, bgColor: e.target.value }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Taskbar Height ({custom.taskbar.height}px)
                      </label>
                      <input
                        type="range"
                        min={36}
                        max={64}
                        value={custom.taskbar.height}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            taskbar: { ...custom.taskbar, height: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Button Size ({custom.taskbar.buttonSize}px)
                      </label>
                      <input
                        type="range"
                        min={26}
                        max={42}
                        value={custom.taskbar.buttonSize}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            taskbar: { ...custom.taskbar, buttonSize: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Button Spacing ({custom.taskbar.buttonSpacing}px)
                      </label>
                      <input
                        type="range"
                        min={2}
                        max={14}
                        value={custom.taskbar.buttonSpacing}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            taskbar: { ...custom.taskbar, buttonSpacing: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Visible Toolbar Buttons</label>
                      {(
                        [
                          ['showHomeButton', 'Home Button'],
                          ['showPinButton', 'Pin Tab Button'],
                          ['showDuplicateButton', 'Duplicate Tab Button'],
                          ['showPrivateButton', 'Private Tab Button'],
                          ['showBookmarksButton', 'Bookmarks Button'],
                          ['showHistoryButton', 'History Button'],
                          ['showDownloadsButton', 'Downloads Button'],
                          ['showProfilesButton', 'Profiles Button'],
                          ['showDevToolsButton', 'Developer Tools Button']
                        ] as [keyof CustomizationProfile['taskbar'], string][]
                      ).map(([key, label]) => (
                        <div key={key} className="kb-checkbox-row">
                          <span className="kb-setting-desc">{label}</span>
                          <input
                            type="checkbox"
                            checked={Boolean(custom.taskbar[key])}
                            onChange={(e) =>
                              window.kinetic.updateCustomization({
                                taskbar: { ...custom.taskbar, [key]: e.target.checked }
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customizeSubTab === 'tabs' && (
                  <div className="kb-list-container">
                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Tab Bar Orientation</label>
                      <select
                        className="kb-select"
                        value={custom.tabs.orientation}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            tabs: {
                              ...custom.tabs,
                              orientation: e.target.value as 'horizontal' | 'vertical'
                            }
                          })
                        }
                      >
                        <option value="horizontal">Horizontal Top Strip</option>
                        <option value="vertical">Vertical Left Sidebar</option>
                      </select>
                    </div>

                    {custom.tabs.orientation === 'horizontal' ? (
                      <div className="kb-setting-group">
                        <label className="kb-setting-label">
                          Tab Width ({custom.tabs.tabWidth}px)
                        </label>
                        <input
                          type="range"
                          min={120}
                          max={320}
                          value={custom.tabs.tabWidth}
                          onChange={(e) =>
                            window.kinetic.updateCustomization({
                              tabs: { ...custom.tabs, tabWidth: Number(e.target.value) }
                            })
                          }
                        />
                      </div>
                    ) : (
                      <div className="kb-setting-group">
                        <label className="kb-setting-label">
                          Vertical Sidebar Width ({custom.tabs.verticalSidebarWidth}px)
                        </label>
                        <input
                          type="range"
                          min={160}
                          max={320}
                          value={custom.tabs.verticalSidebarWidth}
                          onChange={(e) =>
                            window.kinetic.updateCustomization({
                              tabs: {
                                ...custom.tabs,
                                verticalSidebarWidth: Number(e.target.value)
                              }
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Tab Height ({custom.tabs.tabHeight}px)
                      </label>
                      <input
                        type="range"
                        min={26}
                        max={46}
                        value={custom.tabs.tabHeight}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            tabs: { ...custom.tabs, tabHeight: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Tab Corner Radius ({custom.tabs.tabRadius}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={16}
                        value={custom.tabs.tabRadius}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            tabs: { ...custom.tabs, tabRadius: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-row">
                      <span className="kb-setting-label">Active Tab Background</span>
                      <input
                        type="color"
                        value={custom.tabs.activeTabBg}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            tabs: { ...custom.tabs, activeTabBg: e.target.value }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-row">
                      <span className="kb-setting-label">Inactive Tab Background</span>
                      <input
                        type="color"
                        value={custom.tabs.inactiveTabBg}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            tabs: { ...custom.tabs, inactiveTabBg: e.target.value }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-row">
                      <span className="kb-setting-label">Active Tab Border Accent</span>
                      <input
                        type="color"
                        value={custom.tabs.activeTabBorderColor}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            tabs: { ...custom.tabs, activeTabBorderColor: e.target.value }
                          })
                        }
                      />
                    </div>

                    {activeTab && (
                      <div
                        className="kb-card-item"
                        style={{ flexDirection: 'column', alignItems: 'stretch', marginTop: 8 }}
                      >
                        <span className="kb-setting-label" style={{ color: 'var(--kb-accent)' }}>
                          Customize Current Active Tab Individually
                        </span>
                        <input
                          type="text"
                          className="kb-input"
                          placeholder="Custom tab name override..."
                          value={tabCustomTitleDraft}
                          onChange={(e) => setTabCustomTitleDraft(e.target.value)}
                        />
                        <div className="kb-setting-row">
                          <span className="kb-setting-desc">This Tab Text/Border Color</span>
                          <input
                            type="color"
                            value={tabCustomColorDraft}
                            onChange={(e) => setTabCustomColorDraft(e.target.value)}
                          />
                        </div>
                        <div className="kb-setting-row">
                          <span className="kb-setting-desc">This Tab Background</span>
                          <input
                            type="color"
                            value={tabCustomBgDraft}
                            onChange={(e) => setTabCustomBgDraft(e.target.value)}
                          />
                        </div>
                        <div className="kb-btn-row">
                          <button
                            type="button"
                            className="kb-btn primary"
                            onClick={() =>
                              window.kinetic.updateTabCustomStyle(activeTab.id, {
                                customTitle: tabCustomTitleDraft,
                                customColor: tabCustomColorDraft,
                                customBg: tabCustomBgDraft
                              })
                            }
                          >
                            Apply to This Tab
                          </button>
                          <button
                            type="button"
                            className="kb-btn"
                            onClick={() =>
                              window.kinetic.updateTabCustomStyle(activeTab.id, {
                                customTitle: undefined,
                                customColor: undefined,
                                customBg: undefined
                              })
                            }
                          >
                            Clear Tab Style
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {customizeSubTab === 'searchbar' && (
                  <div className="kb-list-container">
                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Search Bar Total Width ({custom.searchBar.widthPercent}%)
                      </label>
                      <input
                        type="range"
                        min={30}
                        max={100}
                        value={custom.searchBar.widthPercent}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: {
                              ...custom.searchBar,
                              widthPercent: Number(e.target.value)
                            }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Search Bar Alignment</label>
                      <select
                        className="kb-select"
                        value={custom.searchBar.alignment}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: {
                              ...custom.searchBar,
                              alignment: e.target.value as 'left' | 'center' | 'right'
                            }
                          })
                        }
                      >
                        <option value="left">Left Aligned</option>
                        <option value="center">Centered</option>
                        <option value="right">Right Aligned</option>
                      </select>
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Search Bar Height ({custom.searchBar.height}px)
                      </label>
                      <input
                        type="range"
                        min={26}
                        max={44}
                        value={custom.searchBar.height}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: { ...custom.searchBar, height: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Corner Radius ({custom.searchBar.borderRadius}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={22}
                        value={custom.searchBar.borderRadius}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: {
                              ...custom.searchBar,
                              borderRadius: Number(e.target.value)
                            }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-row">
                      <span className="kb-setting-label">Search Bar Background</span>
                      <input
                        type="color"
                        value={custom.searchBar.bgColor}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: { ...custom.searchBar, bgColor: e.target.value }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-row">
                      <span className="kb-setting-label">Search Bar Text Color</span>
                      <input
                        type="color"
                        value={custom.searchBar.textColor}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: { ...custom.searchBar, textColor: e.target.value }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-row">
                      <span className="kb-setting-label">Search Bar Border Color</span>
                      <input
                        type="color"
                        value={custom.searchBar.borderColor}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: { ...custom.searchBar, borderColor: e.target.value }
                          })
                        }
                      />
                    </div>

                    <div className="kb-checkbox-row">
                      <span className="kb-setting-label">Show Security / Engine Badge</span>
                      <input
                        type="checkbox"
                        checked={custom.searchBar.showSecurityBadge}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            searchBar: {
                              ...custom.searchBar,
                              showSecurityBadge: e.target.checked
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {customizeSubTab === 'sounds' && (
                  <div className="kb-list-container">
                    <div className="kb-checkbox-row">
                      <div>
                        <div className="kb-setting-label">Enable Browser Sound Effects</div>
                        <div className="kb-setting-desc">
                          Uses zero-latency Web Audio synthesis or custom audio uploads.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={custom.sounds.enabled}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            sounds: { ...custom.sounds, enabled: e.target.checked }
                          })
                        }
                      />
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">Built-In Sound Pack</label>
                      <select
                        className="kb-select"
                        value={custom.sounds.pack}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            sounds: {
                              ...custom.sounds,
                              pack: e.target.value as SoundPackId
                            }
                          })
                        }
                      >
                        <option value="sci-fi">Kinetic Sci-Fi Synth</option>
                        <option value="mechanical">Mechanical Gaming Switch</option>
                        <option value="minimal">Soft Minimal Studio</option>
                        <option value="retro">8-Bit Arcade Retro</option>
                      </select>
                    </div>

                    <div className="kb-setting-group">
                      <label className="kb-setting-label">
                        Master Volume ({Math.round(custom.sounds.masterVolume * 100)}%)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={custom.sounds.masterVolume}
                        onChange={(e) =>
                          window.kinetic.updateCustomization({
                            sounds: { ...custom.sounds, masterVolume: Number(e.target.value) }
                          })
                        }
                      />
                    </div>

                    {(Object.keys(SOUND_EVENT_LABELS) as SoundEventId[]).map((evKey) => {
                      const evCfg = custom.sounds.events[evKey]
                      return (
                        <div
                          key={evKey}
                          className="kb-card-item"
                          style={{ flexDirection: 'column', alignItems: 'stretch' }}
                        >
                          <div className="kb-setting-row">
                            <span className="kb-setting-label">{SOUND_EVENT_LABELS[evKey]}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                className="kb-btn"
                                style={{ height: 24, padding: '0 8px' }}
                                onClick={() =>
                                  soundEngine.play(evKey, { ...custom.sounds, enabled: true })
                                }
                              >
                                Test
                              </button>
                              <input
                                type="checkbox"
                                checked={evCfg?.enabled ?? true}
                                onChange={(e) =>
                                  window.kinetic.updateCustomization({
                                    sounds: {
                                      ...custom.sounds,
                                      events: {
                                        ...custom.sounds.events,
                                        [evKey]: { ...evCfg, enabled: e.target.checked }
                                      }
                                    }
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="kb-setting-row">
                            <span className="kb-setting-desc">
                              Vol: {Math.round((evCfg?.volume ?? 0.5) * 100)}%
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={evCfg?.volume ?? 0.5}
                              onChange={(e) =>
                                window.kinetic.updateCustomization({
                                  sounds: {
                                    ...custom.sounds,
                                    events: {
                                      ...custom.sounds.events,
                                      [evKey]: { ...evCfg, volume: Number(e.target.value) }
                                    }
                                  }
                                })
                              }
                            />
                          </div>

                          <div className="kb-setting-row">
                            <span className="kb-setting-desc">
                              {evCfg?.customAudioDataUrl ? 'Custom Audio Loaded' : 'Custom .mp3/.wav:'}
                            </span>
                            <input
                              type="file"
                              accept="audio/*"
                              style={{ fontSize: 10, width: 150 }}
                              onChange={(e) => handleCustomSoundUpload(evKey, e)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {customizeSubTab === 'css' && (
                  <div className="kb-list-container">
                    <span className="kb-setting-desc">
                      Modify any browser UI class (`.kb-tab`, `.kb-navbar-row`, `.kb-omnibox-form`,
                      `.kb-newtab-studio`) with live hot-reload.
                    </span>
                    <textarea
                      className="kb-css-editor"
                      value={cssDraft}
                      onChange={(e) => setCssDraft(e.target.value)}
                      spellCheck={false}
                    />
                    {cssError && (
                      <span style={{ color: 'var(--kb-danger)', fontSize: 11 }}>{cssError}</span>
                    )}
                    <div className="kb-btn-row">
                      <button
                        type="button"
                        className="kb-btn primary"
                        onClick={handleApplyLiveCss}
                      >
                        Apply Live CSS
                      </button>
                      <button
                        type="button"
                        className="kb-btn"
                        onClick={() => {
                          setCssDraft('/* Custom Browser UI CSS - Live Applied */\n')
                          window.kinetic.updateCustomization({
                            customCss: '/* Custom Browser UI CSS - Live Applied */\n'
                          })
                        }}
                      >
                        Reset CSS
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* BOOKMARKS PANEL */}
            {activeDrawer === 'bookmarks' && (
              <>
                <form className="kb-setting-group" onSubmit={handleAddCustomBookmarkSubmit}>
                  <label className="kb-setting-label">Add Custom Bookmark</label>
                  <input
                    type="text"
                    className="kb-input"
                    placeholder="Title (e.g. Nexus Mods)"
                    value={customBmTitle}
                    onChange={(e) => setCustomBmTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    className="kb-input"
                    placeholder="Website URL (e.g. nexusmods.com)"
                    value={customBmUrl}
                    onChange={(e) => setCustomBmUrl(e.target.value)}
                    required
                  />
                  <div className="kb-btn-row">
                    <select
                      className="kb-select"
                      style={{ flex: 1 }}
                      value={customBmFolder}
                      onChange={(e) => setCustomBmFolder(e.target.value)}
                    >
                      {bookmarkFolders.map((folder) => (
                        <option key={folder} value={folder}>
                          {folder}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="kb-btn primary"
                      style={{ flex: '0 0 auto', padding: '0 14px' }}
                    >
                      + Add
                    </button>
                  </div>
                </form>

                <div className="kb-setting-group" style={{ marginTop: 6 }}>
                  <label className="kb-setting-label">Filter by Folder</label>
                  <select
                    className="kb-select"
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                  >
                    <option value="ALL">All Folders ({bookmarks.length})</option>
                    {bookmarkFolders.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                </div>

                <form className="kb-btn-row" onSubmit={handleCreateFolder}>
                  <input
                    type="text"
                    className="kb-input"
                    style={{ flex: 1 }}
                    placeholder="Create new folder..."
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                  />
                  <button type="submit" className="kb-btn" style={{ flex: '0 0 auto' }}>
                    <FolderPlus size={14} />
                  </button>
                </form>

                <div className="kb-list-container">
                  {filteredBookmarks.length === 0 ? (
                    <div className="kb-empty-state">No bookmarks in this folder yet.</div>
                  ) : (
                    filteredBookmarks.map((bm) => (
                      <div key={bm.id} className="kb-card-item">
                        <img
                          src={bm.favicon || getSiteFaviconUrl(bm.url, 32)}
                          alt=""
                          className="kb-bm-icon"
                        />
                        <div
                          className="kb-card-main"
                          onClick={() => window.kinetic.navigate(bm.url)}
                        >
                          <span className="kb-card-title">{bm.title}</span>
                          <span className="kb-card-sub">
                            [{bm.folder}] {bm.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="kb-tab-action-btn"
                          onClick={() => window.kinetic.removeBookmark(bm.id)}
                          title="Delete Bookmark"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* HISTORY PANEL */}
            {activeDrawer === 'history' && (
              <>
                <div className="kb-btn-row">
                  <input
                    type="text"
                    className="kb-input"
                    style={{ flex: 1 }}
                    placeholder="Search browsing history..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                  <button
                    type="button"
                    className="kb-btn danger"
                    style={{ flex: '0 0 auto' }}
                    onClick={() => window.kinetic.clearHistory()}
                  >
                    Clear
                  </button>
                </div>

                <div className="kb-list-container">
                  {filteredHistory.length === 0 ? (
                    <div className="kb-empty-state">No browsing history recorded yet.</div>
                  ) : (
                    filteredHistory.map((item) => (
                      <div key={item.id} className="kb-card-item">
                        <img
                          src={item.favicon || getSiteFaviconUrl(item.url, 32)}
                          alt=""
                          className="kb-bm-icon"
                        />
                        <div
                          className="kb-card-main"
                          onClick={() => window.kinetic.navigate(item.url)}
                        >
                          <span className="kb-card-title">{item.title}</span>
                          <span className="kb-card-sub">
                            {new Date(item.visitedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            • {item.visitCount}x • {item.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="kb-tab-action-btn"
                          onClick={() => window.kinetic.deleteHistoryItem(item.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* DOWNLOADS PANEL */}
            {activeDrawer === 'downloads' && (
              <>
                <div className="kb-btn-row">
                  <button
                    type="button"
                    className="kb-btn"
                    onClick={() => window.kinetic.clearCompletedDownloads()}
                  >
                    Clear Completed Downloads
                  </button>
                </div>

                <div className="kb-list-container">
                  {downloads.length === 0 ? (
                    <div className="kb-empty-state">No downloads yet.</div>
                  ) : (
                    downloads.map((dl) => {
                      const percent =
                        dl.totalBytes > 0
                          ? Math.min(100, Math.round((dl.receivedBytes / dl.totalBytes) * 100))
                          : 0
                      return (
                        <div
                          key={dl.id}
                          className="kb-card-item"
                          style={{ flexDirection: 'column', alignItems: 'stretch' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <div className="kb-card-main">
                              <span className="kb-card-title">{dl.fileName}</span>
                              <span className="kb-card-sub">
                                {dl.status.toUpperCase()} • {formatBytes(dl.receivedBytes)}
                                {dl.totalBytes > 0 ? ` / ${formatBytes(dl.totalBytes)} (${percent}%)` : ''}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 4 }}>
                              {dl.status === 'progressing' && (
                                <button
                                  type="button"
                                  className="kb-tab-action-btn"
                                  onClick={() => window.kinetic.pauseDownload(dl.id)}
                                >
                                  <Pause size={13} />
                                </button>
                              )}
                              {dl.status === 'paused' && (
                                <button
                                  type="button"
                                  className="kb-tab-action-btn"
                                  onClick={() => window.kinetic.resumeDownload(dl.id)}
                                >
                                  <Play size={13} />
                                </button>
                              )}
                              {(dl.status === 'progressing' || dl.status === 'paused') && (
                                <button
                                  type="button"
                                  className="kb-tab-action-btn"
                                  onClick={() => window.kinetic.cancelDownload(dl.id)}
                                >
                                  <X size={13} />
                                </button>
                              )}
                              {dl.status === 'completed' && (
                                <button
                                  type="button"
                                  className="kb-tab-action-btn"
                                  onClick={() => window.kinetic.showDownloadInFolder(dl.id)}
                                >
                                  <FolderOpen size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {(dl.status === 'progressing' || dl.status === 'paused') && (
                            <div className="kb-progress-track">
                              <div
                                className="kb-progress-fill"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}

            {/* PROFILES PANEL */}
            {activeDrawer === 'profiles' && (
              <>
                <span className="kb-setting-desc">
                  Switch between isolated browser profiles or launch a Private Tab.
                </span>

                <button
                  type="button"
                  className="kb-btn"
                  onClick={() => handleCreateTab(undefined, true)}
                >
                  + Open New Private Tab
                </button>

                <form className="kb-setting-group" onSubmit={handleCreateProfile}>
                  <label className="kb-setting-label">Create New Profile</label>
                  <div className="kb-btn-row">
                    <input
                      type="text"
                      className="kb-input"
                      style={{ flex: 1 }}
                      placeholder="Profile name..."
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                    />
                    <input
                      type="color"
                      value={newProfileColor}
                      onChange={(e) => setNewProfileColor(e.target.value)}
                      style={{ width: 32, height: 32, border: 'none', background: 'transparent' }}
                    />
                    <button type="submit" className="kb-btn primary" style={{ flex: '0 0 auto' }}>
                      Add
                    </button>
                  </div>
                </form>

                <div className="kb-list-container">
                  {profiles.map((prof) => {
                    const isCurrent = prof.id === activeProfileId
                    return (
                      <div key={prof.id} className="kb-card-item">
                        <div
                          className="kb-card-main"
                          onClick={() => window.kinetic.switchProfile(prof.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              className="kb-profile-dot"
                              style={{ backgroundColor: prof.color }}
                            />
                            <span className="kb-card-title">
                              {prof.name} {isCurrent ? '(Active)' : ''}
                            </span>
                          </div>
                        </div>
                        {prof.id !== 'default' && (
                          <button
                            type="button"
                            className="kb-tab-action-btn"
                            onClick={() => window.kinetic.deleteProfile(prof.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* GENERAL SETTINGS PANEL */}
            {activeDrawer === 'settings' && (
              <>
                <div className="kb-setting-group">
                  <label className="kb-setting-label">Default Search Engine</label>
                  <select
                    className="kb-select"
                    value={settings.searchEngine}
                    onChange={(e) =>
                      window.kinetic.updateSettings({
                        searchEngine: e.target.value as SearchEngineId
                      })
                    }
                  >
                    {Object.values(SEARCH_ENGINES).map((engine) => (
                      <option key={engine.id} value={engine.id}>
                        {engine.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="kb-checkbox-row">
                  <div>
                    <div className="kb-setting-label">Restore Previous Session</div>
                    <div className="kb-setting-desc">Reopen last open tabs on startup</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.restorePreviousSession}
                    onChange={(e) =>
                      window.kinetic.updateSettings({
                        restorePreviousSession: e.target.checked
                      })
                    }
                  />
                </div>

                <div className="kb-checkbox-row">
                  <div>
                    <div className="kb-setting-label">Show Bookmarks Bar</div>
                    <div className="kb-setting-desc">Display bookmarks below navigation bar</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showBookmarksBar}
                    onChange={(e) =>
                      window.kinetic.updateSettings({
                        showBookmarksBar: e.target.checked
                      })
                    }
                  />
                </div>

                <div className="kb-setting-group">
                  <label className="kb-setting-label">Homepage URL</label>
                  <input
                    type="text"
                    className="kb-input"
                    value={homepageDraft}
                    onChange={(e) => setHomepageDraft(e.target.value)}
                  />
                </div>

                <div className="kb-setting-group">
                  <label className="kb-setting-label">New Tab Page</label>
                  <input
                    type="text"
                    className="kb-input"
                    value={newTabDraft}
                    onChange={(e) => setNewTabDraft(e.target.value)}
                  />
                </div>

                <div className="kb-btn-row">
                  <button type="button" className="kb-btn primary" onClick={handleSaveSettings}>
                    Save URLs
                  </button>
                  <button
                    type="button"
                    className="kb-btn"
                    onClick={async () => {
                      const defaults = await window.kinetic.resetSettings()
                      setHomepageDraft(defaults.homepageUrl)
                      setNewTabDraft(defaults.newTabUrl)
                    }}
                  >
                    Reset
                  </button>
                </div>
              </>
            )}
          </aside>
        )}
      </main>

      {custom.taskbar.position === 'bottom' && renderNavbarRow(true)}
    </div>
  )
}