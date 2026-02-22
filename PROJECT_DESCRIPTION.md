## Inspiration
We were inspired by how fragmented creative workflows still are. Writers, designers, and video creators often jump between different tools just to turn one idea into a moodboard, style direction, constraints, and final assets. We wanted to build a single studio where one prompt can kick off the entire pipeline and keep everything organized in one place.

## What it does
BIG DATA is a creative generation workspace that takes a user prompt and produces a full concept package:
- constraints (negative guidance)
- hex color palette
- creative summary
- moodboard image
- storyboard image

From that shared context, users can generate a final image or a final video, review outputs in-app, and download assets. Sessions and conversations are stored locally so users can return to past projects anytime.

## How we built it
We built a desktop app using:
- **Frontend:** Tauri + React + TypeScript + Tailwind
- **State management:** Zustand
- **Backend:** FastAPI with modular route handlers
- **AI services:** Gemini (text + image planning) and Veo (video generation)

The frontend orchestrates API calls, renders all generated sections, and lets users trigger final image/video generation. We added local persistence for chat history and generation context so creative work is not lost between app restarts.

## Challenges we ran into
- Aligning frontend expectations with evolving backend API contracts
- Handling CORS/preflight issues during local development
- Managing session hydration and synchronization across multiple content sections
- Working with protected external media URLs (video playback/download permissions)
- Designing UI states for long-running generation tasks so users always know what is happening

## Accomplishments that we're proud of
- Built an end-to-end “prompt to production package” flow
- Integrated multi-output generation (text, palette, images, video) in one interface
- Added local session history with restorable conversations and outputs
- Created a clean desktop UX with clear generation controls and status feedback
- Shipped a working full-stack prototype with real AI service integration

## What we learned
- API contract stability is critical when multiple components evolve in parallel
- Explicit loading/error states greatly improve trust in AI-powered UX
- Local persistence architecture matters early for creative tools
- Integrating third-party generation APIs requires robust fallback and observability
- Cross-functional collaboration (frontend + backend + prompt design) is the key to iteration speed

## What's next for BIG DATA
- Add stronger project organization (tags, folders, searchable sessions)
- Improve timeline/storyboard editing with scene-level controls
- Add export pipelines for social/video formats
- Support collaborative workspaces and cloud sync
- Introduce smarter regeneration controls (section-specific prompts and version comparison)
- Polish deployment for production desktop distribution across platforms
