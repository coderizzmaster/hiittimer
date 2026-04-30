import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../utils/theme';
import { useWorkout } from '../context/WorkoutContext';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function workoutTotalTime(w) {
  if (w.type === 'tabata') return (w.workTime + w.restTime) * w.rounds - w.restTime;
  return (w.exercises || []).reduce((s, ex) => s + ex.workTime + ex.restTime, 0) * w.rounds;
}

function typeColor(type) {
  if (type === 'tabata') return colors.primary;
  if (type === 'circuit') return '#4CAF50';
  return '#2196F3';
}

function typeLabel(type) {
  if (type === 'tabata') return 'Tabata';
  if (type === 'circuit') return 'Circuit';
  return 'Custom';
}

function TrashIcon() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 6, height: 2, backgroundColor: '#BBBBB8', borderRadius: 1, marginBottom: 1.5 }} />
      <View style={{ width: 14, height: 2, backgroundColor: '#BBBBB8', borderRadius: 1, marginBottom: 1.5 }} />
      <View style={{
        width: 12, height: 13, borderRadius: 2, backgroundColor: '#BBBBB8',
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2.5,
      }}>
        <View style={{ width: 1.5, height: 8, backgroundColor: colors.background, borderRadius: 1 }} />
        <View style={{ width: 1.5, height: 8, backgroundColor: colors.background, borderRadius: 1 }} />
        <View style={{ width: 1.5, height: 8, backgroundColor: colors.background, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function WorkoutCard({ workout, onStart, onEdit, onDelete }) {
  const label = typeLabel(workout.type);
  const showBadge = label !== 'Custom';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{workout.name}</Text>
        <TouchableOpacity onPress={onDelete} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <TrashIcon />
        </TouchableOpacity>
      </View>
      <View style={styles.cardMetaRow}>
        {showBadge && (
          <View style={[styles.typeBadge, { backgroundColor: typeColor(workout.type) + '22' }]}>
            <Text style={[styles.typeText, { color: typeColor(workout.type) }]}>{label}</Text>
          </View>
        )}
        <Text style={styles.cardMeta}>{workout.rounds} rounds · {formatDuration(workoutTotalTime(workout))}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.8}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>▶  Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function YourWorkoutsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { savedWorkouts, loadWorkouts, persistDelete } = useWorkout();

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadWorkouts);
    return unsub;
  }, [navigation, loadWorkouts]);

  function handleDelete(id, name) {
    Alert.alert('Delete Workout', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => persistDelete(id) },
    ]);
  }

  if (savedWorkouts.length === 0) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
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
            onStart={() => navigation.navigate('WorkoutTimer', { config: { ...item } })}
            onEdit={() => navigation.navigate('Custom', { prefill: item, mode: item.type })}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: colors.text, fontWeight: '300', marginTop: -2 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  count: { fontSize: 14, color: colors.textSecondary, minWidth: 40, textAlign: 'right' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.sm },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  cardName: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  typeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  typeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardMeta: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  cardActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  editBtn: {
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  startBtn: {
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.primary, ...shadow.sm,
  },
  startBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl * 2 },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  emptyBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
