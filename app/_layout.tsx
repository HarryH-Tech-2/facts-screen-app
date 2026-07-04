import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerBackgroundTopUp } from '../lib/backgroundTask';
import { rescheduleAll } from '../lib/notifications';
import { COLORS } from '../lib/theme';

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Top up the queue on every app open; register the background task once.
    rescheduleAll();
    registerBackgroundTopUp();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: COLORS.bgTop },
          tabBarShowLabel: true,
          tabBarActiveTintColor: COLORS.accentBright,
          tabBarInactiveTintColor: COLORS.textFaint,
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
            backgroundColor: 'rgba(26, 31, 61, 0.96)',
            borderTopWidth: 1,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
            borderTopColor: COLORS.cardBorder,
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
