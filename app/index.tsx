import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ParticleField from '../components/ParticleField';
import { CATEGORIES } from '../lib/facts';
import {
  getScheduleInfo,
  NOTIFICATIONS_AVAILABLE,
  requestNotificationPermission,
  rescheduleAll,
  ScheduleInfo,
} from '../lib/notifications';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from '../lib/settings';
import { CATEGORY_META, Palette } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const INTERVALS: { label: string; minutes: number; sentence: string }[] = [
  { label: '15m', minutes: 15, sentence: 'Every 15 min' },
  { label: '30m', minutes: 30, sentence: 'Every 30 min' },
  { label: '1h', minutes: 60, sentence: 'Every hour' },
  { label: '24h', minutes: 1440, sentence: 'Once a day' },
];

function formatNext(date: Date): string {
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Today, ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { mode, palette, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);

  const refreshScheduleInfo = useCallback(async () => {
    setScheduleInfo(await getScheduleInfo());
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
      setLoaded(true);
      setPermissionGranted(await requestNotificationPermission());
      await rescheduleAll();
      await refreshScheduleInfo();
    })();
  }, [refreshScheduleInfo]);

  async function update(next: Settings) {
    setSettings(next);
    await saveSettings(next);
    await rescheduleAll();
    await refreshScheduleInfo();
  }

  function toggleCategory(category: string) {
    const enabled = settings.enabledCategories.includes(category)
      ? settings.enabledCategories.filter((c) => c !== category)
      : [...settings.enabledCategories, category];
    if (enabled.length === 0) return; // must keep at least one
    update({ ...settings, enabledCategories: enabled });
  }

  if (!loaded) return null;

  const intervalIndex = Math.max(
    0,
    INTERVALS.findIndex((i) => i.minutes === settings.intervalMinutes)
  );

  return (
    <LinearGradient
      colors={[palette.bgTop, palette.bgMid, palette.bgBottom]}
      locations={[0, 0.55, 1]}
      style={styles.root}
    >
      <ParticleField color={palette.particle} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Lock Screen Facts</Text>
          <View style={styles.headerButtons}>
            <Pressable style={styles.roundButton} onPress={toggleTheme}>
              <Ionicons
                name={mode === 'dark' ? 'sunny' : 'moon'}
                size={20}
                color={palette.text}
              />
            </Pressable>
            <Pressable style={styles.roundButton} onPress={() => Linking.openSettings()}>
              <Ionicons name="settings-sharp" size={20} color={palette.text} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtitle}>Learn something new, every time you unlock.</Text>

        {!NOTIFICATIONS_AVAILABLE && (
          <View style={styles.notice}>
            <Ionicons name="information-circle" size={20} color={palette.accentBright} />
            <Text style={styles.noticeText}>
              Expo Go can't show notifications. The UI works here — install a real
              build to get facts on your lock screen.
            </Text>
          </View>
        )}
        {NOTIFICATIONS_AVAILABLE && !permissionGranted && (
          <View style={styles.notice}>
            <Ionicons name="notifications-off" size={20} color={palette.accentBright} />
            <Text style={styles.noticeText}>
              Notifications are disabled, so facts can't reach your lock screen.{' '}
              <Text style={styles.noticeLink} onPress={() => Linking.openSettings()}>
                Open settings
              </Text>
            </Text>
          </View>
        )}

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((category) => {
            const active = settings.enabledCategories.includes(category);
            const meta = CATEGORY_META[category];
            return (
              <Pressable
                key={category}
                onPress={() => toggleCategory(category)}
                style={[styles.categoryCard, !active && styles.categoryCardOff]}
              >
                <View style={[styles.iconTile, { backgroundColor: meta.tile }]}>
                  <Ionicons name={meta.icon as never} size={20} color={meta.color} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {category}
                </Text>
                <View style={[styles.check, active ? styles.checkOn : styles.checkOff]}>
                  {active && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.comingSoon}>
          <View style={styles.plusTile}>
            <Ionicons name="add" size={20} color={palette.accentBright} />
          </View>
          <Text style={styles.comingSoonText}>More categories coming soon</Text>
        </View>

        {/* Refresh interval */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Refresh Interval</Text>
            <Text style={styles.cardValue}>{INTERVALS[intervalIndex].sentence}</Text>
          </View>
          <Text style={styles.cardHint}>How often you'll see a new fact.</Text>

          <View style={styles.sliderTrack}>
            <View style={styles.trackLine} />
            <View
              style={[
                styles.trackFill,
                { width: `${(intervalIndex / (INTERVALS.length - 1)) * 100}%` },
              ]}
            />
            <View style={styles.ticksRow}>
              {INTERVALS.map((interval, i) => (
                <Pressable
                  key={interval.minutes}
                  onPress={() => update({ ...settings, intervalMinutes: interval.minutes })}
                  style={styles.tickHit}
                  hitSlop={10}
                >
                  {i === intervalIndex ? (
                    <View style={styles.thumb}>
                      <View style={styles.thumbInner} />
                    </View>
                  ) : (
                    <View style={styles.tick} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.labelsRow}>
            {INTERVALS.map((interval, i) => (
              <Text
                key={interval.minutes}
                style={[styles.tickLabel, i === intervalIndex && styles.tickLabelActive]}
              >
                {interval.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Scheduled notifications */}
        <Pressable
          style={styles.card}
          onPress={() =>
            update({ ...settings, notificationsEnabled: !settings.notificationsEnabled })
          }
        >
          <View style={styles.scheduleRow}>
            <View style={styles.clockTile}>
              <Ionicons
                name={settings.notificationsEnabled ? 'time-outline' : 'pause'}
                size={24}
                color={palette.accentBright}
              />
            </View>
            <View style={styles.scheduleTextWrap}>
              <Text style={styles.cardTitle}>Scheduled Notifications</Text>
              {settings.notificationsEnabled ? (
                <>
                  <Text style={styles.scheduleDetail}>
                    {scheduleInfo
                      ? `${scheduleInfo.count} notifications scheduled`
                      : 'Available in the full build'}
                  </Text>
                  {scheduleInfo?.nextDate && (
                    <Text style={styles.scheduleNext}>
                      Next: {formatNext(scheduleInfo.nextDate)}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.scheduleDetail}>Paused — tap to resume</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.textFaint} />
          </View>
        </Pressable>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="sparkles" size={22} color={palette.accentBright} />
          <Text style={styles.infoText}>
            We'll deliver a new fact to your lock screen at your chosen interval.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const createStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1 },
    container: { paddingHorizontal: 20 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      color: p.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
      flexShrink: 1,
    },
    headerButtons: { flexDirection: 'row', gap: 10 },
    roundButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.cardBorder,
    },
    subtitle: {
      color: p.textMuted,
      fontSize: 15,
      marginTop: 6,
      marginBottom: 24,
    },
    notice: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.cardBorder,
      borderRadius: 14,
      padding: 14,
      marginBottom: 20,
    },
    noticeText: { color: p.textMuted, flex: 1, lineHeight: 19 },
    noticeLink: { color: p.accentBright, fontWeight: '600' },
    sectionTitle: {
      color: p.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 14,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryCard: {
      width: '48%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.cardBorder,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
    categoryCardOff: { opacity: 0.55 },
    iconTile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryName: {
      color: p.text,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: { backgroundColor: p.accent },
    checkOff: { borderWidth: 1.5, borderColor: p.trackLine },
    comingSoon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: p.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.cardBorder,
      padding: 14,
      marginTop: 12,
      marginBottom: 24,
    },
    plusTile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: p.accent,
    },
    comingSoonText: { color: p.textFaint, fontSize: 15 },
    card: {
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.cardBorder,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: { color: p.text, fontSize: 17, fontWeight: '700' },
    cardValue: { color: p.accentBright, fontSize: 15, fontWeight: '600' },
    cardHint: { color: p.textMuted, fontSize: 14, marginTop: 4 },
    sliderTrack: {
      height: 32,
      justifyContent: 'center',
      marginTop: 18,
    },
    trackLine: {
      position: 'absolute',
      left: 10,
      right: 10,
      height: 3,
      borderRadius: 2,
      backgroundColor: p.trackLine,
    },
    trackFill: {
      position: 'absolute',
      left: 10,
      height: 3,
      borderRadius: 2,
      backgroundColor: p.accent,
    },
    ticksRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tickHit: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tick: {
      width: 3,
      height: 12,
      borderRadius: 2,
      backgroundColor: p.trackLine,
    },
    thumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: p.accent,
      shadowOpacity: 0.6,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
    thumbInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFF',
    },
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: 2,
    },
    tickLabel: {
      color: p.textFaint,
      fontSize: 13,
      width: 32,
      textAlign: 'center',
    },
    tickLabelActive: { color: p.accentBright, fontWeight: '700' },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    clockTile: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(139, 92, 246, 0.14)',
    },
    scheduleTextWrap: { flex: 1, gap: 3 },
    scheduleDetail: { color: p.textMuted, fontSize: 14 },
    scheduleNext: { color: p.textFaint, fontSize: 14 },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: p.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.cardBorder,
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    infoText: { color: p.textMuted, fontSize: 15, lineHeight: 21, flex: 1 },
  });
