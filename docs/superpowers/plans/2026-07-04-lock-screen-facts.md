# Lock Screen Facts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Expo-managed Android app that shows rotating facts on the lock screen via pre-scheduled local notifications, with user-selectable categories and refresh interval.

**Architecture:** Bundled JSON fact database → pure scheduler logic picks facts and trigger times → `expo-notifications` pre-schedules ~50 local notifications → background task + app-open logic tops up the queue. Two expo-router screens: Home (settings) and Browse.

**Tech Stack:** Expo SDK (latest, managed), TypeScript, expo-router, expo-notifications, expo-background-task, expo-task-manager, AsyncStorage, jest-expo.

---

### Task 1: Scaffold project and test infrastructure

**Files:**
- Create: entire Expo project in repo root (`C:\Users\harry\Documents\code\facts-on-screen-app`)
- Modify: `package.json`, `app.json`

- [ ] **Step 1: Scaffold Expo app in the current directory**

Run (repo root — the directory already contains `docs/` and `.git/`, which is fine):

```bash
npx create-expo-app@latest . --template blank-typescript --no-install
npm install
```

Expected: `package.json`, `App.tsx`, `app.json`, `tsconfig.json` created.

- [ ] **Step 2: Install runtime dependencies**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-notifications expo-background-task expo-task-manager @react-native-async-storage/async-storage
```

- [ ] **Step 3: Install test dependencies**

```bash
npx expo install jest-expo jest @types/jest -- --save-dev
```

- [ ] **Step 4: Configure package.json for expo-router and jest**

In `package.json`, set the entry point and add scripts/jest config:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo",
    "testMatch": ["**/__tests__/**/*.test.ts"]
  }
}
```

(Keep all existing fields; only change `main`, merge `scripts`, add `jest`.)

- [ ] **Step 5: Configure app.json**

Replace the `expo` object's relevant fields (keep generated `icon`/`splash` fields as-is):

```json
{
  "expo": {
    "name": "Lock Screen Facts",
    "slug": "lock-screen-facts",
    "scheme": "lockscreenfacts",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "android": {
      "package": "com.harry.lockscreenfacts"
    },
    "plugins": [
      "expo-router",
      ["expo-notifications", {}],
      "expo-background-task"
    ]
  }
}
```

- [ ] **Step 6: Delete `App.tsx`** (expo-router uses the `app/` directory; created in Task 7).

```bash
rm App.tsx
```

- [ ] **Step 7: Create a placeholder route so the project still starts**

Create `app/index.tsx`:

```tsx
import { Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Lock Screen Facts</Text>
    </View>
  );
}
```

- [ ] **Step 8: Verify TypeScript compiles and jest runs**

```bash
npx tsc --noEmit
npx jest --passWithNoTests
```

Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo app with router, notifications, and jest"
```

---

### Task 2: Facts database

**Files:**
- Create: `data/facts.json`
- Create: `lib/facts.ts`
- Test: `lib/__tests__/facts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/facts.test.ts`:

```ts
import { FACTS, CATEGORIES } from '../facts';

describe('facts database', () => {
  it('has at least 10 facts in every category', () => {
    for (const category of CATEGORIES) {
      const count = FACTS.filter((f) => f.category === category).length;
      expect(count).toBeGreaterThanOrEqual(10);
    }
  });

  it('has unique ids', () => {
    const ids = FACTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses known categories', () => {
    for (const fact of FACTS) {
      expect(CATEGORIES).toContain(fact.category);
    }
  });

  it('has non-empty text under 240 chars (notification-friendly)', () => {
    for (const fact of FACTS) {
      expect(fact.text.length).toBeGreaterThan(0);
      expect(fact.text.length).toBeLessThanOrEqual(240);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/facts.test.ts`
Expected: FAIL — cannot find module `../facts`.

- [ ] **Step 3: Create `data/facts.json`**

Full content (10 facts per category; ids are `<cat>-<n>`):

```json
[
  { "id": "science-1", "category": "Science", "text": "Water can boil and freeze at the same time — it's called the triple point." },
  { "id": "science-2", "category": "Science", "text": "A teaspoon of honey represents the life work of about 12 bees." },
  { "id": "science-3", "category": "Science", "text": "Glass is neither a true solid nor a liquid — it's an amorphous solid." },
  { "id": "science-4", "category": "Science", "text": "Bananas are naturally slightly radioactive due to their potassium-40 content." },
  { "id": "science-5", "category": "Science", "text": "Hot water can freeze faster than cold water — known as the Mpemba effect." },
  { "id": "science-6", "category": "Science", "text": "Helium is the only element that cannot be solidified at normal pressure, no matter how cold." },
  { "id": "science-7", "category": "Science", "text": "There are more atoms in a glass of water than glasses of water in all the oceans." },
  { "id": "science-8", "category": "Science", "text": "Lightning is about five times hotter than the surface of the Sun." },
  { "id": "science-9", "category": "Science", "text": "A single bolt of lightning contains enough energy to toast about 100,000 slices of bread." },
  { "id": "science-10", "category": "Science", "text": "Sound travels roughly four times faster in water than in air." },
  { "id": "history-1", "category": "History", "text": "Oxford University is older than the Aztec Empire — teaching began there around 1096." },
  { "id": "history-2", "category": "History", "text": "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid." },
  { "id": "history-3", "category": "History", "text": "The shortest war in history, between Britain and Zanzibar in 1896, lasted under 40 minutes." },
  { "id": "history-4", "category": "History", "text": "Ancient Romans used crushed mouse brains as toothpaste." },
  { "id": "history-5", "category": "History", "text": "Woolly mammoths were still alive when the Great Pyramid of Giza was being built." },
  { "id": "history-6", "category": "History", "text": "Napoleon was once attacked by a horde of thousands of rabbits gathered for a hunt." },
  { "id": "history-7", "category": "History", "text": "The fax machine was invented before the American Civil War, in 1843." },
  { "id": "history-8", "category": "History", "text": "In ancient Egypt, servants were sometimes smeared with honey to attract flies away from the pharaoh." },
  { "id": "history-9", "category": "History", "text": "The Eiffel Tower was originally intended to be dismantled after 20 years." },
  { "id": "history-10", "category": "History", "text": "Vikings never actually wore horned helmets — that image came from 19th-century opera costumes." },
  { "id": "space-1", "category": "Space", "text": "A day on Venus is longer than a year on Venus." },
  { "id": "space-2", "category": "Space", "text": "Neutron stars are so dense that a sugar-cube-sized amount would weigh about a billion tons." },
  { "id": "space-3", "category": "Space", "text": "There are more stars in the universe than grains of sand on all of Earth's beaches." },
  { "id": "space-4", "category": "Space", "text": "Footprints left on the Moon will likely remain for millions of years — there's no wind to erase them." },
  { "id": "space-5", "category": "Space", "text": "The Sun makes up 99.86% of the mass of our solar system." },
  { "id": "space-6", "category": "Space", "text": "One million Earths could fit inside the Sun." },
  { "id": "space-7", "category": "Space", "text": "It rains diamonds on Neptune and Uranus." },
  { "id": "space-8", "category": "Space", "text": "Space is completely silent — sound waves need a medium to travel through." },
  { "id": "space-9", "category": "Space", "text": "Olympus Mons on Mars is nearly three times the height of Mount Everest." },
  { "id": "space-10", "category": "Space", "text": "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth." },
  { "id": "animals-1", "category": "Animals", "text": "Octopuses have three hearts, nine brains, and blue blood." },
  { "id": "animals-2", "category": "Animals", "text": "A group of flamingos is called a 'flamboyance'." },
  { "id": "animals-3", "category": "Animals", "text": "Sea otters hold hands while sleeping so they don't drift apart." },
  { "id": "animals-4", "category": "Animals", "text": "Cows have best friends and get stressed when separated from them." },
  { "id": "animals-5", "category": "Animals", "text": "A shrimp's heart is located in its head." },
  { "id": "animals-6", "category": "Animals", "text": "Sloths can hold their breath longer than dolphins — up to 40 minutes." },
  { "id": "animals-7", "category": "Animals", "text": "Tardigrades can survive in the vacuum of space." },
  { "id": "animals-8", "category": "Animals", "text": "Elephants are one of the few animals that can recognize themselves in a mirror." },
  { "id": "animals-9", "category": "Animals", "text": "A snail can sleep for up to three years at a time." },
  { "id": "animals-10", "category": "Animals", "text": "Crows can remember human faces and hold grudges for years." },
  { "id": "geography-1", "category": "Geography", "text": "Russia spans 11 time zones." },
  { "id": "geography-2", "category": "Geography", "text": "Africa is the only continent located in all four hemispheres." },
  { "id": "geography-3", "category": "Geography", "text": "Canada has more lakes than the rest of the world combined." },
  { "id": "geography-4", "category": "Geography", "text": "The Sahara Desert is roughly the same size as the entire United States." },
  { "id": "geography-5", "category": "Geography", "text": "Istanbul is the only major city located on two continents." },
  { "id": "geography-6", "category": "Geography", "text": "Australia is wider than the Moon." },
  { "id": "geography-7", "category": "Geography", "text": "The Dead Sea is so salty that people float effortlessly on its surface." },
  { "id": "geography-8", "category": "Geography", "text": "Mount Everest grows about 4 millimeters taller every year." },
  { "id": "geography-9", "category": "Geography", "text": "There's a town in Norway called Hell, and it freezes over every winter." },
  { "id": "geography-10", "category": "Geography", "text": "About 90% of the world's population lives in the Northern Hemisphere." },
  { "id": "humanbody-1", "category": "Human Body", "text": "Your body produces about 25 million new cells every second." },
  { "id": "humanbody-2", "category": "Human Body", "text": "The human brain uses about 20% of the body's total energy." },
  { "id": "humanbody-3", "category": "Human Body", "text": "Your stomach gets a new lining every few days to avoid digesting itself." },
  { "id": "humanbody-4", "category": "Human Body", "text": "Humans are the only animals known to blush." },
  { "id": "humanbody-5", "category": "Human Body", "text": "Your heart beats about 100,000 times a day." },
  { "id": "humanbody-6", "category": "Human Body", "text": "The strongest muscle in the body relative to its size is the masseter — your jaw muscle." },
  { "id": "humanbody-7", "category": "Human Body", "text": "You are about 1 centimeter taller in the morning than at night." },
  { "id": "humanbody-8", "category": "Human Body", "text": "The acid in your stomach is strong enough to dissolve razor blades." },
  { "id": "humanbody-9", "category": "Human Body", "text": "Your bones are about five times stronger than steel of the same density." },
  { "id": "humanbody-10", "category": "Human Body", "text": "Fingernails grow about four times faster than toenails." }
]
```

- [ ] **Step 4: Create `lib/facts.ts`**

```ts
import factsJson from '../data/facts.json';

export interface Fact {
  id: string;
  category: string;
  text: string;
}

export const CATEGORIES = [
  'Science',
  'History',
  'Space',
  'Animals',
  'Geography',
  'Human Body',
] as const;

export const FACTS: Fact[] = factsJson;
```

Note: `tsconfig.json` from the Expo template extends `expo/tsconfig.base`, which enables `resolveJsonModule`. If `npx tsc --noEmit` complains about the JSON import, add `"resolveJsonModule": true` under `compilerOptions`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest lib/__tests__/facts.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add data lib
git commit -m "feat: add bundled facts database with 6 categories"
```

---

### Task 3: Settings store

**Files:**
- Create: `lib/settings.ts`
- Test: `lib/__tests__/settings.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/settings.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../settings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('settings store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns defaults when nothing is stored', async () => {
    const settings = await loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('defaults enable all categories, 30 min interval, notifications on', () => {
    expect(DEFAULT_SETTINGS.enabledCategories).toEqual([
      'Science', 'History', 'Space', 'Animals', 'Geography', 'Human Body',
    ]);
    expect(DEFAULT_SETTINGS.intervalMinutes).toBe(30);
    expect(DEFAULT_SETTINGS.notificationsEnabled).toBe(true);
  });

  it('round-trips saved settings', async () => {
    const custom = {
      enabledCategories: ['Space'],
      intervalMinutes: 60,
      notificationsEnabled: false,
    };
    await saveSettings(custom);
    expect(await loadSettings()).toEqual(custom);
  });

  it('falls back to defaults on corrupt stored data', async () => {
    await AsyncStorage.setItem('settings-v1', 'not json{');
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/settings.test.ts`
Expected: FAIL — cannot find module `../settings`.

- [ ] **Step 3: Write the implementation**

Create `lib/settings.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES } from './facts';

const STORAGE_KEY = 'settings-v1';

export interface Settings {
  enabledCategories: string[];
  intervalMinutes: number; // 15 | 30 | 60 | 1440
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabledCategories: [...CATEGORIES],
  intervalMinutes: 30,
  notificationsEnabled: true,
};

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/settings.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib
git commit -m "feat: add AsyncStorage-backed settings store"
```

---

### Task 4: Scheduler pure logic

**Files:**
- Create: `lib/scheduler.ts`
- Test: `lib/__tests__/scheduler.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/scheduler.test.ts`:

```ts
import { pickFacts, buildSchedule } from '../scheduler';
import type { Fact } from '../facts';

const makeFacts = (category: string, n: number): Fact[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${category}-${i + 1}`,
    category,
    text: `${category} fact ${i + 1}`,
  }));

const FACTS = [...makeFacts('Science', 5), ...makeFacts('Space', 5)];

describe('pickFacts', () => {
  it('only returns facts from enabled categories', () => {
    const picked = pickFacts(FACTS, ['Space'], 20);
    expect(picked.every((f) => f.category === 'Space')).toBe(true);
  });

  it('returns the requested count, cycling if the pool is small', () => {
    expect(pickFacts(FACTS, ['Science'], 12)).toHaveLength(12);
  });

  it('does not repeat a fact until the whole pool is used', () => {
    const picked = pickFacts(FACTS, ['Science', 'Space'], 10);
    expect(new Set(picked.map((f) => f.id)).size).toBe(10);
  });

  it('never starts with lastFactId when alternatives exist', () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickFacts(FACTS, ['Science'], 5, 'Science-1');
      expect(picked[0].id).not.toBe('Science-1');
    }
  });

  it('returns empty array when no categories are enabled', () => {
    expect(pickFacts(FACTS, [], 10)).toEqual([]);
  });
});

describe('buildSchedule', () => {
  it('spaces facts by the interval starting one interval after startTime', () => {
    const facts = makeFacts('Science', 3);
    const start = new Date('2026-07-04T12:00:00Z');
    const schedule = buildSchedule(facts, 30, start);
    expect(schedule.map((s) => s.date.toISOString())).toEqual([
      '2026-07-04T12:30:00.000Z',
      '2026-07-04T13:00:00.000Z',
      '2026-07-04T13:30:00.000Z',
    ]);
    expect(schedule.map((s) => s.fact.id)).toEqual(['Science-1', 'Science-2', 'Science-3']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/scheduler.test.ts`
Expected: FAIL — cannot find module `../scheduler`.

- [ ] **Step 3: Write the implementation**

Create `lib/scheduler.ts`:

```ts
import type { Fact } from './facts';

export interface ScheduledFact {
  fact: Fact;
  date: Date;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickFacts(
  facts: Fact[],
  enabledCategories: string[],
  count: number,
  lastFactId?: string
): Fact[] {
  const pool = facts.filter((f) => enabledCategories.includes(f.category));
  if (pool.length === 0) return [];

  const result: Fact[] = [];
  while (result.length < count) {
    const round = shuffle(pool);
    // Avoid repeating the previous fact (end of last round, or lastFactId).
    const previousId = result.length > 0 ? result[result.length - 1].id : lastFactId;
    if (round.length > 1 && previousId && round[0].id === previousId) {
      [round[0], round[1]] = [round[1], round[0]];
    }
    result.push(...round);
  }
  return result.slice(0, count);
}

export function buildSchedule(
  facts: Fact[],
  intervalMinutes: number,
  startTime: Date
): ScheduledFact[] {
  return facts.map((fact, i) => ({
    fact,
    date: new Date(startTime.getTime() + (i + 1) * intervalMinutes * 60_000),
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/scheduler.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Run the full suite**

Run: `npx jest`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib
git commit -m "feat: add pure scheduler logic for fact picking and timing"
```

---

### Task 5: Notification orchestration

**Files:**
- Create: `lib/notifications.ts`

No unit tests — this module is a thin wrapper around `expo-notifications` device APIs; verified manually on device in Task 10.

- [ ] **Step 1: Write the module**

Create `lib/notifications.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FACTS } from './facts';
import { loadSettings } from './settings';
import { buildSchedule, pickFacts } from './scheduler';

const CHANNEL_ID = 'facts';
const QUEUE_SIZE = 50;

// Show notifications even while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Facts',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Cancels everything and schedules the next QUEUE_SIZE facts.
 * Called on app open, settings change, and by the background top-up task.
 */
export async function rescheduleAll(): Promise<void> {
  const settings = await loadSettings();

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();

  if (!settings.notificationsEnabled) return;

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  await ensureChannel();

  const picked = pickFacts(FACTS, settings.enabledCategories, QUEUE_SIZE);
  const schedule = buildSchedule(picked, settings.intervalMinutes, new Date());

  for (const { fact, date } of schedule) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${fact.category} fact`,
        body: fact.text,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID,
      },
    });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: exit 0. (If `SchedulableTriggerInputTypes` doesn't exist in the installed expo-notifications version, use `trigger: { date, channelId: CHANNEL_ID } as Notifications.DateTriggerInput` per that version's docs.)

- [ ] **Step 3: Commit**

```bash
git add lib/notifications.ts
git commit -m "feat: add notification scheduling orchestration"
```

---

### Task 6: Background top-up task

**Files:**
- Create: `lib/backgroundTask.ts`

- [ ] **Step 1: Write the module**

Create `lib/backgroundTask.ts`:

```ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { rescheduleAll } from './notifications';

const TASK_NAME = 'facts-queue-topup';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await rescheduleAll();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundTopUp(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 6, // minutes — top up roughly every 6 hours
    });
  } catch {
    // Background tasks unavailable (e.g., Expo Go) — queue still tops up on app open.
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/backgroundTask.ts
git commit -m "feat: add background task to top up the notification queue"
```

---

### Task 7: Root layout wiring

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Write the layout**

Create `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerBackgroundTopUp } from '../lib/backgroundTask';
import { rescheduleAll } from '../lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    // Top up the queue on every app open; register the background task once.
    rescheduleAll();
    registerBackgroundTopUp();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Lock Screen Facts' }} />
      <Stack.Screen name="browse" options={{ title: 'Browse Facts' }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wire queue top-up and background task into root layout"
```

---

### Task 8: Home screen

**Files:**
- Modify: `app/index.tsx` (replace placeholder entirely)

- [ ] **Step 1: Write the screen**

Replace `app/index.tsx` with:

```tsx
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { CATEGORIES, FACTS } from '../lib/facts';
import { requestNotificationPermission, rescheduleAll } from '../lib/notifications';
import { pickFacts } from '../lib/scheduler';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from '../lib/settings';

const INTERVALS: { label: string; minutes: number }[] = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: 'Hourly', minutes: 60 },
  { label: 'Daily', minutes: 1440 },
];

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [previewFact, setPreviewFact] = useState('');

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
      setLoaded(true);
      setPermissionGranted(await requestNotificationPermission());
      refreshPreview(s);
    })();
  }, []);

  function refreshPreview(s: Settings) {
    const [fact] = pickFacts(FACTS, s.enabledCategories, 1);
    setPreviewFact(fact ? fact.text : '');
  }

  async function update(next: Settings) {
    setSettings(next);
    await saveSettings(next);
    await rescheduleAll();
    refreshPreview(next);
  }

  function toggleCategory(category: string) {
    const enabled = settings.enabledCategories.includes(category)
      ? settings.enabledCategories.filter((c) => c !== category)
      : [...settings.enabledCategories, category];
    if (enabled.length === 0) return; // must keep at least one
    update({ ...settings, enabledCategories: enabled });
  }

  if (!loaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!permissionGranted && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Notifications are disabled, so facts can't appear on your lock screen.
          </Text>
          <Pressable onPress={() => Linking.openSettings()}>
            <Text style={styles.bannerLink}>Open settings</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Up next on your lock screen</Text>
        <Text style={styles.previewText}>{previewFact}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.sectionTitle}>Lock screen facts</Text>
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(v) => update({ ...settings, notificationsEnabled: v })}
        />
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category) => {
          const active = settings.enabledCategories.includes(category);
          return (
            <Pressable
              key={category}
              onPress={() => toggleCategory(category)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>New fact every</Text>
      <View style={styles.chips}>
        {INTERVALS.map(({ label, minutes }) => {
          const active = settings.intervalMinutes === minutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => update({ ...settings, intervalMinutes: minutes })}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Link href="/browse" style={styles.browseLink}>
        Browse all facts →
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  banner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  bannerText: { color: '#664D03' },
  bannerLink: { color: '#0A58CA', fontWeight: '600' },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardLabel: { color: '#A6ADC8', fontSize: 12, textTransform: 'uppercase' },
  previewText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCC',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: '#1E1E2E', borderColor: '#1E1E2E' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#FFF' },
  browseLink: { marginTop: 16, color: '#0A58CA', fontSize: 16 },
});
```

- [ ] **Step 2: Verify TypeScript compiles and tests still pass**

Run: `npx tsc --noEmit && npx jest`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add home screen with category, interval, and permission UI"
```

---

### Task 9: Browse screen

**Files:**
- Create: `app/browse.tsx`

- [ ] **Step 1: Write the screen**

Create `app/browse.tsx`:

```tsx
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, FACTS } from '../lib/facts';

const SECTIONS = CATEGORIES.map((category) => ({
  title: category,
  data: FACTS.filter((f) => f.category === category),
}));

export default function Browse() {
  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderSectionHeader={({ section }) => (
        <Text style={styles.header}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.itemText}>{item.text}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  item: {
    backgroundColor: '#F4F4F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemText: { fontSize: 15, lineHeight: 21 },
});
```

- [ ] **Step 2: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx jest`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add app/browse.tsx
git commit -m "feat: add browse screen listing all facts by category"
```

---

### Task 10: EAS build config and README

**Files:**
- Create: `eas.json`
- Create: `README.md`

- [ ] **Step 1: Create `eas.json`**

```json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

- [ ] **Step 2: Create `README.md`**

```markdown
# Lock Screen Facts

An Android app that shows a rotating fact on your lock screen via notifications.
Pick categories (Science, History, Space, Animals, Geography, Human Body) and how
often the fact refreshes.

## How it works

Android apps can't draw directly on the lock screen, so this app pre-schedules a
queue of ~50 local notifications at your chosen interval. Notifications appear on
the lock screen by default. A background task and app-open logic keep the queue
topped up and dismiss older facts.

## Development

```bash
npm install
npx expo start        # run in Expo Go (background task won't run there; queue tops up on app open)
npm test              # unit tests
```

## Building an installable APK

Requires a free [Expo account](https://expo.dev) and `npm i -g eas-cli`.

```bash
eas login
eas build -p android --profile preview
```

When the build finishes, install the APK from the link EAS prints (or the QR code)
on your Android device.

## Notes

- Android 13+ asks for notification permission on first launch — accept it.
- Notification timing is approximate; Android may batch or defer notifications
  under battery optimization.
```

- [ ] **Step 3: Run the full verification suite**

```bash
npx tsc --noEmit && npx jest
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add eas.json README.md
git commit -m "chore: add EAS build config and README"
```

- [ ] **Step 5: Manual device verification (user-assisted)**

Start the dev server (`npx expo start`), open in Expo Go or a dev build, and verify:
1. Permission prompt appears; accepting removes the banner.
2. Toggling categories updates the preview fact.
3. Scheduled notifications appear (set interval to 15 min and lock the phone).
4. Notifications show on the lock screen.

For the full experience (background task), build the preview APK with EAS.
