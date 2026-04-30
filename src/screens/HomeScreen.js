import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../utils/theme';

const modes = [
  { id: 'tabata', title: 'TABATA', subtitle: 'Quick HIIT (20s/10s)', screen: 'Tabata' },
  { id: 'circuit', title: 'CIRCUIT', subtitle: 'Multi-exercise rounds', screen: 'Custom', params: { mode: 'circuit' } },
  { id: 'custom', title: 'CUSTOM', subtitle: 'Design your own workout', screen: 'Custom', params: { mode: 'custom' } },
  { id: 'saved', title: 'YOUR WORKOUTS', subtitle: 'Load your saved workouts', screen: 'YourWorkouts' },
];

const ICONS = { tabata: '⏱', circuit: '⚡', custom: '🎯', saved: '🔖' };

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1 }} />
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>HIIT Timer</Text>
              <Text style={styles.subtitle}>Choose your workout mode</Text>
            </View>
            <View style={styles.list}>
              {modes.map(mode => (
                <TouchableOpacity
                  key={mode.id}
                  style={styles.card}
                  onPress={() => navigation.navigate(mode.screen, mode.params)}
                  activeOpacity={0.75}
                >
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>{ICONS[mode.id]}</Text>
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{mode.title}</Text>
                    <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flex: 3 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 36, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.xs },
  contentWrapper: { flex: 1, flexDirection: 'column' },
  list: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: { fontSize: 22 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: 0.5 },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },
});
