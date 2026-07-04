import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, FACTS } from '../lib/facts';
import { CATEGORY_META, COLORS } from '../lib/theme';

const SECTIONS = CATEGORIES.map((category) => ({
  title: category,
  data: FACTS.filter((f) => f.category === category),
}));

export default function Browse() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]}
      locations={[0, 0.55, 1]}
      style={styles.root}
    >
      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Browse Facts</Text>
            <Text style={styles.subtitle}>Everything that can land on your lock screen.</Text>
          </>
        }
        renderSectionHeader={({ section }) => {
          const meta = CATEGORY_META[section.title];
          return (
            <View style={styles.sectionHeader}>
              <View style={[styles.iconTile, { backgroundColor: meta.tile }]}>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 20 },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: '700' },
  item: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  itemText: { color: COLORS.textMuted, fontSize: 15, lineHeight: 21 },
});
