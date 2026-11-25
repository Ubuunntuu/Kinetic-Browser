# KINETIC BROWSER

**The Browser Built for Gamers Who Want Complete Control.**

Kinetic Browser is a high-performance, deeply customizable, privacy-first desktop web browser engineered for PC gamers and power users. Built on a multi-process Chromium `WebContentsView` architecture with native Rust performance subsystems, Kinetic gives users granular control over every pixel, sound, tab, network request, and system resource.

---

## Core Pillars

1. **EXTREME CUSTOMIZATION**
   - **Per-Component Styling Engine:** Independently configure colors, backgrounds, gradients, borders, border-radius, blur, shadows, glow, spacing, and typography for the taskbar, individual tabs, tab groups, search bar, and panels.
   - **Visual Drag-and-Drop Layout Editor:** Position the taskbar and tabs on the top, bottom, left, or right; reorder every button and toolbar widget.
   - **Live Custom CSS Studio:** Built-in syntax-highlighted CSS editor with live hot-reload, validation, and safe reset.
   - **Procedural & Custom Sound Engine:** Low-latency audio feedback for clicks, scrolling, tab actions, navigation, and downloads with custom audio upload support.
   - **Unlimited Profiles & 10 Built-in Presets:** Switch instantly between *Kinetic Dark*, *Kinetic Light*, *Cyberpunk*, *Midnight*, *Crimson*, *Arctic*, *Neon Purple*, *Minimal*, *Stealth (OLED True Black)*, and *Gaming RGB*.

2. **GAMING-FIRST PERFORMANCE**
   - **Gaming Mode:** Aggressive background tab freezing, zero-animation UI latency switch, notification suppression, and opt-in Windows game process auto-detection.
   - **Real-Time Resource Monitor:** Live telemetry for per-tab CPU, RAM, GPU process utilization, and network throughput.
   - **Gaming Sidebar & Multi-PiP:** Quick-access panels for Discord, Twitch, Spotify, YouTube, and Steam Community with always-on-top Picture-in-Picture.

3. **NATIVE PRIVACY & SECURITY**
   - **Native Ad & Tracker Blocker:** Powered by EasyList, EasyPrivacy, and custom filter rules with sub-millisecond request matching.
   - **Interactive Website Scrubber:** Removes intrusive overlays, sponsored blocks, and cookie walls with a non-destructive 1-click element restorer and live block inspector.
   - **Built-in WireGuard & Secure Proxy VPN Integration:** Native WireGuard tunnel controller, DNS-over-HTTPS (DoH), WebRTC leak prevention, and kill-switch support.
   - **Sandboxed Process Isolation:** Full Chromium site isolation, strict CSP, and a unified Security & Permission Dashboard.

4. **POWERFUL BROWSER WORKFLOWS**
   - Split-screen dual/quad browsing, vertical & horizontal tab groups, session restoration, password encryption via OS DPAPI, mouse gestures, and Chromium/WebExtension compatibility.

---

## Architecture Overview

Kinetic Browser separates its customizable UI shell from web content rendering using Chromium's native multi-process compositor:

- **Main Process (`src/main`):** Electron 33+ managing `BaseWindow` and isolated `WebContentsView` instances per tab, SQLite data persistence, network filtering hooks, and OS integrations.
- **Preload Bridge (`src/preload`):** Strict `contextIsolation: true` IPC bridges for the Browser Shell UI and Web Page Scrubbing agents.
- **UI Renderer (`src/renderer`):** Hardware-accelerated React 19 + TypeScript interface driven by a 200+ token CSS Custom Property Engine capable of 240Hz frame pacing.
- **Shared Contracts (`src/shared`):** Strongly typed IPC channels, customization schemas, and validation rules.

See [`docs/architecture/SYSTEM_ARCHITECTURE.md`](docs/architecture/SYSTEM_ARCHITECTURE.md) for the complete engineering specification.

---

## Development Roadmap

- [x] **Phase 1:** Research, Architecture Specification & Repository Initialization
- [ ] **Phase 2:** Project Foundation & Multi-Tab `WebContentsView` Browser Core
- [ ] **Phase 3:** Core Browser Subsystems (History, Bookmarks, Downloads, Sessions, Profiles, Private Windows)
- [ ] **Phase 4:** Extreme Customization Engine (Per-Component Styling, Sound Engine, Layout Editor, Custom CSS, 10 Themes)
- [ ] **Phase 5:** Privacy & Security Engine (Ad/Tracker Blocker, DOM Scrubber, Fingerprinting Defense, Security Dashboard)
- [ ] **Phase 6:** Gaming Features (Gaming Mode, Resource Monitor, Tab Freezer, Gaming Sidebar, Game Detection, PiP)
- [ ] **Phase 7:** Extension Manager (CRX/Unpacked + XPI Compatibility Bridge) & WireGuard/DoH VPN Integration
- [ ] **Phase 8:** Advanced Workflows (Split-Screen, Mouse Gestures, New Tab Studio, Reader Mode)
- [ ] **Phase 9:** Hardware Benchmarking & Optimization (Tested on Intel Core i3-10100 / RTX 3070 / 32GB DDR4 / 1440p 240Hz OLED)
- [ ] **Phase 10:** Windows Installer, Portable Build, Auto-Updater & Release v1.0.0

---

## License

Licensed under the [MIT License](LICENSE).
