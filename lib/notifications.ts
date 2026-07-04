import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { FACTS } from './facts';
import { loadSettings } from './settings';
import { buildSchedule, pickFacts } from './scheduler';

const CHANNEL_ID = 'facts';
const QUEUE_SIZE = 50;

// Since SDK 53, expo-notifications throws when imported inside Expo Go on
// Android. Detect Expo Go and skip notifications entirely there — the rest of
// the app still works, and real builds (EAS/dev build) get full functionality.
export const NOTIFICATIONS_AVAILABLE =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

const Notifications: typeof import('expo-notifications') | null =
  NOTIFICATIONS_AVAILABLE ? require('expo-notifications') : null;

if (Notifications) {
  // Show notifications even while the app is in the foreground.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
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
  if (!Notifications) return false;
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
  if (!Notifications) return;
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
