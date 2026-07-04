import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { CATEGORIES, FACTS } from '../lib/facts';
import {
  NOTIFICATIONS_AVAILABLE,
  requestNotificationPermission,
  rescheduleAll,
} from '../lib/notifications';
import { pickFacts } from '../lib/scheduler';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from '../lib/settings';

const INTERVALS: { label: string; minutes: number }[] = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: 'Hourly', minutes: 60 },
  { label: 'Daily', minutes: 1440 },
];

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [previewFact, setPreviewFact] = useState('');

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
      setLoaded(true);
      setPermissionGranted(await requestNotificationPermission());
      refreshPreview(s);
    })();
  }, []);

  function refreshPreview(s: Settings) {
    const [fact] = pickFacts(FACTS, s.enabledCategories, 1);
    setPreviewFact(fact ? fact.text : '');
  }

  async function update(next: Settings) {
    setSettings(next);
    await saveSettings(next);
    await rescheduleAll();
    refreshPreview(next);
  }

  function toggleCategory(category: string) {
    const enabled = settings.enabledCategories.includes(category)
      ? settings.enabledCategories.filter((c) => c !== category)
      : [...settings.enabledCategories, category];
    if (enabled.length === 0) return; // must keep at least one
    update({ ...settings, enabledCategories: enabled });
  }

  if (!loaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!NOTIFICATIONS_AVAILABLE && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            You're running in Expo Go, which doesn't support notifications. The UI
            works here, but to see facts on your lock screen install a real build
            (eas build -p android --profile preview).
          </Text>
        </View>
      )}
      {NOTIFICATIONS_AVAILABLE && !permissionGranted && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Notifications are disabled, so facts can't appear on your lock screen.
          </Text>
          <Pressable onPress={() => Linking.openSettings()}>
            <Text style={styles.bannerLink}>Open settings</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Up next on your lock screen</Text>
        <Text style={styles.previewText}>{previewFact}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.sectionTitle}>Lock screen facts</Text>
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(v) => update({ ...settings, notificationsEnabled: v })}
        />
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category) => {
          const active = settings.enabledCategories.includes(category);
          return (
            <Pressable
              key={category}
              onPress={() => toggleCategory(category)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>New fact every</Text>
      <View style={styles.chips}>
        {INTERVALS.map(({ label, minutes }) => {
          const active = settings.intervalMinutes === minutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => update({ ...settings, intervalMinutes: minutes })}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Link href="/browse" style={styles.browseLink}>
        Browse all facts →
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  banner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  bannerText: { color: '#664D03' },
  bannerLink: { color: '#0A58CA', fontWeight: '600' },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardLabel: { color: '#A6ADC8', fontSize: 12, textTransform: 'uppercase' },
  previewText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCC',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: '#1E1E2E', borderColor: '#1E1E2E' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#FFF' },
  browseLink: { marginTop: 16, color: '#0A58CA', fontSize: 16 },
});
