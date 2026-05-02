import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, shadow } from '../utils/theme';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import EmojiIcon from '../components/EmojiIcon';

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function typeColor(type) {
  if (type === 'tabata') return '#E8472A';
  if (type === 'circuit') return '#4CAF50';
  return '#2196F3';
}

function HistoryCard({ item }) {
  const { colors } = useTheme();
  const styles = buildStyles(colors);
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.dot, { backgroundColor: typeColor(item.type) }]} />
        <View>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardDate}>{formatDate(item.completedAt)}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardDuration}>{formatTime(item.duration)}</Text>
        <Text style={styles.cardRounds}>{item.rounds} rounds</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { history, loadHistory, wipeHistory } = useWorkout();
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadHistory);
    return unsub;
  }, [navigation, loadHistory]);

  function handleClear() {
    Alert.alert('Clear History', 'Delete all workout history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: wipeHistory },
    ]);
  }

  if (history.length === 0) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>
        <View style={styles.empty}>
          <EmojiIcon emoji="📊" size={56} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptyText}>Complete a workout to see it here.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatTime(history.reduce((s, h) => s + (h.duration || 0), 0))}</Text>
          <Text style={styles.statLabel}>Total time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{history.reduce((s, h) => s + (h.rounds || 0), 0)}</Text>
          <Text style={styles.statLabel}>Rounds</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <HistoryCard item={item} />}
      />
    </View>
  );
}

function buildStyles(c) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
      paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
    },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    clearText: { fontSize: 14, color: c.primary, fontWeight: '600' },

    statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
    statCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: radius.md,
      padding: spacing.md, alignItems: 'center', ...shadow.sm,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 11, color: c.textSecondary, marginTop: 2 },

    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.sm },
    card: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dot: { width: 10, height: 10, borderRadius: 5 },
    cardName: { fontSize: 15, fontWeight: '600', color: c.text },
    cardDate: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    cardRight: { alignItems: 'flex-end' },
    cardDuration: { fontSize: 15, fontWeight: '700', color: c.text },
    cardRounds: { fontSize: 12, color: c.textSecondary, marginTop: 2 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl * 2 },
    emptyIcon: { marginBottom: spacing.md },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: c.text, marginBottom: spacing.sm },
    emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  });
}
