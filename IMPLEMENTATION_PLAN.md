# Implementation Plan

This plan turns the requirements into actionable engineering steps for an autonomous coding agent. Each section lists tasks, dependencies, and deliverables.

## 1. Tooling & Project Setup
1. Initialize Tauri + React + TypeScript project (Vite template) if not already present.
2. Install dependencies:
   - Runtime: `@tauri-apps/api`, `@tauri-apps/plugin-window-state`, `@tauri-apps/plugin-shell`, `react`, `react-dom`, `zustand`, `ky`, `lucide-react`, `jwt-decode`.
   - Dev: `@tauri-apps/cli`, `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`.
3. Configure Tailwind (`tailwind.config.js`, `postcss.config.js`, `src/index.css`) with `darkMode: 'class'` and CSS variable palette (light/dark).
4. Update `tauri.conf.json` for window defaults, security allowlist, and custom protocol for OAuth callback (`miro-ai-workspace://callback`).
5. Enable Tauri window state persistence via `tauri-plugin-window-state` in `src-tauri/src/main.rs`.

## 2. Type Definitions & State Stores
1. Create `src/types/index.ts` covering AppConfig, Message, Board, Toast, VoiceRecordingState, etc.
2. Implement Zustand stores with persistence:
   - `app.ts`: API endpoints, theme, onboarding status, Miro tokens (secure storage hook).
   - `chat.ts`: messages array, loading state, streaming updates, clear history.
   - `board.ts`: list of boards, active board ID, add/update methods.
   - `toast.ts`: toast queue with add/remove helpers.
3. Wire persistence using `zustand/middleware` `persist` (localStorage/app data). For sensitive tokens, integrate Tauri secure storage or keychain plugin if available; otherwise provide placeholder with TODO to call backend.

## 3. Services Layer
1. `src/services/api.ts`
   - Instance of Ky using configurable base URL.
   - Methods: `sendMessage`, `sendVoice`, `generateFinal`, `exportBoard`.
   - Each method handles JSON/Blob responses and throws structured errors for toast system.
2. `src/services/miro.ts`
   - Helpers for building embed URLs, storing board metadata, and (optional) calling Miro REST for thumbnails.
3. `src/services/auth.ts`
   - OAuth helper to open browser/SFSafari/Edge via Tauri `shell` plugin.
   - Handle authorization code exchange, store tokens, decode expiry.
   - Refresh logic (`refreshMiroToken`) and `useAutoTokenRefresh` hook scheduling refresh.

## 4. Hooks
1. `useSystemTheme` – toggles `.dark` class based on theme setting + media query.
2. `useVoiceRecorder` – handles MediaRecorder, unlimited duration, timers, uploads to `/voice_input`.
3. `useStreamingResponse` – reads `ReadableStream` to display streaming text in chat.
4. `useBoardPolling` – polls backend/Miro for board list, updates tabs when new boards appear.
5. `useNetworkStatus` – listens to `online/offline` events and updates store for banner.
6. `useAutoTokenRefresh` – described above.

## 5. UI Structure
1. `src/App.tsx`
   - Determine if user completed onboarding; show `WelcomeScreen` if not.
   - Render `OfflineIndicator`, `ToastContainer`, `Layout`.
   - Provide global keyboard handlers (e.g., `Ctrl+,` to open settings if desired).
2. `components/Layout`
   - Left area: `BoardTabs` + `BoardView` (iframe). Right area: `ChatPanel`.
   - Respect 70/30 split, responsive behavior.
3. `components/BoardTabs`
   - Tabs with board names, `+` button to trigger board creation (calls backend or placeholder action).
4. `components/BoardView`
   - Iframe embed with sanitized URL, overlay state for loading/error.
5. `components/ChatPanel`
   - Contains `MessageList`, `LoadingIndicator`, `GenerateButton`, `ExportPanel`, `ChatInput`.
   - `MessageList` renders bubble styles depending on role.
   - `ChatInput` handles Enter submission + multi-line with Shift+Enter.
   - `VoiceRecorder` button toggles `useVoiceRecorder`.
   - `GenerateButton` calls `/generate_final` with selected board IDs.
6. `components/ExportPanel`
   - Dropdown to pick format; button to call `exportBoard` and trigger download.
7. `components/LoadingIndicator`
   - Show spinner + text when `chat.isLoading` true.
8. `components/Settings`
   - Modal with sections: API endpoints, Miro OAuth connect/disconnect, theme toggle.
9. `components/ThemeToggle`
   - Buttons for light/system/dark.
10. `components/WelcomeScreen`
    - First-launch card with CTA to connect Miro or open settings.
11. `components/OfflineIndicator`
    - Banner shown when `useNetworkStatus` reports offline.
12. `components/Toast`
    - Portal container rendering `toast.ts` queue entries.

## 6. Behavior Wiring
1. Text submission flow: `ChatInput` → `chat.addMessage(user)` → `api.sendMessage` (with streaming) → `chat.addMessage(assistant)`.
2. Voice flow: `VoiceRecorder` → record unlimited audio → send to `/voice_input` → insert transcript into input.
3. "Generate Final" button collects relevant board IDs from state and POSTs to `/generate_final`; show loading state, then success toast.
4. Export flow: choose format → call `api.exportBoard` → use Tauri fs APIs to save file (prompt user for location).
5. Token refresh: `useAutoTokenRefresh` monitors expiry; on failure, show toast + open welcome/settings to re-auth.
6. Offline handling: disable inputs while offline (optional) and display banner.

## 7. Styling & Themes
1. Define CSS variables in `index.css` for `--background`, `--foreground`, `--border`, etc., with `.dark` overrides.
2. Use Tailwind utility classes referencing these variables (e.g., `bg-[var(--background)]`).
3. Ensure components have dark/light parity (message bubbles, buttons, modals, tabs).
4. Use expressive typography (custom font stack) per repo guidelines.

## 8. Testing & Validation
1. Manual QA checklist:
   - Onboarding flow (welcome screen → settings → connected state).
   - Text chat, streaming output, error toasts.
   - Voice recording unlimited duration + transcription.
   - Board tab switching, embed loading.
   - Generate final + export flows (mock backend if needed).
   - Theme toggling, persistence, window state restore.
   - Offline detection and messaging.
2. Optional automated tests: component tests with Vitest + React Testing Library (if time allows).

## 9. Outstanding Questions / TODO Hooks
- Backend contract for `/generate_final` and `/export` payloads/responses must be confirmed.
- Determine if board creation endpoints are required (currently assumed backend handles board setup).
- Decide on secure token storage approach (Tauri keychain plugin vs. custom command).
- Document environment variables (Miro client ID, redirect URI) in `.env.example`.

## 10. Deliverables
- `REQUIREMENTS.md` (already created) outlining scope.
- Completed front-end code per structure above.
- `README.md` update with install/run instructions.
- Optional: scripts or docs for packaging the Tauri app.

Follow this plan sequentially or in parallel tasks, ensuring each dependency (OAuth, stores, hooks) is implemented before UI relies on it.
