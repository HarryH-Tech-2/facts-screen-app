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
