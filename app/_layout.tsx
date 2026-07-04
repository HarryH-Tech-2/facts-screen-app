import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerBackgroundTopUp } from '../lib/backgroundTask';
import { rescheduleAll } from '../lib/notifications';
import { ThemeProvider, useTheme } from '../lib/theme-context';

function AppTabs() {
  const insets = useSafeAreaInsets();
  const { mode, palette } = useTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: palette.bgTop },
          tabBarShowLabel: true,
          tabBarActiveTintColor: palette.accentBright,
          tabBarInactiveTintColor: palette.textFaint,
          tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 12, // stay clear of the device nav bar / gesture area
            height: 64,
            paddingTop: 8,
            paddingBottom: 10,
            borderRadius: 32,
            backgroundColor: palette.tabBar,
            borderTopWidth: 1,
            borderWidth: 1,
            borderColor: palette.cardBorder,
            borderTopColor: palette.cardBorder,
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            title: 'Browse',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Top up the queue on every app open; register the background task once.
    rescheduleAll();
    registerBackgroundTopUp();
  }, []);

  return (
    <ThemeProvider>
      <AppTabs />
    </ThemeProvider>
  );
}
