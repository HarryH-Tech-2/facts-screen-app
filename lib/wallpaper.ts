import * as ImagePicker from 'expo-image-picker';
import * as Wallpaper from '../modules/expo-wallpaper';
import { FACTS } from './facts';
import { pickFacts } from './scheduler';
import { Settings } from './settings';
import type { Palette } from './theme';

// A generous queue so the background worker can cycle for a long time between
// app opens (each open rebuilds it with a fresh shuffle).
const QUEUE_SIZE = 200;

export const WALLPAPER_AVAILABLE = Wallpaper.WALLPAPER_AVAILABLE;

/** Whether the device's Android version supports setting the lock wallpaper. */
export function wallpaperSupported(): boolean {
  return Wallpaper.isSupported();
}

function buildConfig(settings: Settings, palette: Palette): Wallpaper.WallpaperConfig {
  const picked = pickFacts(FACTS, settings.enabledCategories, QUEUE_SIZE);
  const queue = picked.map((f) => ({ category: f.category, text: f.text }));

  const photoPath =
    settings.wallpaperStyle === 'photo' && settings.wallpaperPhotoUri
      ? settings.wallpaperPhotoUri
      : null;

  return {
    mode: settings.wallpaperStyle,
    photoPath,
    themeColors: {
      top: palette.bgTop,
      mid: palette.bgMid,
      bottom: palette.bgBottom,
      text: palette.text,
      muted: palette.textMuted,
    },
    queue,
    index: 0,
    intervalMinutes: settings.intervalMinutes,
    enabled: settings.wallpaperEnabled,
  };
}

/**
 * Applies the current settings to the lock-screen wallpaper: writes the config,
 * sets the wallpaper immediately, and (re)schedules the background refresh.
 * When wallpaper mode is off, cancels the worker instead.
 * Returns true if a wallpaper was set right now.
 */
export async function syncWallpaper(settings: Settings, palette: Palette): Promise<boolean> {
  if (!WALLPAPER_AVAILABLE) return false;

  const config = buildConfig(settings, palette);
  // Persist config either way so a re-enable has fresh data.
  const applied = await Wallpaper.applyNow(config);

  // A photo-style config with no chosen photo yet isn't ready to schedule.
  const ready =
    settings.wallpaperEnabled &&
    (settings.wallpaperStyle === 'generated' || settings.wallpaperPhotoUri != null);

  if (ready) {
    await Wallpaper.schedule(settings.intervalMinutes);
  } else {
    await Wallpaper.cancel();
  }

  return applied;
}

/**
 * Opens the image library, imports the chosen photo into app storage, and
 * returns an absolute path for the background worker (or null if cancelled).
 */
export async function pickWallpaperPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });
  if (result.canceled || result.assets.length === 0) return null;

  return Wallpaper.importPhoto(result.assets[0].uri);
}
