import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, shadow } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

function Stepper({ value, min, max, step = 1, onChange, formatValue }) {
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

function newExercise() {
  return { id: String(Date.now()) + String(Math.random()), name: '' };
}

export default function EMOMScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const styles = buildStyles(colors);

  const [exercises, setExercises] = useState([newExercise()]);
  const [rounds, setRounds] = useState(4);
  const [countdownTime, setCountdownTime] = useState(5);

  const totalMinutes = exercises.length * rounds;

  function addExercise() { setExercises(prev => [...prev, newExercise()]); }
  function updateName(idx, name) { setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, name } : ex)); }
  function removeExercise(idx) { if (exercises.length > 1) setExercises(prev => prev.filter((_, i) => i !== idx)); }

  function handleStart() {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 80);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 160);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 240);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 320);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 450);
    }
    navigation.navigate('WorkoutTimer', {
      config: {
        type: 'emom',
        name: 'EMOM',
        exercises,
        rounds,
        countdownTime,
      },
    });
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>EMOM</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Every Minute On the Minute</Text>
        <Text style={styles.pageSub}>Each exercise gets 60 seconds. Do your reps, rest what's left.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXERCISES</Text>
          <View style={styles.exCard}>
            {exercises.map((ex, idx) => (
              <View key={ex.id}>
                {idx > 0 && <View style={styles.exDivider} />}
                <View style={styles.exRow}>
                  <Text style={styles.exNum}>{String(idx + 1).padStart(2, '0')}</Text>
                  <TextInput
                    style={styles.exInput}
                    placeholder={`Exercise ${idx + 1}`}
                    placeholderTextColor={colors.textMuted}
                    value={ex.name}
                    onChangeText={text => updateName(idx, text)}
                    returnKeyType="done"
                    maxLength={30}
                  />
                  {exercises.length > 1 && (
                    <TouchableOpacity onPress={() => removeExercise(idx)} activeOpacity={0.7} style={styles.removeBtn}>
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addExercise} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add Exercise</Text>
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

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalMinutes}</Text>
            <Text style={styles.summaryLabel}>Total Minutes</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{exercises.length * rounds}</Text>
            <Text style={styles.summaryLabel}>Total Sets</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>START EMOM</Text>
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
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 30, color: c.text, fontWeight: '300', marginTop: -2 },
    navTitle: { fontSize: 17, fontWeight: '600', color: c.text },

    container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },

    pageTitle: { fontSize: 22, fontWeight: '800', color: c.text, marginBottom: spacing.xs },
    pageSub: { fontSize: 13, color: c.textSecondary, marginBottom: spacing.lg, lineHeight: 18 },

    section: { marginBottom: spacing.lg },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textSecondary, letterSpacing: 1.2, marginBottom: spacing.sm },

    exCard: {
      backgroundColor: c.surface, borderRadius: radius.lg,
      overflow: 'hidden', ...shadow.sm,
    },
    exDivider: { height: 1, backgroundColor: c.border },
    exRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.md, paddingVertical: 13, gap: spacing.sm,
    },
    exNum: { fontSize: 12, fontWeight: '700', color: c.primary, width: 22, textAlign: 'right' },
    exInput: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 0 },
    removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    removeText: { fontSize: 14, color: c.textMuted },

    addBtn: {
      marginTop: spacing.sm,
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
      borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center',
      backgroundColor: c.surface,
    },
    addBtnText: { fontSize: 14, fontWeight: '700', color: c.primary, letterSpacing: 0.3 },

    pairRow: { flexDirection: 'row', gap: spacing.sm },
    pairItem: { flex: 1 },
    pairCard: { backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', ...shadow.sm },

    stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
    stepBtnPlus: { backgroundColor: c.primaryLight },
    stepBtnText: { fontSize: 20, fontWeight: '400', color: c.primary, lineHeight: 24 },
    stepBtnPlusText: { color: c.primary },
    stepValue: { fontSize: 16, fontWeight: '700', color: c.text, minWidth: 28, textAlign: 'center' },

    summary: {
      flexDirection: 'row', backgroundColor: c.surface,
      borderRadius: radius.lg, paddingVertical: spacing.md, marginBottom: spacing.lg, ...shadow.sm,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryDivider: { width: 1, backgroundColor: c.border },
    summaryValue: { fontSize: 24, fontWeight: '800', color: c.primary, marginBottom: 2 },
    summaryLabel: { fontSize: 11, fontWeight: '700', color: c.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },

    startBtn: {
      backgroundColor: c.primary, borderRadius: radius.full,
      paddingVertical: spacing.md + 2, alignItems: 'center', ...shadow.md,
    },
    startBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  });
}
