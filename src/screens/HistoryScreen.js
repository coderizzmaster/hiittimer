import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar, Animated } from 'react-native';
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

const ORANGE = '#F97316';

function AnimatedStatCard({ value, label }) {
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scale, { toValue: 1.06, useNativeDriver: true, tension: 200, friction: 10 }).start();
  }

  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  }

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.82} style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function HistoryCard({ item }) {
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDate}>{formatDate(item.completedAt)}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatTime(item.duration)}</Text>
            <Text style={styles.statLbl}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{item.rounds}</Text>
            <Text style={styles.statLbl}>Rounds</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { history, loadHistory, wipeHistory } = useWorkout();
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);

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
        <AnimatedStatCard value={history.length} label="Workouts completed" />
        <AnimatedStatCard value={formatTime(history.reduce((s, h) => s + (h.duration || 0), 0))} label="Minutes worked out" />
        <AnimatedStatCard value={history.reduce((s, h) => s + (h.rounds || 0), 0)} label="Exercises done" />
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

function buildStyles(c, isDark) {
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
      backgroundColor: isDark ? c.surface : '#fff', borderRadius: radius.md,
      padding: spacing.md, alignItems: 'center', alignSelf: 'stretch', ...shadow.sm,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 10, color: c.textSecondary, marginTop: 2, textAlign: 'center', minHeight: 28 },

    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.sm },
    card: { borderRadius: radius.lg, ...shadow.sm, padding: spacing.md, borderWidth: 1.5, backgroundColor: isDark ? c.surface : '#fff', borderColor: ORANGE },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardLeft: { flex: 1, marginRight: spacing.md },
    cardName: { fontSize: 15, fontWeight: '800' },
    cardDate: { fontSize: 12, color: c.textMuted, fontWeight: '500', marginTop: 2 },
    cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stat: { alignItems: 'center' },
    statVal: { fontSize: 15, fontWeight: '800', color: ORANGE },
    statLbl: { fontSize: 10, fontWeight: '600', color: c.textMuted, marginTop: 1, letterSpacing: 0.5 },
    statDivider: { width: 1, height: 26, backgroundColor: ORANGE, opacity: 0.25 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl * 2 },
    emptyIcon: { marginBottom: spacing.md },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: c.text, marginBottom: spacing.sm },
    emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  });
}
