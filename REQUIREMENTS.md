# Requirements Overview

This document captures the product requirements and constraints for the Gemini Creative Studio desktop application. Any autonomous agent should be able to implement the feature set using this spec plus the implementation plan.

## 1. Core Goals
- Build a cross-platform desktop UI (Tauri 2.x + React/TypeScript) that dedicates ~70% of the window to Gemini-generated content tabs and ~30% to a chat panel.
- Allow users to converse via text input (Enter to send), routing requests to configurable FastAPI endpoints.
- Present five Gemini-generated deliverables (mood board, storyboard, hex codes, constraints, summary) plus a final output history, with simple controls to regenerate each element independently.
- Support final exports (image or video) initiated from the desktop app, with downloads stored locally.

## 2. Functional Requirements

### 2.1 Layout & Tabs
- Tab bar (left side) with: **Mood Board**, **Storyboard**, **Text**, **Final Output**.
- Mood Board tab: grid of Gemini-generated image thumbnails with hover states and click-to-enlarge behavior.
- Storyboard tab: ordered sequence of scene images with labels or timestamps.
- Text tab layout:
  - Top-left: hex codes list showing swatches + hex strings + descriptive labels.
  - Top-right: constraint list with full CRUD (add, edit, delete). Constraints can be marked as user-created or AI-suggested.
  - Bottom: summary section (rich text) describing the overall concept.
- Final Output tab: history list of final generations (image/video), each with metadata, preview, and download button.

### 2.2 Chat + AI Interaction
- Chat panel on the right: streaming responses, persistent history, status indicators, and message timestamps.
- Text messages POST to `/input`. Base URL and path must be configurable in settings.
- Each chat response can include references to generated sections; users can click a reference to focus that tab.
- When a user clicks a section (e.g., a storyboard tile), open an inline editor or modal with a text box to request an updated version. Regeneration endpoints must be configurable (e.g., `/story-board-generate`, `/mood-board-generate`, etc.).

### 2.3 Content Fetching & Refresh
- After the initial prompt, fetch all five starter elements from their respective endpoints (e.g., `/story-board`, `/mood-board`, `/hex-codes`, `/constraints`, `/summary`).
- Display last-updated timestamps and allow manual refresh per section.
- Constraint CRUD actions should immediately call the backend (endpoints configurable) and optimistically update UI.
- Each section must show loading, empty, and error states.

### 2.4 Final Output Workflow
- Provide two primary buttons in the chat panel: `Generate Final Image` and `Generate Final Video`.
- Buttons call configurable endpoints (e.g., `/generate-final-image`, `/generate-final-video`).
- Final Output tab keeps a history of successful generations with metadata (type, date, prompt snapshot, file format).
- Each history item includes:
  - Preview (image thumbnail or short looping video)
  - Download button (calls generic `/download` or returns signed URL)
  - Optional "Open file location" action via Tauri shell API.

### 2.5 Settings & Configuration
- Settings modal contains:
  - API base URL
  - Individual endpoint overrides for all features (chat, each section fetch/regenerate, final output, download)
  - Theme preference (light, dark, system)
  - Toggle for optional analytics/telemetry (if needed later)
- Persist settings, chat history, theme selection, and window state locally (Zustand + Tauri window-state plugin).

### 2.6 Error Handling & Network Awareness
- Toast notifications for API failures, rate limits, and download errors, with retry buttons when relevant.
- Offline banner when `navigator.onLine === false`; disable send/generate buttons while offline.
- All content sections show inline error cards with “Retry” buttons.

### 2.7 Persistence
- Store chat history, content data (latest mood/storyboard/etc.), constraints, and final-output history using Zustand `persist`.
- Support clearing caches from settings.
- Persist Tauri window bounds via `tauri-plugin-window-state`.

## 3. Non-Functional Requirements
- Desktop build via Tauri 2.x; frontend via React + Vite + Tailwind (custom font stack, dark/light parity).
- Ky for HTTP client, Zustand for state, Lucide icons for UI, clsx for conditional classes.
- Ensure large file downloads (images/videos) stream efficiently and surface progress.
- Provide accessible focus states and keyboard navigation for major controls.

## 4. External Integrations
- Entirely backed by a teammate-owned FastAPI server. All endpoints must be configurable through settings to accommodate future naming changes.
- No Miro integration; Gemini context is fully provided by the FastAPI service.

## 5. Outstanding Work
- Implement tabbed layout, chat panel, constraint manager, summary view, and final output history per this spec.
- Wire every UI action to configurable FastAPI endpoints (fetch, regenerate, generate finals, downloads).
- Build settings modal, onboarding/welcome screen, offline/toast systems, and theming.
- Integrate streaming chat responses and file downloads.
