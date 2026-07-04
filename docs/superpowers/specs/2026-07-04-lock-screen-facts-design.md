# Lock Screen Facts — Design

**Date:** 2026-07-04
**Status:** Approved

## Overview

An Android app built with Expo (managed workflow) that shows a rotating fact on the
user's lock screen via rich local notifications. Users choose which fact categories
they want, how often the fact refreshes, and can browse the full fact library in-app.

## Goals

- Show a fresh fact on the lock screen at a user-chosen interval.
- Facts come from a bundled offline database organized by category.
- Users can enable any combination of categories (default: all).
- Easy deployment via EAS Build (single command produces installable APK/AAB).

## Non-Goals

- True screen-on detection (requires native foreground service — out of scope).
- Server/API-sourced facts.
- Favorites, sharing, iOS support.

## Mechanism

Android doesn't allow apps to draw on the lock screen directly. Instead, the app
pre-schedules a batch (~50) of local notifications at the chosen interval using
`expo-notifications`. Notifications are visible on the lock screen by default.
A background task (`expo-background-task`) plus app-open logic tops up the queue
and clears previously delivered notifications so the lock screen shows only the
latest fact.

## Stack

- Expo SDK (latest, managed workflow), TypeScript
- `expo-router` (2 screens), `expo-notifications`, `expo-background-task`,
  `expo-task-manager`, `@react-native-async-storage/async-storage`
- Jest (`jest-expo`) for unit tests
- EAS Build for deployment

## Components

### 1. Facts data (`data/facts.json`)

6 categories — Science, History, Space, Animals, Geography, Human Body — with
10+ facts each (easily expandable). Shape: `{ id: string, category: string, text: string }`.

### 2. Settings store (`lib/settings.ts`)

AsyncStorage-backed:

- `enabledCategories: string[]` (default: all; must contain ≥ 1)
- `intervalMinutes: 15 | 30 | 60 | 1440` (default: 30)
- `notificationsEnabled: boolean` (default: true)

### 3. Scheduler (`lib/scheduler.ts`)

Pure logic, unit-tested:

- `pickFacts(facts, enabledCategories, count, lastFactId?)` — shuffled selection
  from enabled categories, no immediate repeats.
- `buildSchedule(facts, intervalMinutes, startTime)` — maps facts to trigger times.

Orchestration (`lib/notifications.ts`):

- Cancel all scheduled notifications, dismiss delivered ones, schedule the next
  ~50 facts at the chosen interval.
- Re-run on: settings change, app open, background task tick.

### 4. Background top-up task

`expo-background-task` registered task (min interval, runs opportunistically):
dismiss delivered notifications, re-schedule the queue so it never runs dry.

### 5. Home screen (`app/index.tsx`)

- Current/next fact preview
- Category toggle chips (prevent disabling the last one)
- Interval picker (15 min / 30 min / 1 h / daily)
- Master notifications on/off switch
- Android 13+ POST_NOTIFICATIONS permission flow; if denied, inline banner with
  an "Open settings" link (`Linking.openSettings()`).

### 6. Browse screen (`app/browse.tsx`)

Category-sectioned scrollable list of all bundled facts.

## Data Flow

Settings change → persist to AsyncStorage → cancel scheduled → re-schedule queue.
App open / background task → dismiss delivered → top up queue.
Master switch off → cancel all scheduled + dismiss delivered.

## Error Handling

- Notification permission denied → banner + settings link; scheduling skipped.
- Empty category selection → prevented in UI.

## Testing

- Jest unit tests for scheduler logic (category filtering, shuffling, no-repeat,
  schedule generation).
- Manual on-device verification of notification delivery via EAS preview build.

## Deployment

`eas build -p android --profile preview` → installable APK.
