import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, shadow } from '../utils/theme';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function workoutTotalTime(w) {
  if (w.type === 'tabata') return (w.workTime + w.restTime) * w.rounds - w.restTime;
  return (w.exercises || []).reduce((s, ex) => s + ex.workTime + ex.restTime, 0) * w.rounds;
}

function workoutMins(w) {
  return Math.round(workoutTotalTime(w) / 60) || 1;
}



const TYPE_ACCENT = {
  tabata:  { accent: '#E8472A', lightBg: '#FFF5F4', darkBg: '#2D1A16' },
  emom:    { accent: '#059669', lightBg: '#F0FDF4', darkBg: '#14201B' },
  circuit: { accent: '#0284C7', lightBg: '#F0F9FF', darkBg: '#142030' },
  custom:  { accent: '#F97316', lightBg: '#FFF7ED', darkBg: '#271A0A' },
};

function WorkoutCard({ workout, onStart, onEdit }) {
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors);
  const mins = workoutMins(workout);
  const exCount = workout.exercises?.length ?? null;
  const { accent, lightBg, darkBg } = TYPE_ACCENT[workout.type] ?? TYPE_ACCENT.custom;
  const cardBg = isDark ? darkBg : '#fff';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: accent }]}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{workout.name}</Text>
        <TouchableOpacity onPress={onEdit} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: accent }]}>{workout.rounds}</Text>
          <Text style={styles.statLbl}>Rounds</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: accent, opacity: 0.25 }]} />
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: accent }]}>{mins} min</Text>
          <Text style={styles.statLbl}>Duration</Text>
        </View>
        {exCount !== null && (
          <>
            <View style={[styles.statDivider, { backgroundColor: accent, opacity: 0.25 }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: accent }]}>{exCount}</Text>
              <Text style={styles.statLbl}>Exercises</Text>
            </View>
          </>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={[styles.startBtn, { backgroundColor: accent }]} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>START</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function YourWorkoutsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { savedWorkouts, loadWorkouts } = useWorkout();
  const { settings } = useSettings();
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadWorkouts);
    return unsub;
  }, [navigation, loadWorkouts]);

  if (savedWorkouts.length === 0) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Your Workouts</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>No saved workouts</Text>
          <Text style={styles.emptyText}>Build a custom workout and save it here.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Custom')} activeOpacity={0.85}>
            <Text style={styles.emptyBtnText}>Build a Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Your Workouts</Text>
        <Text style={styles.count}>{savedWorkouts.length} saved</Text>
      </View>
      <FlatList
        data={savedWorkouts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onStart={() => {
              if (settings.hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
                setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 80);
                setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 160);
                setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 240);
                setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 320);
                setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 450);
              }
              navigation.navigate('WorkoutTimer', { config: { ...item } });
            }}
            onEdit={() => navigation.navigate('Custom', { prefill: item, mode: item.type })}
          />
        )}
      />
    </View>
  );
}

function buildStyles(c) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    navBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 30, color: c.text, fontWeight: '300', marginTop: -2 },
    navTitle: { fontSize: 17, fontWeight: '600', color: c.text },
    count: { fontSize: 14, color: c.textSecondary, minWidth: 40, textAlign: 'right' },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.sm },

    card: {
      borderRadius: radius.lg, ...shadow.sm,
      padding: spacing.md,
      borderWidth: 1.5,
    },
    cardTop: {
      flexDirection: 'row', alignItems: 'center',
      gap: spacing.sm, marginBottom: spacing.xs,
    },
    cardName: { fontSize: 15, fontWeight: '800', flex: 1 },

    statsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
    stat: { alignItems: 'center' },
    statVal: { fontSize: 15, fontWeight: '800' },
    statLbl: { fontSize: 10, fontWeight: '600', color: c.textMuted, marginTop: 1, letterSpacing: 0.5 },
    statDivider: { width: 1, height: 26 },

    startBtn: {
      paddingVertical: 4, paddingHorizontal: 14,
      borderRadius: radius.full,
    },
    startBtnText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl * 2 },
    emptyIcon: { fontSize: 56, marginBottom: spacing.md },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: c.text, marginBottom: spacing.sm },
    emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    emptyBtn: {
      backgroundColor: c.primary, borderRadius: radius.full,
      paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
