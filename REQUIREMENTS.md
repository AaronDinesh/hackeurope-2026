# Requirements Overview

This document captures the product requirements and constraints for the Miro AI Workspace desktop application so that any autonomous agent can implement the feature set without additional context.

## 1. Core Goals
- Create a cross-platform desktop UI (Tauri 2.x) that embeds the active Miro board (70% width) and a chat panel (30% width).
- Allow users to converse via text input (Enter to send) and voice recording, routing requests to configurable FastAPI endpoints.
- Let the app control/observe the current Miro board, display AI progress, and provide export capabilities once Gemini finishes processing contextual data.

## 2. Functional Requirements

### 2.1 Miro Board Experience
- Embed the currently selected Miro board via `https://miro.com/app/live-embed/{boardId}`.
- Modify the **current** active board when the user submits prompts; no automatic board creation.
- Support multiple boards by tabs (mood board, storyboard, final output). Tabs switch the live iframe.
- Persist the last active board ID per user session.

### 2.2 Chat + AI Interaction
- Chat panel on the right: streaming responses, persistent history, and rich error/loader states.
- Text messages POST to `/input` (FastAPI). Endpoint base URL must be configurable via settings.
- Voice messages record indefinitely until the user stops. Audio is uploaded to `/voice_input` and transcription is inserted back into the text field for manual review.
- Loading indicator appears whenever the backend/AI is working.
- Manual "Generate Final" button triggers a POST to `/generate_final`, passing the relevant board IDs.
- Display **only** final AI output on the Miro board; do not duplicate hex codes/descriptions inside the chat UI.

### 2.3 Export Controls
- Export button invokes FastAPI `/export` endpoint to generate downloadable PDF/PNG/JSON assets.
- Provide UI for selecting export format before sending the request.

### 2.4 Settings & Configuration
- Settings modal manages API base URL, specific endpoints, Miro OAuth connection, and theme preferences.
- Support selectable theme: light, dark, or system (default). Use Tailwind `dark:` classes with CSS variables.
- Persist app configuration, chat history, theme selection, and window size/position locally.

### 2.5 Authentication & Tokens
- Implement full OAuth for Miro access tokens with automatic refresh using stored refresh tokens.
- Store tokens securely (Tauri keychain / encrypted storage).
- Detect token expiry and refresh ~5 minutes before expiration; prompt user to re-authenticate if refresh fails.

### 2.6 Voice Recording Requirements
- Permit unlimited recording duration with visible timer and stop button.
- Use MediaRecorder (WebM/Opus) and convert to Blob for upload.

### 2.7 Error Handling & Network Awareness
- Display toast notifications for API failures, rate limits, and auth issues. Include retry action when applicable.
- Show offline banner if the device loses connectivity and pause outbound calls until online.
- Welcome screen for first-time users with "Connect Miro" / "Open Settings" actions.

### 2.8 Persistence
- Persist chat history, app config, and board metadata via Zustand with `persist` middleware (localStorage/app data).
- Persist Tauri window bounds using `tauri-plugin-window-state`.

## 3. Non-Functional Requirements
- Cross-platform build using Tauri 2.x (Rust backend + React/TypeScript frontend via Vite).
- Tailwind CSS for styling; avoid default fonts and ensure dark/light parity.
- Ensure unlimited voice recordings handle large blobs gracefully.
- Use Ky for HTTP client, Zustand for state, Lucide icons for UI.

## 4. External Integrations
- FastAPI backend (teammate-owned) exposes: `/input`, `/voice_input`, `/generate_final`, `/export`. Base URL is configurable and must not be hardcoded.
- Miro MCP server handles board modifications; this app only displays outcomes and manages authentication tokens.

## 5. Outstanding Work
- Entire UI, state management, and communication layer described above.
- OAuth flow and token refresh.
- Embedding board tabs, chat persistence, voice recorder, offline/toast systems, export UI, welcome screen, and theme support.
- No code has been written yet—this document plus IMPLEMENTATION_PLAN.md define the build scope.
