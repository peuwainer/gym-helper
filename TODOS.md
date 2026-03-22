# TODOS

## [ ] Fix missing error handling in handleFinish() (saveSession failure)

**What:** Wrap `saveSession()` in a try/catch in `workout/[id].tsx` so SQLite failures show an error Alert instead of silently doing nothing.

**Why:** If the DB write fails (rare — disk full, SQLite locked), the user loses their workout data with no feedback. The app just navigates silently.

**Pros:** Prevents silent data loss; 3 extra lines.

**Cons:** None meaningful — SQLite failures on-device are rare but the cost of handling them is negligible.

**Where to start:** `workout/[id].tsx`, `handleFinish()`, around the `saveSession()` call. Wrap with try/catch, show an Alert on error.

**Context:** Flagged during /plan-eng-review on 2026-03-22. Pre-existing bug, not introduced by the debrief feature. Deferred because we're not in the try/catch path yet and it's not the focus of the current PR.

---

## [ ] History injection into chat (Approach A from design doc)

**What:** Inject the last 10 workout sessions into the chat system prompt in `lib/claude.ts` `sendMessage()` so the AI can answer questions like "what weight should I bench today?" with actual data.

**Why:** The debrief is proactive. The chat is reactive. Making the chat context-aware makes both surfaces useful and complementary — no new UI required.

**Pros:** Chat becomes 10x more useful; zero new screens; single-function change.

**Cons:** AI context window grows with session count; the "knowledge" is invisible to the user (no UI shows it). Might want to add a small "using your last N sessions" label to the chat header.

**Where to start:** `lib/claude.ts` `sendMessage()`. Call `getSessions(10)` at the top of `sendMessage()` (or load once per chat session and pass in). Prepend formatted session history to `SYSTEM_PROMPT` before sending.

**Context:** Approach A from the office-hours design doc (2026-03-22). Deliberately deferred in favor of the debrief (Approach B) as the higher-value first ship. Build after the debrief is live and you've had a week to see how the insights feel.

**Depends on:** Debrief feature shipping first (validates the AI-with-context pattern).
