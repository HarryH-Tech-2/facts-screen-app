import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '../lib/facts';
import {
  NOTIFICATIONS_AVAILABLE,
  requestNotificationPermission,
  rescheduleAll,
} from '../lib/notifications';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  Settings,
  WallpaperStyle,
} from '../lib/settings';
import { CATEGORY_META, Palette, TILE_INK, tilt } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import {
  pickWallpaperPhoto,
  syncWallpaper,
  WALLPAPER_AVAILABLE,
  wallpaperSupported,
} from '../lib/wallpaper';

const INTERVALS: { label: string; minutes: number; sentence: string }[] = [
  { label: '15m', minutes: 15, sentence: 'Every 15 min' },
  { label: '30m', minutes: 30, sentence: 'Every 30 min' },
  { label: '1h', minutes: 60, sentence: 'Every hour' },
  { label: '24h', minutes: 1440, sentence: 'Once a day' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, palette, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [wallpaperBusy, setWallpaperBusy] = useState(false);

  // Keep the latest palette available to async flows without re-triggering them
  // when the theme toggles.
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
      setLoaded(true);
      setPermissionGranted(await requestNotificationPermission());
      await rescheduleAll();
      // Refresh the lock-screen wallpaper on open and re-arm its worker.
      await syncWallpaper(s, paletteRef.current);
    })();
  }, []);

  // --- Draggable interval slider ---
  // The track owns the whole gesture: taps and drags both land here, the
  // thumb follows the finger via dragIndex, and the setting commits on release.
  const trackRef = useRef<View>(null);
  const trackLeftRef = useRef(0);
  const trackWidthRef = useRef(0);
  const dragIndexRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function indexFromX(x: number): number {
    const usable = trackWidthRef.current - 20; // track has a 10px inset per side
    if (usable <= 0) return 0;
    const t = Math.min(Math.max(x - 10, 0), usable) / usable;
    return Math.round(t * (INTERVALS.length - 1));
  }

  function setDrag(i: number) {
    if (dragIndexRef.current !== i) {
      dragIndexRef.current = i;
      setDragIndex(i);
    }
  }

  function commitDrag() {
    const i = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragIndex(null);
    if (i != null && INTERVALS[i].minutes !== settingsRef.current.intervalMinutes) {
      update({ ...settingsRef.current, intervalMinutes: INTERVALS[i].minutes });
    }
  }

  const sliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Don't let the surrounding ScrollView steal the gesture mid-drag.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { pageX } = e.nativeEvent;
          trackRef.current?.measureInWindow((x, _y, width) => {
            trackLeftRef.current = x;
            if (width > 0) trackWidthRef.current = width;
            setDrag(indexFromX(pageX - x));
          });
        },
        onPanResponderMove: (e) => {
          setDrag(indexFromX(e.nativeEvent.pageX - trackLeftRef.current));
        },
        onPanResponderRelease: () => commitDrag(),
        onPanResponderTerminate: () => commitDrag(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function update(next: Settings) {
    setSettings(next);
    await saveSettings(next);
    await rescheduleAll();
    await syncWallpaper(next, paletteRef.current);
  }

  async function choosePhoto() {
    setWallpaperBusy(true);
    try {
      const path = await pickWallpaperPhoto();
      if (path) {
        await update({
          ...settings,
          wallpaperStyle: 'photo',
          wallpaperPhotoUri: path,
          wallpaperEnabled: true,
        });
      }
    } finally {
      setWallpaperBusy(false);
    }
  }

  async function applyWallpaperNow() {
    setWallpaperBusy(true);
    try {
      await syncWallpaper(settings, paletteRef.current);
    } finally {
      setWallpaperBusy(false);
    }
  }

  function setWallpaperStyle(style: WallpaperStyle) {
    update({ ...settings, wallpaperStyle: style, wallpaperEnabled: true });
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
  // While dragging, the UI follows the finger; otherwise the saved setting.
  const shownIndex = dragIndex ?? intervalIndex;

  const wallpaperOk = WALLPAPER_AVAILABLE && wallpaperSupported();

  return (
    <LinearGradient
      colors={[palette.bgTop, palette.bgMid, palette.bgBottom]}
      locations={[0, 0.55, 1]}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Lock Screen Facts</Text>
          <View style={styles.headerButtons}>
            <Pressable style={styles.roundButton} onPress={() => router.push('/browse')}>
              <Ionicons name="book-outline" size={20} color={palette.text} />
            </Pressable>
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
          {CATEGORIES.map((category, i) => {
            const active = settings.enabledCategories.includes(category);
            const meta = CATEGORY_META[category];
            return (
              <Pressable
                key={category}
                onPress={() => toggleCategory(category)}
                style={[
                  styles.categoryCard,
                  active ? { backgroundColor: meta.tile } : styles.categoryCardOff,
                ]}
              >
                <View style={[styles.iconTile, { backgroundColor: meta.tile }, tilt(i)]}>
                  <Ionicons name={meta.icon as never} size={20} color={meta.color} />
                </View>
                <Text
                  style={[styles.categoryName, active && styles.categoryNameActive]}
                  numberOfLines={1}
                >
                  {category}
                </Text>
                <View style={[styles.check, active ? styles.checkOn : styles.checkOff]}>
                  {active && <Ionicons name="checkmark" size={14} color="#FFFDF7" />}
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
            <Text style={styles.cardValue}>{INTERVALS[shownIndex].sentence}</Text>
          </View>
          <Text style={styles.cardHint}>How often you'll see a new fact.</Text>

          <View
            ref={trackRef}
            style={styles.sliderTrack}
            onLayout={(e) => {
              trackWidthRef.current = e.nativeEvent.layout.width;
            }}
            {...sliderResponder.panHandlers}
          >
            <View style={styles.trackLine} />
            <View
              style={[
                styles.trackFill,
                { width: `${(shownIndex / (INTERVALS.length - 1)) * 100}%` },
              ]}
            />
            <View style={styles.ticksRow} pointerEvents="none">
              {INTERVALS.map((interval, i) => (
                <View key={interval.minutes} style={styles.tickHit}>
                  {i === shownIndex ? (
                    <View style={styles.thumb}>
                      <View style={styles.thumbInner} />
                    </View>
                  ) : (
                    <View style={styles.tick} />
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.labelsRow}>
            {INTERVALS.map((interval, i) => (
              <Text
                key={interval.minutes}
                style={[styles.tickLabel, i === shownIndex && styles.tickLabelActive]}
              >
                {interval.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Lock-screen wallpaper */}
        <View style={styles.card}>
          <Pressable
            style={styles.scheduleRow}
            onPress={() =>
              update({ ...settings, wallpaperEnabled: !settings.wallpaperEnabled })
            }
          >
            <View style={[styles.clockTile, tilt(0)]}>
              <Ionicons name="image" size={24} color={TILE_INK} />
            </View>
            <View style={styles.scheduleTextWrap}>
              <Text style={styles.cardTitle}>Lock Screen Wallpaper</Text>
              <Text style={styles.scheduleDetail}>
                A fact on your lock screen, refreshed about {INTERVALS[intervalIndex].label}.
              </Text>
            </View>
            <View
              style={[
                styles.pill,
                settings.wallpaperEnabled ? styles.pillOn : styles.pillOff,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: settings.wallpaperEnabled ? TILE_INK : palette.textFaint },
                ]}
              >
                {settings.wallpaperEnabled ? 'On' : 'Off'}
              </Text>
            </View>
          </Pressable>

          {!wallpaperOk && (
            <View style={[styles.notice, { marginTop: 14, marginBottom: 0 }]}>
              <Ionicons name="information-circle" size={20} color={palette.accentBright} />
              <Text style={styles.noticeText}>
                Lock-screen wallpaper needs a real build on Android 7 or newer.
              </Text>
            </View>
          )}

          {wallpaperOk && settings.wallpaperEnabled && (
            <>
              <View style={styles.segmentRow}>
                {(
                  [
                    { key: 'generated', label: 'Themed', icon: 'color-palette' },
                    { key: 'photo', label: 'My Photo', icon: 'image-outline' },
                  ] as { key: WallpaperStyle; label: string; icon: string }[]
                ).map((opt) => {
                  const active = settings.wallpaperStyle === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setWallpaperStyle(opt.key)}
                      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                    >
                      <Ionicons
                        name={opt.icon as never}
                        size={16}
                        color={active ? TILE_INK : palette.textMuted}
                      />
                      <Text
                        style={[
                          styles.segmentText,
                          { color: active ? TILE_INK : palette.textMuted },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {settings.wallpaperStyle === 'photo' && (
                <Text style={styles.wallpaperNote}>
                  {settings.wallpaperPhotoUri
                    ? 'Your photo is set as the background.'
                    : 'Choose a photo to use as the background.'}
                </Text>
              )}

              <View style={styles.actionRow}>
                {settings.wallpaperStyle === 'photo' && (
                  <Pressable
                    onPress={choosePhoto}
                    disabled={wallpaperBusy}
                    style={[styles.ghostBtn, wallpaperBusy && styles.btnDisabled]}
                  >
                    <Text style={styles.ghostBtnText}>
                      {settings.wallpaperPhotoUri ? 'Change photo' : 'Choose photo'}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={applyWallpaperNow}
                  disabled={wallpaperBusy}
                  style={[styles.primaryBtn, wallpaperBusy && styles.btnDisabled]}
                >
                  <Text style={styles.primaryBtnText}>
                    {wallpaperBusy ? 'Applying…' : 'Apply now'}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.wallpaperNote}>
                Turning this off stops updates; the last fact stays on your lock screen
                until you change your wallpaper in Android settings.
              </Text>
            </>
          )}
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="sparkles" size={22} color={TILE_INK} />
          <Text style={styles.infoText}>
            We'll deliver a new fact to your lock screen at your chosen interval.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// The sticker look: a chunky, even ink outline on every element.
const sticker = (p: Palette, radius = 16) => ({
  borderWidth: 2.5,
  borderColor: p.ink,
  borderRadius: radius,
});

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
      fontWeight: '900',
      letterSpacing: -0.5,
      flexShrink: 1,
      transform: [{ rotate: '-1deg' }],
    },
    headerButtons: { flexDirection: 'row', gap: 10 },
    roundButton: {
      width: 44,
      height: 44,
      ...sticker(p, 14),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.card,
    },
    subtitle: {
      color: p.textMuted,
      fontSize: 15,
      marginTop: 8,
      marginBottom: 24,
    },
    notice: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      backgroundColor: p.card,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: p.ink,
      borderRadius: 14,
      padding: 14,
      marginBottom: 20,
    },
    noticeText: { color: p.textMuted, flex: 1, lineHeight: 19 },
    noticeLink: { color: p.accentBright, fontWeight: '700' },
    sectionTitle: {
      color: p.text,
      fontSize: 20,
      fontWeight: '800',
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
      ...sticker(p),
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
    categoryCardOff: {
      // Softer outline — looks pressed down next to active stickers.
      borderColor: p.inkSoft,
    },
    iconTile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: TILE_INK,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryName: {
      color: p.text,
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    categoryNameActive: { color: TILE_INK },
    check: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: { backgroundColor: TILE_INK },
    checkOff: { borderWidth: 2, borderColor: p.inkSoft },
    comingSoon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: p.card,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: p.inkSoft,
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
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: p.accent,
    },
    comingSoonText: { color: p.textFaint, fontSize: 15 },
    card: {
      backgroundColor: p.card,
      ...sticker(p, 18),
      padding: 18,
      marginBottom: 18,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: { color: p.text, fontSize: 17, fontWeight: '800' },
    cardValue: { color: p.accentBright, fontSize: 15, fontWeight: '700' },
    cardHint: { color: p.textMuted, fontSize: 14, marginTop: 4 },
    sliderTrack: {
      height: 44,
      justifyContent: 'center',
      marginTop: 14,
    },
    trackLine: {
      position: 'absolute',
      left: 10,
      right: 10,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.trackLine,
    },
    trackFill: {
      position: 'absolute',
      left: 10,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.accent,
    },
    ticksRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tickHit: {
      width: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tick: {
      width: 4,
      height: 14,
      borderRadius: 2,
      backgroundColor: p.trackLine,
    },
    thumb: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: p.accent,
      borderWidth: 2,
      borderColor: p.ink,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ rotate: '4deg' }],
    },
    thumbInner: {
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: TILE_INK,
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
      fontWeight: '600',
      width: 32,
      textAlign: 'center',
    },
    tickLabelActive: { color: p.accentBright, fontWeight: '800' },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    clockTile: {
      width: 52,
      height: 52,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: TILE_INK,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F9C15C',
    },
    scheduleTextWrap: { flex: 1, gap: 3 },
    scheduleDetail: { color: p.textMuted, fontSize: 14 },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 10,
    },
    pillOn: {
      backgroundColor: p.accent,
      borderWidth: 2,
      borderColor: p.ink,
    },
    pillOff: { borderWidth: 2, borderColor: p.inkSoft },
    pillText: { fontSize: 13, fontWeight: '800' },
    segmentRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: p.inkSoft,
    },
    segmentBtnActive: {
      backgroundColor: '#64D9EE',
      borderColor: p.ink,
    },
    segmentText: { fontSize: 14, fontWeight: '700' },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: p.accent,
      ...sticker(p, 12),
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: { color: TILE_INK, fontSize: 15, fontWeight: '800' },
    ghostBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: p.ink,
    },
    ghostBtnText: { color: p.text, fontSize: 15, fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
    wallpaperNote: {
      color: p.textFaint,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 12,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: '#64D9EE',
      ...sticker(p, 18),
      paddingVertical: 18,
      paddingHorizontal: 16,
      transform: [{ rotate: '-0.6deg' }],
    },
    infoText: { color: TILE_INK, fontSize: 15, lineHeight: 21, flex: 1, fontWeight: '600' },
  });
