import { NOTIFICATIONS_AVAILABLE, rescheduleAll } from './notifications';

const TASK_NAME = 'facts-queue-topup';

// expo-background-task is not supported in Expo Go; only wire it up in real builds.
if (NOTIFICATIONS_AVAILABLE) {
  const BackgroundTask = require('expo-background-task') as typeof import('expo-background-task');
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');

  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      await rescheduleAll();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerBackgroundTopUp(): Promise<void> {
  if (!NOTIFICATIONS_AVAILABLE) return;
  try {
    const BackgroundTask = require('expo-background-task') as typeof import('expo-background-task');
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 6, // minutes — top up roughly every 6 hours
    });
  } catch {
    // Background tasks unavailable — queue still tops up on app open.
  }
}
