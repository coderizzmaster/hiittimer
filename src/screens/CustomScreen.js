import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, shadow } from '../utils/theme';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Stepper({ value, min, max, step = 5, onChange, formatValue }) {
  const { colors } = useTheme();
  const styles = buildStyles(colors);
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - step))} activeOpacity={0.7}>
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{formatValue ? formatValue(value) : value}</Text>
      <TouchableOpacity style={[styles.stepBtn, styles.stepBtnPlus]} onPress={() => onChange(Math.min(max, value + step))} activeOpacity={0.7}>
        <Text style={[styles.stepBtnText, styles.stepBtnPlusText]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function ExerciseCard({ exercise, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const { colors } = useTheme();
  const styles = buildStyles(colors);
  return (
    <View style={styles.exCard}>
      <View style={styles.exCardHeader}>
        <TextInput
          style={styles.exNameInput}
          placeholder={`Exercise ${index + 1}`}
          placeholderTextColor={colors.textMuted}
          value={exercise.name}
          onChangeText={text => onChange({ ...exercise, name: text })}
          returnKeyType="done"
          maxLength={30}
        />
        <View style={styles.exCardActions}>
          <TouchableOpacity onPress={onMoveUp} disabled={index === 0} activeOpacity={0.7} style={styles.arrowBtn}>
            <Text style={[styles.arrowText, index === 0 && styles.arrowDisabled]}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onMoveDown} disabled={index === total - 1} activeOpacity={0.7} style={styles.arrowBtn}>
            <Text style={[styles.arrowText, index === total - 1 && styles.arrowDisabled]}>↓</Text>
          </TouchableOpacity>
          {onRemove && (
            <TouchableOpacity onPress={onRemove} activeOpacity={0.7} style={styles.exRemoveBtn}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.exStepperRow}>
        <View style={styles.exStepperGroup}>
          <Text style={styles.exStepperLabel}>Work (sec)</Text>
          <Stepper value={exercise.workTime} min={5} max={300} step={5} onChange={val => onChange({ ...exercise, workTime: val })} />
        </View>
        <View style={styles.exStepperGroup}>
          <Text style={styles.exStepperLabel}>Rest (sec)</Text>
          <Stepper value={exercise.restTime} min={0} max={120} step={5} onChange={val => onChange({ ...exercise, restTime: val })} />
        </View>
      </View>
    </View>
  );
}

function CircRow({ iconChar, iconColor, label, children }) {
  const { colors } = useTheme();
  const styles = buildStyles(colors);
  return (
    <View style={styles.circRow}>
      <View style={[styles.circIcon, { backgroundColor: iconColor }]}>
        <Text style={styles.circIconChar}>{iconChar}</Text>
      </View>
      <Text style={styles.circRowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function newExercise() {
  return { id: String(Date.now()) + String(Math.random()), name: '', workTime: 30, restTime: 10 };
}

function buildCircuitExercises(stationCount, workTime, restTime) {
  return Array.from({ length: stationCount }, (_, i) => ({
    id: String(i),
    name: `Station ${i + 1}`,
    workTime,
    restTime,
  }));
}

export default function CustomScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors);
  const mode = route?.params?.mode ?? 'custom';
  const prefill = route?.params?.prefill;
  const isCircuit = mode === 'circuit';

  const [workoutName, setWorkoutName] = useState(prefill?.name ?? 'My Workout');
  const [rounds, setRounds] = useState(prefill?.rounds ?? 3);
  const [countdownTime, setCountdownTime] = useState(prefill?.countdownTime ?? 5);
  const [exercises, setExercises] = useState(prefill?.exercises ?? [newExercise()]);

  const [stationCount, setStationCount] = useState(prefill?.exercises?.length ?? 5);
  const [circuitWorkTime, setCircuitWorkTime] = useState(prefill?.exercises?.[0]?.workTime ?? 40);
  const [circuitRestTime, setCircuitRestTime] = useState(prefill?.exercises?.[0]?.restTime ?? 20);

  const { persistSave } = useWorkout();

  function getExercises() {
    return isCircuit ? buildCircuitExercises(stationCount, circuitWorkTime, circuitRestTime) : exercises;
  }

  const resolvedExercises = getExercises();
  const totalSeconds = resolvedExercises.reduce((s, ex) => s + ex.workTime + ex.restTime, 0) * rounds;

  function addExercise()                { setExercises(prev => [...prev, newExercise()]); }
  function updateExercise(idx, updated) { setExercises(prev => prev.map((ex, i) => i === idx ? updated : ex)); }
  function removeExercise(idx)          { if (exercises.length > 1) setExercises(prev => prev.filter((_, i) => i !== idx)); }
  function moveExercise(idx, dir) {
    const next = idx + dir;
    if (next < 0 || next >= exercises.length) return;
    setExercises(prev => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  async function handleSave() {
    const workout = { id: prefill?.id ?? String(Date.now()), name: workoutName || 'My Workout', type: mode, exercises: resolvedExercises, rounds, countdownTime };
    await persistSave(workout);
    Alert.alert('Saved!', `"${workout.name}" has been saved.`);
  }

  function handleStart() {
    const name = isCircuit ? 'Circuit' : (workoutName || 'My Workout');
    navigation.navigate('WorkoutTimer', { config: { type: mode, name, exercises: resolvedExercises, rounds, countdownTime } });
  }

  if (isCircuit) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Circuit</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.circBody, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.circCenter}>
            <View style={styles.circCard}>
              <CircRow iconChar="≡" iconColor="#4CAF50" label="Stations">
                <Stepper value={stationCount} min={1} max={20} step={1} onChange={setStationCount} />
              </CircRow>
              <View style={styles.circDivider} />
              <CircRow iconChar="▶" iconColor={colors.primary} label="Work time">
                <Stepper value={circuitWorkTime} min={5} max={300} step={5} onChange={setCircuitWorkTime} formatValue={v => `${v}s`} />
              </CircRow>
              <View style={styles.circDivider} />
              <CircRow iconChar="‖" iconColor="#2196F3" label="Rest time">
                <Stepper value={circuitRestTime} min={0} max={120} step={5} onChange={setCircuitRestTime} formatValue={v => `${v}s`} />
              </CircRow>
              <View style={styles.circDivider} />
              <CircRow iconChar="↻" iconColor="#9C27B0" label="Rounds">
                <Stepper value={rounds} min={1} max={20} step={1} onChange={setRounds} />
              </CircRow>
              <View style={styles.circDivider} />
              <CircRow iconChar="◔" iconColor="#FF9800" label="Countdown">
                <Stepper value={countdownTime} min={0} max={30} step={1} onChange={setCountdownTime} formatValue={v => `${v}s`} />
              </CircRow>
            </View>

            <View style={styles.circSummary}>
              <View style={styles.circSummaryItem}>
                <Text style={styles.circSummaryValue}>{formatDuration(totalSeconds)} <Text style={styles.circSummaryUnit}>min</Text></Text>
                <Text style={styles.circSummaryLabel}>Total duration</Text>
              </View>
              <View style={styles.circSummaryDivider} />
              <View style={styles.circSummaryItem}>
                <Text style={styles.circSummaryValue}>{resolvedExercises.length * rounds}</Text>
                <Text style={styles.circSummaryLabel}>Total exercises</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>START WORKOUT</Text>
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
        <Text style={styles.navTitle}>Build Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WORKOUT NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="My Workout"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            maxLength={40}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXERCISES</Text>
          {exercises.map((ex, idx) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={idx}
              total={exercises.length}
              onChange={updated => updateExercise(idx, updated)}
              onRemove={exercises.length > 1 ? () => removeExercise(idx) : null}
              onMoveUp={() => moveExercise(idx, -1)}
              onMoveDown={() => moveExercise(idx, 1)}
            />
          ))}
          <TouchableOpacity style={styles.addExBtn} onPress={addExercise} activeOpacity={0.8}>
            <Text style={styles.addExBtnText}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.pairRow}>
            <View style={styles.pairItem}>
              <Text style={styles.sectionLabel}>ROUNDS</Text>
              <View style={styles.pairCard}>
                <Stepper value={rounds} min={1} max={20} step={1} onChange={setRounds} />
              </View>
            </View>
            <View style={styles.pairItem}>
              <Text style={styles.sectionLabel}>COUNTDOWN</Text>
              <View style={styles.pairCard}>
                <Stepper value={countdownTime} min={0} max={30} step={1} onChange={setCountdownTime} formatValue={v => v === 0 ? '0s' : `${v}s`} />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.circSummary, { marginBottom: spacing.lg }]}>
          <View style={styles.circSummaryItem}>
            <Text style={styles.circSummaryValue}>{formatDuration(totalSeconds)} <Text style={styles.circSummaryUnit}>min</Text></Text>
            <Text style={styles.circSummaryLabel}>Total duration</Text>
          </View>
          <View style={styles.circSummaryDivider} />
          <View style={styles.circSummaryItem}>
            <Text style={styles.circSummaryValue}>{resolvedExercises.length * rounds}</Text>
            <Text style={styles.circSummaryLabel}>Total exercises</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>SAVE WORKOUT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>START WORKOUT</Text>
        </TouchableOpacity>
      </ScrollView>
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
    backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 30, color: c.text, fontWeight: '300', marginTop: -2 },
    navTitle: { fontSize: 17, fontWeight: '600', color: c.text },

    circBody:   { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, justifyContent: 'space-between' },
    circCenter: { flex: 1, justifyContent: 'center', gap: spacing.md },
    circCard:   { backgroundColor: c.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
    circRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 13 },
    circIcon:   { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    circIconChar: { fontSize: 16, color: '#fff', fontWeight: '600' },
    circRowLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: c.text },
    circDivider:  { height: 1, backgroundColor: c.border, marginLeft: spacing.md + 36 + spacing.md },
    circSummary:  { flexDirection: 'row', backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: spacing.md, ...shadow.sm },
    circSummaryItem:    { flex: 1, alignItems: 'center' },
    circSummaryDivider: { width: 1, backgroundColor: c.border },
    circSummaryValue:   { fontSize: 24, fontWeight: '800', color: c.primary, marginBottom: 2 },
    circSummaryLabel:   { fontSize: 11, fontWeight: '700', color: c.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
    circSummaryUnit:    { fontSize: 14, fontWeight: '500', color: c.textSecondary },

    container:    { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },
    section:      { marginBottom: spacing.lg },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textSecondary, letterSpacing: 1.2, marginBottom: spacing.sm },

    nameInput: { backgroundColor: c.surface, borderRadius: radius.md, padding: spacing.md, fontSize: 16, color: c.text, ...shadow.sm },

    exCard: {
      backgroundColor: c.surface, borderRadius: radius.lg,
      padding: spacing.sm, marginBottom: spacing.sm, ...shadow.sm,
    },
    exCardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    exCardActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },

    arrowBtn:     { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    arrowText:    { fontSize: 18, color: c.primary, fontWeight: '600' },
    arrowDisabled:{ color: c.border },

    exRemoveBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
    removeText:  { fontSize: 16, color: c.textSecondary },

    exNameInput: {
      flex: 1, backgroundColor: c.background, borderRadius: radius.sm,
      paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 2, fontSize: 14, color: c.text,
    },
    exStepperRow:   { flexDirection: 'row', justifyContent: 'space-between' },
    exStepperGroup: { flex: 1, alignItems: 'center' },
    exStepperLabel: { fontSize: 11, fontWeight: '600', color: c.textSecondary, marginBottom: spacing.xs },

    addExBtn: {
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
      borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center',
      backgroundColor: c.surface,
    },
    addExBtnText: { fontSize: 14, fontWeight: '700', color: c.primary, letterSpacing: 0.3 },

    stepper:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stepBtn:         { width: 30, height: 30, borderRadius: 15, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    stepBtnPlus:     { backgroundColor: c.primaryLight },
    stepBtnText:     { fontSize: 20, fontWeight: '400', color: c.primary, lineHeight: 24 },
    stepBtnPlusText: { color: c.primary },
    stepValue:       { fontSize: 16, fontWeight: '700', color: c.text, minWidth: 28, textAlign: 'center' },

    pairRow:  { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
    pairItem: { flex: 1 },
    pairCard: { backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center', flex: 1, ...shadow.sm },

    saveBtn: {
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.surface, borderRadius: radius.full, paddingVertical: spacing.md,
      marginBottom: spacing.sm, ...shadow.sm,
    },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: c.text, letterSpacing: 0.5 },
    startBtn: {
      backgroundColor: c.primary, borderRadius: radius.full,
      paddingVertical: spacing.md + 2, alignItems: 'center', ...shadow.md,
    },
    startBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  });
}
