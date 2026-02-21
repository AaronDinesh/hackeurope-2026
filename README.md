# Gemini Creative Studio – UI Setup Guide

This repository houses the desktop UI (Tauri + React + TypeScript) for the Gemini Creative Studio. Follow the instructions below to install the required tooling and run the application on Windows, macOS, or Linux.

## 1. Prerequisites

### All Platforms
- **Node.js** 20.x (includes npm). Download from [nodejs.org](https://nodejs.org/) or use a version manager.
- **Rust toolchain** (stable). Install via [rustup](https://rustup.rs/).
- **Tauri CLI** (installed automatically via `npm install` script – no extra steps needed after prerequisites).

### Windows
1. Install **Visual Studio Build Tools** (at least C++ workload) or the full Visual Studio 2022 Community edition.
2. Install the **Windows 10/11 SDK**.
3. Ensure **Microsoft C++ Build Tools** and **WebView2** are present (WebView2 usually ships with Windows; if not, get it from the [Microsoft download page](https://developer.microsoft.com/microsoft-edge/webview2/)).
4. After installing prerequisites, open a new **Developer PowerShell** or **Terminal** so the environment picks up new PATH entries.

### macOS
1. Install **Xcode** or at least the **Command Line Tools** via `xcode-select --install`.
2. Ensure **Homebrew** is available (optional but convenient for dependencies).
3. WebKit (the system WebView) is already available, so no extra steps.

### Linux
1. Install development packages for your distribution:
   - **Debian/Ubuntu**: `sudo apt update && sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev`.
   - **Fedora**: `sudo dnf install @development-tools webkit2gtk4.1-devel libappindicator-gtk3 librsvg2-devel`.
   - **Arch**: `sudo pacman -S --needed base-devel webkit2gtk-4.1 libappindicator-gtk3 librsvg`.
2. Ensure `pkg-config` is installed (usually part of the base dev tools).

## 2. Repository Setup

```bash
git clone <repo-url>
cd hackeurope-2026
npm install        # installs frontend deps + tauri CLI
cp .env.example .env   # edit endpoints later
```

## 3. Running the App

### Development Mode
```bash
npm run tauri dev
```
This launches the Vite dev server and Tauri dev window. Any code change in `src/` hot-reloads the UI.

### Production Build
```bash
npm run tauri build
```
Tauri produces a platform-specific bundle under `src-tauri/target/{debug|release}` and, if bundling is enabled, installers inside `src-tauri/target/release/bundle`.

## 4. Environment Configuration

Edit the `.env` (copied from `.env.example`) to match your FastAPI backend. By default it provides a `VITE_API_BASE_URL`. All other endpoints can be configured inside the settings modal of the app once it is running.

## 5. Troubleshooting
- **Missing toolchain errors**: confirm Rust, Node, and platform dev packages are installed, then reopen your terminal.
- **`tauri: command not found`**: rerun `npm install` to ensure the CLI dependency is available.
- **WebView issues on Linux**: confirm the correct `webkit2gtk` version (4.1+) is installed.

## 6. Helpful Commands
| Command | Description |
| --- | --- |
| `npm run dev` | Vite-only preview in a browser (without Tauri shell). |
| `npm run tauri dev` | Full desktop dev mode with native shell. |
| `npm run tauri build` | Production build + installer generation. |
| `npm run lint` | Run ESLint. |

You’re ready to extend the UI per `REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md`. Reach out to the backend team for the latest FastAPI endpoints and credentials before testing Gemini flows.
