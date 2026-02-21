# Remaining Implementation Plan

This document now tracks only the outstanding work required to finish the Gemini Creative Studio desktop app.

## 1. Backend Orchestration & Data Flow
1. **Starter element orchestration** – when a user submits a prompt, listen for the backend signal (response metadata, SSE, or polling) that the five starter sections are ready. Invoke the section fetch endpoints in order (mood board, storyboard, hex codes, constraints, summary) and surface loading/progress states while they hydrate.
2. **Section refresh contract** – confirm with the FastAPI backend whether regenerate endpoints return full lists or only patches (per tile/scene). Adjust `content` store updates accordingly and ensure timestamps/metadata stay in sync.
3. **Final generation payload** – lock in the exact payload structure expected by `/generate-final-image` and `/generate-final-video` (IDs, prompts, etc.), and ensure loading/toast states reflect backend status.

## 2. Section Editing Enhancements
1. **Mood board & storyboard editing** – extend the new per-item dialogs so users can rename titles/descriptions, reorder items, or replace images while keeping metadata intact. Persist those edits via new backend endpoints if available.
2. **Hex palette utilities** – add copy-to-clipboard, rename, and delete controls per swatch. Wire “suggest palette” prompts to show which colors changed.
3. **Constraints CRUD polish** – add validation (non-empty text, duplicates), better optimistic updates (revert on failure), and visual cues for disabled constraints. Support bulk imports if backend exposes that option.

## 3. Settings & Onboarding Polish
1. **Validation** – enforce proper URL format for base URL and ensure endpoint paths start with `/`. Inline errors should prevent saving.
2. **Persistence UX** – disable the “Skip for now” button (or warn) until settings have been saved at least once. Add a confirmation toast after saving.
3. **Reset/Presets** – allow resetting to default endpoints and exporting/importing a JSON settings profile.

## 4. Downloads & File Management
1. **Tauri-native downloads** – finish integrating the `saveBlobFile` helper with the Tauri dialog/fs APIs (already scaffolded) and add an “Open containing folder” action per final output once a file is saved.
2. **History metadata** – store file paths, checksums, and statuses (saved/not saved) inside the final output entries so the UI can reflect whether a user has downloaded each asset.

## 5. Backend Wiring & Error Handling
1. **API error surface** – map backend error codes/messages to user-friendly toasts and inline section errors. Include retry tokens for transient issues.
2. **Streaming metadata** – if the backend can send section references in chat responses, populate `Message.metadata.referencedSection` so the “View section” shortcuts work end-to-end.
3. **Voice transcription** – display success/failure states based on the `/voice_input` response and allow re-uploading if the backend rejects the audio.

## 6. Testing & QA
1. **Manual test pass** – run `npm run tauri dev` after the backend is wired up, covering: onboarding, chat + voice, section fetch/regenerate flows, constraint CRUD, final generation + download, offline mode, and theme toggling.
2. **Edge cases** – test large file downloads, extremely long prompts, simultaneous regenerations, and backend error scenarios.
3. **Optional automated tests** – once contracts solidify, add Jest/Vitest tests for stores (content/chat) and key helpers (e.g., `saveBlobFile`).

## 7. Deployment Tasks
1. **Docs** – update `README.md` with finalized endpoint descriptions and troubleshooting notes for the backend integration.
2. **Packaging** – when ready, run `npm run tauri build` for Windows/macOS/Linux, smoke-test installers, and document installation steps.

Complete these items to finish the remaining roadmap. Prioritize backend contract confirmation and section orchestration before polishing UI layers.
