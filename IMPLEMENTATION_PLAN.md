# Implementation Plan

This plan turns the refreshed requirements into actionable engineering steps. Each section lists tasks, dependencies, and deliverables for the Gemini Creative Studio desktop app.

## 1. Tooling & Project Setup
1. (Already done) Tauri + React + TypeScript + Tailwind scaffold. Ensure the following dependencies stay up to date:
   - Runtime: `@tauri-apps/api`, `@tauri-apps/plugin-window-state`, `@tauri-apps/plugin-shell`, `react`, `react-dom`, `zustand`, `ky`, `lucide-react`, `clsx`.
   - Dev: `@tauri-apps/cli`, `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`.
2. Tailwind + CSS variables already configured; extend as needed when new components arrive.
3. `tauri.conf.json` already updated for window defaults; ensure plugins remain loaded.

## 2. Type Definitions & State Stores
1. Expand `src/types/index.ts` to cover:
   - AppConfig (endpoints, theme, onboarding flag)
   - Message + metadata
   - MoodBoardImage, StoryboardScene, HexColor, Constraint, SummaryDoc
   - FinalOutput (type, preview URL/path, createdAt)
2. Zustand stores with persistence:
   - `app.ts`: base URL + endpoint overrides, theme preference, onboarding flag.
   - `chat.ts`: messages, streaming state, helper methods.
   - `content.ts` (new): mood board, storyboard, hex codes, constraints, summary, final output history, loading/error flags per section.
   - `toast.ts`: toast queue.
3. Optional: `constraints.ts` if constraint CRUD logic becomes complex (IDs, statuses, provenance).

## 3. Services Layer
1. `src/services/api.ts`
   - Build URL helper that reads config store.
   - Methods for: `sendMessage`, `sendVoice`, `fetchMoodBoard`, `generateMoodBoard`, same for storyboard/hex/constraints/summary, `generateFinalImage`, `generateFinalVideo`, `downloadFile`.
   - Ensure every method throws descriptive errors consumed by toast system.
2. Remove Miro/OAuth services; all calls go to FastAPI.

## 4. Hooks
1. `useSystemTheme`, `useVoiceRecorder`, `useStreamingResponse`, `useNetworkStatus` (already created).
2. Add `useSectionLoader(sectionKey, fetcher)` to orchestrate initial load + refresh for mood/story/text panels.
3. Add `useDownloadFile` hook to save blobs via Tauri dialog/fs when final outputs are downloaded.

## 5. UI Structure
1. `src/App.tsx`
   - Keep placeholder until real components ready; eventually render `WelcomeScreen` (if onboarding incomplete) else `AppShell` containing layout.
2. `components/Layout`
   - Left: `ContentTabs` (mood/story/text/final) with corresponding panels.
   - Right: `ChatPanel` (MessageList + ChatInput + VoiceRecorder + GenerateButtons + loaders).
3. `components/ContentTabs`
   - Manage tab state; highlight referenced section when chat messages reference them.
4. `components/MoodBoardPanel`
   - Grid of images with enlarge modal, refresh button, edit trigger.
5. `components/StoryboardPanel`
   - Ordered list of images with captions/time markers; edit per scene.
6. `components/TextPanel`
   - `HexCodesPanel`: swatches, copy-to-clipboard, refresh.
   - `ConstraintsPanel`: CRUD UI with tag chips, edit modal, toggle for AI vs user created.
   - `SummaryPanel`: display formatted text/markdown with edit/regenerate controls.
7. `components/FinalOutputPanel`
   - History list with preview cards, metadata, download/locate buttons.
8. `components/ChatPanel`
   - `MessageList`, `LoadingIndicator`, `VoiceRecorder`, `ChatInput`, `GenerateButtons` (image/video), `SectionReferenceBadge` if message links to a tab.
9. `components/ElementEditor`
   - Modal or sidebar overlay triggered when user clicks “edit/regenerate” on a section; exposes text box + “Generate” button hitting the correct endpoint.
10. Supporting components: `SettingsModal`, `ThemeToggle`, `ToastContainer`, `OfflineBanner`, `WelcomeScreen`, `EmptyStateCard` for each section.

## 6. Behavior Wiring
1. Initial prompt flow: user submits via chat → call `/input` (stream) → once backend responds that sections are ready, trigger fetch for each section or rely on response payload (depending on API contract).
2. Section refresh: clicking refresh or editing a section calls its generate endpoint, shows inline loader, updates store when response returns.
3. Constraints CRUD: add/edit/delete call relevant endpoints, update store optimistically, show toast on failure.
4. Voice recording: record → `/voice_input` → insert transcript into chat input (user manually sends).
5. Final generation buttons: gather latest section IDs/metadata if required, call `generateFinalImage` or `generateFinalVideo`, append result to final output history, show toast on success/failure.
6. Download: request signed URL or Blob via `downloadFile`, prompt user for save location using Tauri dialog/fs.
7. Offline handling: disable send/generate buttons while offline and show informative banner.

## 7. Styling & Themes
1. Continue using CSS variables + Tailwind classes; extend palette for section cards, constraint badges, etc.
2. Provide responsive breakpoints (min width 1080 but allow shrink); ensure tabs wrap sensibly.
3. Use Lucide icons for actions (refresh, edit, download, etc.).

## 8. Testing & Validation
1. Manual QA checklist:
   - Welcome → settings configuration → ready state.
   - Chat streaming + voice transcription + editing.
   - Each tab shows loading/empty/filled states; editing/regenerating works.
   - Constraint CRUD updates backend + UI.
   - Final image/video generation populates history; downloads succeed.
   - Theme toggle, offline indicator, toasts.
   - Window state + local persistence survive app restart.
2. Optional automated tests using Vitest/RTL for reducers and key components (chat store, constraint editor, final output history).

## 9. Outstanding Questions / TODO Hooks
- Final API contract for each section (URLs, payloads, push vs pull) to be confirmed with backend.
- Determine download mechanism (direct URL vs binary stream) to finalize `downloadFile` implementation.
- Define metadata schema for final outputs (file paths, preview images, etc.).
- Provide example `.env` for endpoint overrides once backend finalizes naming.

## 10. Deliverables
- Updated `REQUIREMENTS.md` (done) and this plan.
- Full React/Tauri implementation with tabbed layout, chat, voice, constraint manager, final output history.
- Documentation (`README.md`) describing configuration, endpoints, and build/run steps.
- Optional packaging scripts/instructions for distributing the Tauri app.

Follow this plan sequentially or in parallel tasks. Prioritize stores/services first, then UI skeleton, then behavior wiring, and finally polish (toasts, error states, downloads).
