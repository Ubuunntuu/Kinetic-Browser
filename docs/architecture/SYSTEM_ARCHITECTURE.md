# Kinetic Browser — System Architecture Specification (Phase 1)

## 1. Multi-Process Rendering Architecture

Kinetic Browser uses Electron 33+ (`Chromium 130+`) with the modern **`BaseWindow` + `WebContentsView`** compositor model:

- **UI Chrome Layer (`UIWebContents`):** Renders the customizable Taskbar, Tab Bar (Horizontal or Vertical), Address Bar, Gaming Sidebar, Settings Modals, and HUD overlays.
- **Tab Content Views (`Map<TabId, WebContentsView>`):** Each open tab owns an isolated `WebContentsView` attached to the window's `contentView`.
  - When a tab is active (or visible in Split-Screen mode), its bounds are calculated dynamically based on the user's current customization layout (e.g., top bar height, left vertical tab width, right gaming sidebar width, and active overlay state).
  - When a popup or modal opens in the UI Chrome Layer, the active `WebContentsView` either yields focus or temporarily adjusts its viewport/z-layer so HTML menus are never clipped by native views.

## 2. Extreme Customization Engine Schema

Instead of a single global accent color, Kinetic Browser maintains a hierarchical **Customization Profile JSON Schema** compiled into live CSS Custom Properties (`--kb-*`) at runtime:

- **Window & Backdrop:** `--kb-window-bg`, `--kb-window-opacity`, `--kb-window-blur`, `--kb-font-family`, `--kb-ui-scale`
- **Taskbar & Toolbar:** Position (`top` | `bottom` | `left` | `right`), dimensions, button spacing, individual button overrides (back, forward, reload, home, shield, gaming, vpn, extensions, settings).
- **Per-Tab & Tab Group Overrides:** Every tab stores optional metadata (`customTitle`, `customColor`, `customBg`, `customIcon`, `groupId`, `isPinned`, `isLocked`) allowing independent styling alongside global tab geometry rules.
- **Search / Address Bar:** Width (`200px` to `100%`), height, alignment (`left` | `center` | `right`), border width/radius/color, focus glow, suggestion dropdown behavior, and active search engine endpoint.
- **Audio Feedback Engine:** Web Audio API synthesizer + custom audio buffer loader supporting individual volume, enablement, and custom `.wav`/`.mp3`/`.ogg` paths for 10 distinct browser lifecycle events.

## 3. Privacy & Content Scrubbing Pipeline

1. **Network Level (`session.webRequest`):**
   - Evaluates outgoing requests against compiled filter lists (EasyList, EasyPrivacy, Peter Lowe's Ad/Trackers, plus user custom rules).
   - Strips known tracking query parameters (`utm_*`, `fbclid`, `gclid`, `mc_eid`, `msclkid`, `_hsenc`) on navigation.
   - Enforces HTTPS upgrades and custom DNS-over-HTTPS (Cloudflare, Quad9, Mullvad, NextDNS, or Custom).
2. **DOM Level (Isolated Content Preload Scrubber):**
   - Injects reversible cosmetic stylesheets and a lightweight `MutationObserver` to hide residual ad slots, sponsored cards, and intrusive overlays.
   - Keeps an in-memory map of hidden DOM nodes per tab so the user can inspect blocked elements and click **Restore Elements** at any time without reloading.

## 4. Extension Compatibility Architecture

- **Chromium Extensions (`.crx` / Unpacked MV2 & MV3):** Loaded via `session.extensions.loadExtension` paired with `electron-chrome-extensions` to support browser action popups, context menus, tab querying, and webRequest/declarativeNetRequest hooks.
- **Firefox Add-ons (`.xpi` Bridge):** Unpacks `.xpi` archives, validates `manifest.json`, strips Gecko-exclusive keys (`browser_specific_settings.gecko`), injects the `browser.*` Promise compatibility polyfill, and alerts the user if any unsupported Gecko-native APIs (such as `contextualIdentities`) are requested.

## 5. VPN Integration Architecture

- Supports two transparent modes:
  1. **System/Tunnel Mode (WireGuard):** Connects via local WireGuard tunnel configurations (`.conf`) using the installed WireGuard Windows service, providing full UDP/TCP tunneling, latency probing, and interface kill-switch monitoring.
  2. **Browser Session Proxy + DoH Mode:** Routes all Chromium `session` traffic through user-configured or provider-authenticated SOCKS5 / HTTPS proxy endpoints with `force_non_proxied_udp` disabled to prevent WebRTC IP leaks.
