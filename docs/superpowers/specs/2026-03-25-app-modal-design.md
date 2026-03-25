# AppModal — Design Spec

**Date:** 2026-03-25
**Status:** Approved

## Problem

All feedback and confirmation dialogs in the app use React Native's `Alert.alert()`, which renders the platform's native Android dialog. The native dialog ignores the app's design system (Dark Oak / Warm Cream palette, custom typography), producing visual inconsistency.

There are 12 `Alert.alert()` calls across 6 files.

## Goal

Replace all native `Alert.alert()` calls with a custom modal component that respects the app's design tokens and theme (light/dark).

## Approach

Imperative API — a `showModal()` function that matches the `Alert.alert()` call signature closely, minimizing the diff at each call site.

## Architecture

### New file: `lib/AppModal.tsx`

Exports:
- **`ModalProvider`** — React context provider that holds modal state and renders the `AppModal` component. Must wrap the entire app inside `ThemeProvider`.
- **`useModal()`** — hook that returns `{ showModal }`.
- The modal component itself is internal (not exported).

### State shape (internal to ModalProvider)

```ts
interface ModalState {
  visible: boolean
  title: string
  message?: string
  buttons: ModalButton[]
}
```

### Public API

```ts
interface ModalButton {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: () => void
}

// Returned by useModal()
showModal(title: string, message?: string, buttons?: ModalButton[]): void
```

**Default behavior when `buttons` is omitted:** single "OK" button that closes the modal.

### Rendering

The modal uses React Native's `<Modal>` component with `transparent={true}` and `animationType="fade"`. Inside:
- Semi-transparent backdrop (`rgba(26,15,8,0.5)` dark / `rgba(0,0,0,0.45)` light)
- Centered card using `useTheme()` colors:
  - Background: `colors.surface`
  - Title: `colors.text`
  - Message: `colors.textSecondary`
  - Border radius: `radius.lg` (14)
  - Cancel button: `colors.surface2` background
  - Destructive button: `colors.error` background
  - Default/OK button: `colors.accent` background

Tapping the backdrop closes the modal (calls the `cancel`-style button's `onPress` if present, or just hides).

### Integration in `_layout.tsx`

Wrap `ThemeProvider` children with `ModalProvider`:

```tsx
<ThemeProvider>
  <ModalProvider>
    <ThemedStack />
  </ModalProvider>
</ThemeProvider>
```

## Migration

Replace `Alert.alert(title, message?, buttons?)` → `showModal(title, message?, buttons?)` in:

| File | Calls |
|---|---|
| `app/(tabs)/settings.tsx` | 5 |
| `app/(tabs)/index.tsx` | 4 |
| `app/(tabs)/templates.tsx` | 1 |
| `app/template/edit.tsx` | 2 |
| `app/workout/[id].tsx` | 2 |

Remove `Alert` from all `react-native` imports after migration.

## What Does Not Change

- Button logic and `onPress` callbacks — identical to current code
- No new state management in any screen
- No changes to navigation, data layer, or AI integration

## Verification

1. Run the app: `npx expo start --android`
2. Trigger each dialog type:
   - **Simple error**: try to save an empty workout name in `template/edit`
   - **Simple success**: save a valid API key in Settings
   - **Destructive confirm**: delete a template; clear chat history
   - **Workout quit**: start a workout and tap back without saving
3. Confirm no native Android dialog appears anywhere
4. Toggle light/dark theme in Settings and verify modal respects both palettes
5. Verify tapping the backdrop closes non-destructive modals
