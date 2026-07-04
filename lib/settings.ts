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
