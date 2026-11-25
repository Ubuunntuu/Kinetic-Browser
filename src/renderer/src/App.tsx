import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Plus,
  Home,
  ShieldCheck,
  ShieldAlert,
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
  Search
} from 'lucide-react'
import {
  BookmarkItem,
  BrowserSettings,
  BrowserStatePayload,
  DEFAULT_SETTINGS,
  DownloadEntry,
  DrawerPanelId,
  HistoryEntry,
  KINETIC_NEWTAB_URL,
  SEARCH_ENGINES,
  SearchEngineId,
  TabState,
  UserProfile
} from '../../shared/types'

const ACCENT_PRESETS = ['#00f0ff', '#ff2a6d', '#05d550', '#b537f2', '#ff8a00', '#3b82f6']

function getSiteFaviconUrl(siteUrl: string, size: number = 64): string {
  try {
    const parsed = new URL(siteUrl)
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=${size}`
  } catch {
    return ''
  }
}

const QUICK_LINKS = [
  {
    title: 'YouTube',
    url: 'https://www.youtube.com',
    iconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64'
  },
  {
    title: 'Twitch',
    url: 'https://www.twitch.tv',
    iconUrl: 'https://www.google.com/s2/favicons?domain=twitch.tv&sz=64'
  },
  {
    title: 'Steam',
    url: 'https://store.steampowered.com',
    iconUrl: 'https://www.google.com/s2/favicons?domain=store.steampowered.com&sz=64'
  },
  {
    title: 'Discord',
    url: 'https://discord.com/app',
    iconUrl: 'https://www.google.com/s2/favicons?domain=discord.com&sz=64'
  },
  {
    title: 'Reddit',
    url: 'https://www.reddit.com',
    iconUrl: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64'
  },
  {
    title: 'Spotify',
    url: 'https://open.spotify.com',
    iconUrl: 'https://www.google.com/s2/favicons?domain=open.spotify.com&sz=64'
  },
  {
    title: 'GitHub',
    url: 'https://github.com/Ubuunntuu/Kinetic-Browser',
    iconUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=64'
  },
  {
    title: 'PCGamingWiki',
    url: 'https://www.pcgamingwiki.com',
    iconUrl: 'https://www.google.com/s2/favicons?domain=pcgamingwiki.com&sz=64'
  }
]

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
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [bookmarkFolders, setBookmarkFolders] = useState<string[]>(['Bookmarks Bar'])
  const [downloads, setDownloads] = useState<DownloadEntry[]>([])
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string>('default')

  const [addressInput, setAddressInput] = useState<string>('')
  const [newTabSearchQuery, setNewTabSearchQuery] = useState<string>('')
  const [isAddressFocused, setIsAddressFocused] = useState<boolean>(false)
  const [activeDrawer, setActiveDrawer] = useState<DrawerPanelId>('none')
  const [clockNow, setClockNow] = useState<Date>(new Date())

  // Panel Filters & Forms
  const [historySearch, setHistorySearch] = useState<string>('')
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL')
  const [newFolderInput, setNewFolderInput] = useState<string>('')
  const [newProfileName, setNewProfileName] = useState<string>('')
  const [newProfileColor, setNewProfileColor] = useState<string>('#00f0ff')
  const [homepageDraft, setHomepageDraft] = useState<string>(DEFAULT_SETTINGS.homepageUrl)
  const [newTabDraft, setNewTabDraft] = useState<string>(DEFAULT_SETTINGS.newTabUrl)

  const activeTab = tabs.find((t) => t.id === activeTabId) || null
  const isNewTabActive = !activeTab || activeTab.url === KINETIC_NEWTAB_URL
  const currentEngine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.google
  const currentBookmark =
    activeTab && !isNewTabActive ? bookmarks.find((b) => b.url === activeTab.url) : undefined
  const hasActiveDownloads = downloads.some((d) => d.status === 'progressing')

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const applyState = (payload: BrowserStatePayload): void => {
      if (!payload) return
      setTabs(payload.tabs)
      setActiveTabId(payload.activeTabId)
      setSettings(payload.settings)
      setHistory(payload.history || [])
      setBookmarks(payload.bookmarks || [])
      setBookmarkFolders(payload.bookmarkFolders || ['Bookmarks Bar'])
      setDownloads(payload.downloads || [])
      setProfiles(payload.profiles || [])
      setActiveProfileId(payload.activeProfileId || 'default')

      const effectiveChromeHeight = 82 + (payload.settings.showBookmarksBar ? 30 : 0)
      document.documentElement.style.setProperty('--kb-accent', payload.settings.accentColor)
      document.documentElement.style.setProperty('--kb-chrome-height', `${effectiveChromeHeight}px`)
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
  }, [activeTab?.url, activeTabId, isAddressFocused])

  const toggleDrawerPanel = (panel: DrawerPanelId): void => {
    const next = activeDrawer === panel ? 'none' : panel
    setActiveDrawer(next)
    window.kinetic.setRightDrawerOpen(next !== 'none', settings.sidebarOpenWidth)
  }

  const handleNavigateSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    window.kinetic.navigate(addressInput)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const handleNewTabSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!newTabSearchQuery.trim()) return
    window.kinetic.navigate(newTabSearchQuery)
    setNewTabSearchQuery('')
  }

  const handleToggleBookmarkActiveTab = async (): Promise<void> => {
    if (!activeTab || isNewTabActive) return
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

  return (
    <div className="kb-shell">
      {/* TOP BROWSER CHROME */}
      <header className="kb-chrome">
        {/* ROW 1: CLEAN TAB STRIP */}
        <div className="kb-tabstrip-row">
          <div className="kb-tabs-container">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  className={`kb-tab ${isActive ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''} ${tab.isPrivate ? 'private' : ''}`}
                  onClick={() => window.kinetic.switchTab(tab.id)}
                  onAuxClick={(e) => {
                    if (e.button === 1) window.kinetic.closeTab(tab.id)
                  }}
                  title={`${tab.title}${tab.url !== KINETIC_NEWTAB_URL ? `\n${tab.url}` : ''}${tab.isPrivate ? '\n[Private Session]' : ''}`}
                >
                  {tab.isPrivate ? (
                    <EyeOff size={13} color="#d896ff" style={{ flexShrink: 0 }} />
                  ) : tab.favicon ? (
                    <img src={tab.favicon} alt="" className="kb-tab-favicon" />
                  ) : (
                    <Globe size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                  )}

                  {!tab.isPinned && (
                    <>
                      {tab.isPrivate && <span className="kb-private-tag">PRIV</span>}
                      <span className="kb-tab-title">{tab.title}</span>
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
                        window.kinetic.closeTab(tab.id)
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              )
            })}

            <button
              type="button"
              className="kb-newtab-btn"
              title="New Tab"
              onClick={() => window.kinetic.createTab()}
            >
              <Plus size={15} />
            </button>
          </div>

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

        {/* ROW 2: NAVIGATION & OMNIBOX */}
        <div className="kb-navbar-row">
          <div className="kb-nav-group">
            <button
              type="button"
              className="kb-icon-btn"
              disabled={!activeTab?.canGoBack}
              onClick={() => window.kinetic.goBack()}
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              className="kb-icon-btn"
              disabled={!activeTab?.canGoForward}
              onClick={() => window.kinetic.goForward()}
              title="Forward"
            >
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="kb-icon-btn"
              onClick={() =>
                activeTab?.isLoading ? window.kinetic.stop() : window.kinetic.reload()
              }
              title={activeTab?.isLoading ? 'Stop Loading' : 'Reload Page'}
            >
              {activeTab?.isLoading ? <X size={16} /> : <RotateCw size={15} />}
            </button>
            <button
              type="button"
              className="kb-icon-btn"
              onClick={() => window.kinetic.goHome()}
              title="Home / New Tab Studio"
            >
              <Home size={15} />
            </button>
          </div>

          <form className="kb-omnibox-form" onSubmit={handleNavigateSubmit}>
            {activeTab?.isPrivate ? (
              <span className="kb-security-badge private" title="Private Tab (No History Saved)">
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
            )}

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

          <div className="kb-nav-group">
            {activeTab && (
              <>
                <button
                  type="button"
                  className={`kb-icon-btn ${activeTab.isPinned ? 'active' : ''}`}
                  onClick={() => window.kinetic.togglePinTab(activeTab.id)}
                  title={activeTab.isPinned ? 'Unpin Tab' : 'Pin Tab'}
                >
                  <Pin size={15} />
                </button>
                <button
                  type="button"
                  className="kb-icon-btn"
                  onClick={() => window.kinetic.duplicateTab(activeTab.id)}
                  title="Duplicate Tab"
                >
                  <Copy size={15} />
                </button>
              </>
            )}

            <button
              type="button"
              className="kb-icon-btn private-btn"
              onClick={() => window.kinetic.createTab(undefined, { isPrivate: true })}
              title="New Private Tab"
            >
              <EyeOff size={15} />
            </button>

            <button
              type="button"
              className={`kb-icon-btn ${activeDrawer === 'bookmarks' ? 'active' : ''}`}
              onClick={() => toggleDrawerPanel('bookmarks')}
              title="Bookmarks"
            >
              <Bookmark size={15} />
            </button>

            <button
              type="button"
              className={`kb-icon-btn ${activeDrawer === 'history' ? 'active' : ''}`}
              onClick={() => toggleDrawerPanel('history')}
              title="History"
            >
              <History size={15} />
            </button>

            <button
              type="button"
              className={`kb-icon-btn ${activeDrawer === 'downloads' ? 'active' : ''}`}
              onClick={() => toggleDrawerPanel('downloads')}
              title="Downloads"
            >
              <Download size={15} />
              {hasActiveDownloads && <span className="kb-badge-dot" />}
            </button>

            <button
              type="button"
              className={`kb-icon-btn ${activeDrawer === 'profiles' ? 'active' : ''}`}
              onClick={() => toggleDrawerPanel('profiles')}
              title="User Profiles"
            >
              <Users size={15} />
            </button>

            <button
              type="button"
              className="kb-icon-btn"
              onClick={() => window.kinetic.toggleDevTools()}
              title="Developer Tools"
            >
              <Terminal size={15} />
            </button>

            <button
              type="button"
              className={`kb-icon-btn ${activeDrawer === 'settings' ? 'active' : ''}`}
              onClick={() => toggleDrawerPanel('settings')}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* ROW 3: BOOKMARKS BAR WITH REAL SITE FAVICONS */}
        {settings.showBookmarksBar && (
          <div className="kb-bookmarks-bar">
            {bookmarks.map((bm) => {
              const iconSrc = bm.favicon || getSiteFaviconUrl(bm.url, 32)
              return (
                <button
                  key={bm.id}
                  type="button"
                  className="kb-bm-pill"
                  onClick={() => window.kinetic.navigate(bm.url)}
                  onAuxClick={(e) => {
                    if (e.button === 1) window.kinetic.createTab(bm.url)
                  }}
                  title={`${bm.title}\n${bm.url}`}
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
          </div>
        )}
      </header>

      {/* WORKSPACE AREA */}
      <main className="kb-workspace">
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

              {/* Central New Tab Search Bar synced with Default Search Engine */}
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

              {/* Speed Dial Grid with Official Site Logos */}
              <div className="kb-speed-dial-grid">
                {QUICK_LINKS.map((item) => (
                  <div
                    key={item.url}
                    className="kb-speed-card"
                    onClick={() => window.kinetic.navigate(item.url)}
                    onAuxClick={(e) => {
                      if (e.button === 1) window.kinetic.createTab(item.url)
                    }}
                    title={item.url}
                  >
                    <div className="kb-speed-icon-box">
                      <img
                        src={item.iconUrl}
                        alt={item.title}
                        className="kb-speed-logo-img"
                      />
                    </div>
                    <span className="kb-speed-label">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="kb-webview-placeholder" />
        )}

        {activeDrawer !== 'none' && (
          <aside className="kb-settings-drawer">
            <div className="kb-drawer-header">
              <span className="kb-drawer-title">{activeDrawer}</span>
              <button
                type="button"
                className="kb-tab-action-btn"
                onClick={() => toggleDrawerPanel('none')}
                title="Close Drawer"
              >
                <X size={15} />
              </button>
            </div>

            {activeDrawer === 'bookmarks' && (
              <>
                <div className="kb-setting-group">
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
                    placeholder="New folder name..."
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

            {activeDrawer === 'profiles' && (
              <>
                <span className="kb-setting-desc">
                  Switch between isolated browser profiles or launch a Private Tab.
                </span>

                <button
                  type="button"
                  className="kb-btn"
                  onClick={() => window.kinetic.createTab(undefined, { isPrivate: true })}
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

            {activeDrawer === 'settings' && (
              <>
                <div className="kb-setting-group">
                  <label className="kb-setting-label">Default Search Engine</label>
                  <span className="kb-setting-desc">
                    Automatically updates both the Omnibox and New Tab Studio search bar.
                  </span>
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
                  <label className="kb-setting-label">Primary Accent Color</label>
                  <div className="kb-color-row">
                    {ACCENT_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className="kb-color-Swatch"
                        style={{
                          backgroundColor: hex,
                          borderColor: settings.accentColor === hex ? '#ffffff' : 'transparent'
                        }}
                        onClick={() => window.kinetic.updateSettings({ accentColor: hex })}
                      />
                    ))}
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) =>
                        window.kinetic.updateSettings({ accentColor: e.target.value })
                      }
                      style={{ width: 30, height: 26, background: 'transparent', border: 'none' }}
                    />
                  </div>
                </div>

                <div className="kb-setting-group">
                  <label className="kb-setting-label">Homepage URL</label>
                  <span className="kb-setting-desc">
                    Use kinetic://newtab for the custom Kinetic start page.
                  </span>
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
    </div>
  )
}