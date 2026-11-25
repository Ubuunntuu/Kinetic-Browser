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
  Zap
} from 'lucide-react'
import {
  BrowserSettings,
  BrowserStatePayload,
  DEFAULT_SETTINGS,
  SEARCH_ENGINES,
  SearchEngineId,
  TabState
} from '../../shared/types'

const ACCENT_PRESETS = ['#00f0ff', '#ff2a6d', '#05d550', '#b537f2', '#ff8a00', '#3b82f6']

export default function App(): JSX.Element {
  const [tabs, setTabs] = useState<TabState[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS)
  const [addressInput, setAddressInput] = useState<string>('')
  const [isAddressFocused, setIsAddressFocused] = useState<boolean>(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

  // Local settings form buffer
  const [homepageDraft, setHomepageDraft] = useState<string>(DEFAULT_SETTINGS.homepageUrl)
  const [newTabDraft, setNewTabDraft] = useState<string>(DEFAULT_SETTINGS.newTabUrl)

  const activeTab = tabs.find((t) => t.id === activeTabId) || null

  useEffect(() => {
    const applyState = (payload: BrowserStatePayload): void => {
      if (!payload) return
      setTabs(payload.tabs)
      setActiveTabId(payload.activeTabId)
      setSettings(payload.settings)
      document.documentElement.style.setProperty('--kb-accent', payload.settings.accentColor)
      document.documentElement.style.setProperty(
        '--kb-chrome-height',
        `${payload.settings.chromeHeight}px`
      )
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

  // Keep omnibox synced with active tab URL when user isn't actively typing
  useEffect(() => {
    if (!isAddressFocused && activeTab) {
      setAddressInput(activeTab.url)
    }
  }, [activeTab?.url, activeTabId, isAddressFocused])

  const handleNavigateSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    window.kinetic.navigate(addressInput)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const toggleSettingsDrawer = (): void => {
    const nextState = !isSettingsOpen
    setIsSettingsOpen(nextState)
    window.kinetic.setRightDrawerOpen(nextState, settings.sidebarOpenWidth)
  }

  const handleSaveSettings = async (): Promise<void> => {
    const updated = await window.kinetic.updateSettings({
      homepageUrl: homepageDraft,
      newTabUrl: newTabDraft
    })
    setHomepageDraft(updated.homepageUrl)
    setNewTabDraft(updated.newTabUrl)
  }

  const handleResetSettings = async (): Promise<void> => {
    const defaults = await window.kinetic.resetSettings()
    setHomepageDraft(defaults.homepageUrl)
    setNewTabDraft(defaults.newTabUrl)
  }

  return (
    <div className="kb-shell">
      {/* TOP BROWSER CHROME */}
      <header className="kb-chrome">
        {/* ROW 1: TAB STRIP */}
        <div className="kb-tabstrip-row">
          <div className="kb-brand-badge" title="Kinetic Browser Core v0.2.0">
            <Zap size={13} />
            <span>KINETIC</span>
          </div>

          <div className="kb-tabs-container">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  className={`kb-tab ${isActive ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''}`}
                  onClick={() => window.kinetic.switchTab(tab.id)}
                  onAuxClick={(e) => {
                    if (e.button === 1) window.kinetic.closeTab(tab.id)
                  }}
                  title={`${tab.title}\n${tab.url}`}
                >
                  {tab.favicon ? (
                    <img src={tab.favicon} alt="" className="kb-tab-favicon" />
                  ) : (
                    <Zap size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                  )}

                  {!tab.isPinned && <span className="kb-tab-title">{tab.title}</span>}

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
              title="Open New Tab"
              onClick={() => window.kinetic.createTab()}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* FRAMELESS WINDOW CONTROLS */}
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
              title="Go to Homepage"
            >
              <Home size={15} />
            </button>
          </div>

          <form className="kb-omnibox-form" onSubmit={handleNavigateSubmit}>
            {activeTab?.hasCertError ? (
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
              <span className="kb-security-badge insecure" title="Unencrypted or Local Connection">
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
              placeholder={`Search with ${SEARCH_ENGINES[settings.searchEngine]?.name || 'DuckDuckGo'} or enter address...`}
              spellCheck={false}
            />
          </form>

          <div className="kb-nav-group">
            {activeTab && (
              <>
                <button
                  type="button"
                  className={`kb-icon-btn ${activeTab.isPinned ? 'active' : ''}`}
                  onClick={() => window.kinetic.togglePinTab(activeTab.id)}
                  title={activeTab.isPinned ? 'Unpin Active Tab' : 'Pin Active Tab'}
                >
                  <Pin size={15} />
                </button>
                <button
                  type="button"
                  className="kb-icon-btn"
                  onClick={() => window.kinetic.duplicateTab(activeTab.id)}
                  title="Duplicate Active Tab"
                >
                  <Copy size={15} />
                </button>
              </>
            )}

            <button
              type="button"
              className="kb-icon-btn"
              onClick={() => window.kinetic.toggleDevTools()}
              title="Toggle Chromium Developer Tools"
            >
              <Terminal size={15} />
            </button>

            <button
              type="button"
              className={`kb-icon-btn ${isSettingsOpen ? 'active' : ''}`}
              onClick={toggleSettingsDrawer}
              title="Quick Settings & Customization"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="kb-workspace">
        {/* Native WebContentsView is composited directly over this area by Main Process */}
        <div className="kb-webview-placeholder" />

        {isSettingsOpen && (
          <aside className="kb-settings-drawer">
            <div className="kb-drawer-header">
              <span className="kb-drawer-title">KINETIC FOUNDATION SETTINGS</span>
              <button
                type="button"
                className="kb-tab-action-btn"
                onClick={toggleSettingsDrawer}
                title="Close Settings"
              >
                <X size={15} />
              </button>
            </div>

            <div className="kb-setting-group">
              <label className="kb-setting-label">Default Search Engine</label>
              <span className="kb-setting-desc">
                Used whenever you type a search query into the omnibox.
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

            <div className="kb-setting-group">
              <label className="kb-setting-label">Primary Accent Color</label>
              <span className="kb-setting-desc">
                Live preview of the CSS Token Engine (expanded in Phase 4).
              </span>
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
                    title={hex}
                  />
                ))}
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => window.kinetic.updateSettings({ accentColor: e.target.value })}
                  style={{ width: 32, height: 28, background: 'transparent', border: 'none' }}
                />
              </div>
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
              <label className="kb-setting-label">New Tab Default URL</label>
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
              <button type="button" className="kb-btn" onClick={handleResetSettings}>
                Reset Defaults
              </button>
            </div>
          </aside>
        )}
      </main>
    </div>
  )
}
