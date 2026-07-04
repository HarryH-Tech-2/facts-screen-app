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
