import { SectionList, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, FACTS } from '../lib/facts';

const SECTIONS = CATEGORIES.map((category) => ({
  title: category,
  data: FACTS.filter((f) => f.category === category),
}));

export default function Browse() {
  return (
    <SectionList
      sections={SECTIONS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderSectionHeader={({ section }) => (
        <Text style={styles.header}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.itemText}>{item.text}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  item: {
    backgroundColor: '#F4F4F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemText: { fontSize: 15, lineHeight: 21 },
});
