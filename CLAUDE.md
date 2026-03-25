# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours` — brainstorm a new idea
- `/plan-ceo-review` — review a plan (strategy)
- `/plan-eng-review` — review a plan (architecture)
- `/plan-design-review` — review a plan (design)
- `/design-consultation` — create a design system
- `/review` — code review before merge
- `/ship` — ready to deploy / create PR
- `/browse` — web browsing
- `/qa` — test the app
- `/qa-only` — run tests without setup
- `/design-review` — visual design audit
- `/setup-browser-cookies` — configure browser cookies
- `/retro` — weekly retrospective
- `/investigate` — debug errors
- `/document-release` — post-ship doc updates
- `/codex` — second opinion / adversarial code review
- `/careful` — working with production or live systems
- `/freeze` — scope edits to one module/directory
- `/guard` — maximum safety mode
- `/unfreeze` — remove edit restrictions
- `/gstack-upgrade` — upgrade gstack to latest version

---

## Commands

```bash
# Start dev server (iOS/Android)
npx expo start

# Run on a specific platform
npx expo start --ios
npx expo start --android

# Run tests
npm test

# Run a single test file
npx jest __tests__/claude.test.ts

# Web dev (requires proxy for CORS)
node proxy.js &   # start CORS proxy on :3001
npx expo start --web
```

TypeScript is checked by `tsc --noEmit` (no dedicated lint script). There is no separate build step — Expo handles bundling.

---

## Architecture

This is a React Native / Expo app using `expo-router` for file-based navigation. All data is stored locally on the device (no backend).

### Navigation structure (`app/`)

```
app/
  _layout.tsx          — root Stack navigator; sets dark theme system-wide
  (tabs)/              — bottom tab bar (4 tabs)
    index.tsx          — AI chat screen ("Treinador")
    templates.tsx      — saved workout templates list
    history.tsx        — completed session history
    settings.tsx       — API key config + data management
  workout/[id].tsx     — active workout screen (modal presentation)
  debrief/[id].tsx     — post-workout AI analysis screen
  session/[id].tsx     — historical session detail view
  template/edit.tsx    — create/edit workout template
```

### Data layer (`lib/db.ts`)

Single SQLite database (`gymhelper.db`) initialized lazily via `getDb()`. Tables:
- `workout_templates` — saved workouts; `exercises_json` stores `WorkoutExercise[]` as JSON
- `workout_sessions` — completed sessions; `exercises_json` stores `ExerciseLog[]` as JSON
- `last_weights` — one row per `exercise_id`, updated on session save
- `chat_history` — persisted chat messages; `workout_json` stores embedded `WorkoutTemplate`
- `exercise_image_cache` — wger.de image URLs keyed by exercise name (NOCASE); empty string = confirmed "no image"

### AI integration (`lib/claude.ts`)

Two Claude calls, both using `claude-sonnet-4-5`:
1. **`sendMessage()`** — chat with the personal trainer. Expects `<workout>...</workout>` XML tags wrapping a JSON workout in the response. After parsing, fires off image pre-caching for each exercise (fire-and-forget).
2. **`getDebrief()`** — post-workout analysis. Sends the last 15 sessions as compact text; expects a raw JSON array of `{type, text}` insights back.

On web, API calls go through a local CORS proxy (`proxy.js` on port 3001). On native, they hit the Anthropic API directly.

### Exercise images (`lib/exercise-images.ts` + `lib/wger.ts`)

Images are fetched from the wger.de REST API and cached in SQLite:
1. Check `exercise_image_cache` by exercise name
2. Search wger by English name first (`exercise.nameEn`), then Portuguese name
3. Cache result only when the API responded (empty string sentinel for confirmed "no image"; skip caching on network errors to allow retry)
4. In-flight deduplication via a `Map<string, Promise>` in `exercise-images.ts`

The `useExerciseImage` hook wraps `resolveExerciseImage` with loading state and cleanup on unmount.

### Design tokens (`lib/theme.ts`)

Single source of truth for all colors, font sizes, and border radii. Import `colors`, `fontSize`, or `radius` — never hardcode hex values in component files.

### Key types (`types/index.ts`)

- `WorkoutTemplate` — template with `WorkoutExercise[]`
- `WorkoutSession` — completed session with `ExerciseLog[]` (each log has `SetLog[]`)
- `ExerciseLog.exerciseNameEn` — optional English name used for image resolution
- `ChatMessage` — may include an embedded `workout: WorkoutTemplate`

### Storage

`lib/storage.ts` wraps `@react-native-async-storage/async-storage` for the Anthropic API key only. Everything else uses SQLite.
