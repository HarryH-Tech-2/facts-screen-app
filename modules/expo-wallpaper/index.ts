import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface WallpaperThemeColors {
  top: string;
  mid: string;
  bottom: string;
  text: string;
  muted: string;
}

export interface WallpaperQueueItem {
  category: string;
  text: string;
}

export interface WallpaperConfig {
  mode: 'generated' | 'photo';
  photoPath: string | null;
  themeColors: WallpaperThemeColors;
  queue: WallpaperQueueItem[];
  index: number;
  intervalMinutes: number;
  enabled: boolean;
}

interface ExpoWallpaperNativeModule {
  isSupported(): boolean;
  applyNow(configJson: string): Promise<boolean>;
  schedule(intervalMinutes: number): Promise<void>;
  cancel(): Promise<void>;
  importPhoto(uri: string): Promise<string>;
}

// The native module only exists on Android real builds. Guard everything so the
// JS bundle still loads on other platforms / in Expo Go.
const nativeModule: ExpoWallpaperNativeModule | null =
  Platform.OS === 'android'
    ? (() => {
        try {
          return requireNativeModule<ExpoWallpaperNativeModule>('ExpoWallpaper');
        } catch {
          return null;
        }
      })()
    : null;

export const WALLPAPER_AVAILABLE = nativeModule !== null;

export function isSupported(): boolean {
  return nativeModule?.isSupported() ?? false;
}

/** Persists the config and draws + sets the lock wallpaper once, immediately. */
export async function applyNow(config: WallpaperConfig): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.applyNow(JSON.stringify(config));
}

/** Registers the periodic background worker that refreshes the wallpaper. */
export async function schedule(intervalMinutes: number): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.schedule(intervalMinutes);
}

/** Cancels the periodic background worker. */
export async function cancel(): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.cancel();
}

/**
 * Copies a picked image into app-internal storage and returns an absolute file
 * path the background worker can decode.
 */
export async function importPhoto(uri: string): Promise<string | null> {
  if (!nativeModule) return null;
  return nativeModule.importPhoto(uri);
}
