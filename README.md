# 🌐 BlueNav Browser

> **Next-Generation Privacy, Ultra-Speed & Native AI Browser built on top of Brave Core & Chromium.**

[![GitHub Repo](https://img.shields.io/badge/GitHub-acnesia%2FBlueNav-0070f3?logo=github)](https://github.com/acnesia/BlueNav)
[![Engine](https://img.shields.io/badge/Engine-Brave%20Core%20%2B%20Chromium-00d2ff)](#)
[![License](https://img.shields.io/badge/License-MPL%202.0-blue.svg)](#)
[![Status](https://img.shields.io/badge/Status-Active%20Development-success)](#)

---

## ⚡ What is BlueNav?

**BlueNav** is a customized, privacy-respecting, high-performance web browser. Combining the speed and compatibility of **Chromium** with the advanced tracker/ad-blocking shields of **Brave Core**, BlueNav elevates the browsing experience with:

- 🛡️ **BlueShields Engine**: Native ad-blocking, fingerprinting protection, tracker blocker, and third-party cookie isolation powered by Rust-based adblock filters.
- 🤖 **BlueAI Copilot**: Native AI assistant integrated into the sidebar and address bar with multi-provider support (Gemini, Claude, OpenAI, Local LLMs via Ollama).
- 🎨 **Deep Blue Aesthetic**: A dark mode interface with electric blue and neon cyan accents, custom tab ergonomics, and glassmorphism touches.
- 🚀 **Zero Telemetry**: All external trackers, telemetry, and non-essential telemetry pings removed for pure browsing privacy.
- ⚡ **Optimized Memory**: Intelligent tab suspending and memory reclamation for smooth multitasking.

---

## 📁 Repository Structure

This repository contains the full browser core:

```text
c:/navigateur IA/ (BlueNav)
├── app/                  # Application initialization, branding, icon assets, strings
├── browser/              # UI layer, tab management, omnibox, extensions, profiles
├── build/                # Build configs, branding scripts, GN toolchain arguments
├── components/           # Core subsystems:
│   ├── ai_chat/          # BlueAI / Leo AI copilot integration & workspace
│   ├── brave_shields/    # Privacy shields, adblocker filters & cookie guards
│   ├── brave_new_tab_ui/ # Modern customizable New Tab Page
│   ├── brave_wallet_ui/  # Web3 and crypto wallet integration
│   ├── omnibox/          # Intelligent search and URL suggestions
│   └── sidebar/          # Quick-access tools, AI dock & productivity panel
├── patches/              # Patches applied onto upstream Chromium
└── resources/            # Vector icons, localizations, themes & assets
```

---

## 🛠️ Quick Start & Development

### Prerequisites
- **Git** 2.41+
- **Node.js** 20+
- **pnpm** 9+ / 10+
- **Python** 3.10+

### Cloning the Project
```bash
git clone https://github.com/acnesia/BlueNav.git
cd BlueNav
```

### Initializing Dependencies
```bash
pnpm install
```

---

## 🗺️ Customization Roadmap ("Modifier au Max")

1. **Brand Transformation**:
   - [x] Renamed core packages to BlueNav
   - [x] Initialized public GitHub repository (`acnesia/BlueNav`)
   - [ ] Replace Lion assets and orange palettes with Electric Blue & Cyan
   - [ ] Custom BlueNav application icons and vector branding

2. **Interface & Ergonomics**:
   - [ ] Redesigned New Tab Page (NTP) with BlueNav widgets & AI search prompt
   - [ ] Sidebar AI Copilot with quick summaries, translation, and page distillation
   - [ ] Floating address bar (Omnibox) with instant AI answers

3. **Privacy & Shields**:
   - [ ] Stricter anti-fingerprinting rules
   - [ ] Anti-phishing heuristics
   - [ ] Auto-clean cache and cookies on exit per profile

---

## 📜 License

BlueNav is distributed under the **Mozilla Public License 2.0 (MPL-2.0)**.
Derived from the open-source Brave Core project and Chromium.
