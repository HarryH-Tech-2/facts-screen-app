import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, FACTS } from '../lib/facts';
import { CATEGORY_META, Palette, tilt } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const SECTIONS = CATEGORIES.map((category) => ({
  title: category,
  data: FACTS.filter((f) => f.category === category),
}));

export default function Browse() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <LinearGradient
      colors={[palette.bgTop, palette.bgMid, palette.bgBottom]}
      locations={[0, 0.55, 1]}
      style={styles.root}
    >
      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color={palette.text} />
              </Pressable>
              <Text style={styles.title}>Browse Facts</Text>
            </View>
            <Text style={styles.subtitle}>Everything that can land on your lock screen.</Text>
          </>
        }
        renderSectionHeader={({ section }) => {
          const meta = CATEGORY_META[section.title];
          const index = CATEGORIES.indexOf(section.title);
          return (
            <View style={styles.sectionHeader}>
              <View style={[styles.iconTile, { backgroundColor: meta.tile }, tilt(index)]}>
                <Ionicons name={meta.icon as never} size={16} color={meta.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.text}</Text>
          </View>
        )}
      />
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
      gap: 14,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 2.5,
      borderColor: p.ink,
      backgroundColor: p.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: p.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.5,
      flexShrink: 1,
      transform: [{ rotate: '-1deg' }],
    },
    subtitle: {
      color: p.textMuted,
      fontSize: 15,
      marginTop: 6,
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 22,
      marginBottom: 10,
    },
    iconTile: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#17303B',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: { color: p.text, fontSize: 19, fontWeight: '800' },
    item: {
      backgroundColor: p.card,
      borderWidth: 2.5,
      borderColor: p.ink,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    itemText: { color: p.textMuted, fontSize: 15, lineHeight: 21 },
  });
