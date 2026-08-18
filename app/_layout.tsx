import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerBackgroundTopUp } from '../lib/backgroundTask';
import { ThemeProvider, useTheme } from '../lib/theme-context';

function AppStack() {
  const { mode, palette } = useTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bgTop },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // The Home screen (index) owns queue scheduling on app open — it requests
    // notification permission first, then reschedules. Calling rescheduleAll()
    // here too raced that call (both cancel-then-reschedule) and could leave the
    // queue empty on a fresh launch. Here we only register the background task.
    registerBackgroundTopUp();
  }, []);

  return (
    <ThemeProvider>
      <AppStack />
    </ThemeProvider>
  );
}
