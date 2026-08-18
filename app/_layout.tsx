import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerBackgroundTopUp } from '../lib/backgroundTask';
import { TILE_INK } from '../lib/theme';
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
          tabBarActiveTintColor: TILE_INK,
          tabBarInactiveTintColor: palette.textFaint,
          tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
          tabBarActiveBackgroundColor: '#F9C15C',
          tabBarItemStyle: {
            marginHorizontal: 8,
            marginVertical: 6,
            borderRadius: 12,
            overflow: 'hidden',
          },
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 12, // stay clear of the device nav bar / gesture area
            height: 66,
            borderRadius: 18,
            backgroundColor: palette.tabBar,
            borderWidth: 2.5,
            borderColor: palette.ink,
            borderTopWidth: 2.5,
            borderTopColor: palette.ink,
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
    // The Home screen (index) owns queue scheduling on app open — it requests
    // notification permission first, then reschedules. Calling rescheduleAll()
    // here too raced that call (both cancel-then-reschedule) and could leave the
    // queue empty on a fresh launch. Here we only register the background task.
    registerBackgroundTopUp();
  }, []);

  return (
    <ThemeProvider>
      <AppTabs />
    </ThemeProvider>
  );
}
