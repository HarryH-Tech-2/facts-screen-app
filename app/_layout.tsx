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
