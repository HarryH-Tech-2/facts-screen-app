# Lock-Screen Wallpaper Facts — Design

Date: 2026-07-28

## Goal

Show a fact **persistently on the Android lock screen** that changes on an
interval, **without** relying on a fired notification. Keep the existing
notification feature available too.

## Platform constraint

Third-party Android apps cannot draw custom content directly onto the lock
screen. The only supported way to show persistent custom text there is to set
the **lock-screen wallpaper** (`WallpaperManager.setBitmap(..., FLAG_LOCK)`) to
an image the app generates. A background worker regenerates the image on an
interval. Interval is best-effort (WorkManager min ~15 min, deferred in Doze).

## Decisions

- **Two user-selectable styles:**
  1. *Generated* — app draws a themed gradient background + fact text.
  2. *Photo* — user picks a photo; app overlays the fact (with a legibility
     scrim) on a copy of it.
- **Notifications stay** as an independent toggle (wallpaper, notifications, or
  both).
- **One shared interval** (15/30/60/1440 min) drives both modes.
- **Lock screen only** (`FLAG_LOCK`); home screen wallpaper untouched.
- **Approach A — native refresh engine:** scheduling + drawing + wallpaper set
  all happen in native Kotlin (WorkManager). No JS runs at refresh time.

## Architecture

JS owns all UI and decisions; native only draws what JS tells it to. No
fact-selection or theme logic is duplicated in Kotlin.

### Native module: `modules/expo-wallpaper` (local Expo module, Android only)

- `ExpoWallpaperModule.kt` — JS bridge. Functions:
  - `applyNow(configJson: String)` — persist config, draw + set wallpaper once.
  - `schedule(intervalMinutes: Int)` — register periodic `WallpaperWorker`.
  - `cancel()` — cancel the worker.
  - `isSupported()` — API 24+ check.
- `ConfigStore.kt` — reads/writes JSON config in SharedPreferences.
- `WallpaperRenderer.kt` — draws the bitmap (gradient or photo + scrim + text)
  via `android.graphics.Canvas` / `StaticLayout`.
- `WallpaperWorker.kt` — periodic worker: read config, pick `queue[index]`,
  render, set `FLAG_LOCK` wallpaper, advance + persist index.

### Config (written by JS, read by native)

```jsonc
{
  "mode": "generated" | "photo",
  "photoPath": "/data/.../fact-photo.jpg" | null,
  "themeColors": { "top": "#RRGGBB", "mid": "#RRGGBB", "bottom": "#RRGGBB",
                   "text": "#RRGGBB", "muted": "#RRGGBB" },
  "queue": [ { "category": "Science", "text": "..." }, ... ],
  "index": 0,
  "intervalMinutes": 15,
  "enabled": true
}
```

### JS side

- `lib/wallpaper.ts` — build the queue via existing `pickFacts`, assemble the
  config, call the native module, manage the enabled/style/photo settings.
- `lib/settings.ts` — extend `Settings` with `wallpaperEnabled`,
  `wallpaperStyle` ('generated' | 'photo'), `wallpaperPhotoUri`.
- UI in `app/index.tsx` — a "Lock screen wallpaper" card: enable toggle, style
  segmented control, "Choose photo" (expo-image-picker) when style = photo, and
  "Apply now".

## Rendering spec

- Bitmap sized to the device screen (real pixels).
- **Generated:** vertical gradient from theme `top`→`mid`→`bottom`. Category
  label (small, uppercase, muted) then fact text (large, wrapped via
  `StaticLayout`) centered with generous horizontal margins.
- **Photo:** decode + center-crop the chosen photo to the bitmap size, draw a
  bottom-weighted dark scrim for legibility, then category + fact text in the
  lower third.

## Permissions

- `SET_WALLPAPER` — normal permission, granted at install (no runtime prompt).
- Photo access via `expo-image-picker`; the picked image is copied into app
  storage so the background worker can read it without media permissions.

## Error handling / constraints

- `applyNow`/worker wrapped in try/catch; worker returns `Result.retry()` on
  transient failure, `Result.success()` otherwise.
- If `queue` empty or `enabled` false → worker no-ops.
- API < 24 → `isSupported()` false; UI shows an unsupported notice and hides the
  wallpaper card.
- Interval is best-effort; UI copy states the fact changes "about every N min".

## Testing

- Unit: queue-building in `lib/wallpaper.ts` (reuses tested `pickFacts`).
- Native rendering/worker verified on-device via a preview build (no unit
  harness for Android Canvas/WorkManager).
