import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../utils/theme';

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const MODES = [
  {
    label: 'Classic Tabata',
    description: 'The original protocol. Short max-effort bursts with minimal rest.',
    workTime: 20,
    restTime: 10,
    rounds: 8,
    accent: '#E8472A',
    bg: '#FFF5F4',
  },
  {
    label: 'Power Intervals',
    description: 'Longer sets for explosive strength and power output.',
    workTime: 30,
    restTime: 15,
    rounds: 6,
    accent: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    label: 'Endurance Burn',
    description: 'Extended rounds to build sustained cardio conditioning.',
    workTime: 40,
    restTime: 20,
    rounds: 10,
    accent: '#0284C7',
    bg: '#F0F9FF',
  },
];

const COUNTDOWN = 5;

export default function TabataScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(0);
  const mode = MODES[selected];

  function handleStart() {
    navigation.navigate('WorkoutTimer', {
      config: {
        type: 'tabata',
        name: mode.label,
        workTime: mode.workTime,
        restTime: mode.restTime,
        rounds: mode.rounds,
        countdownTime: COUNTDOWN,
      },
    });
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Tabata</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.pageTitle}>Choose a mode</Text>
      <Text style={styles.pageSub}>Pick the protocol that matches your goal</Text>

      <View style={styles.modeList}>
        {MODES.map((m, idx) => {
          const isActive = selected === idx;
          const modeTotal = (m.workTime + m.restTime) * m.rounds - m.restTime;
          return (
            <TouchableOpacity
              key={m.label}
              style={[styles.modeCard, isActive && { borderColor: m.accent, borderWidth: 2, backgroundColor: m.bg }]}
              onPress={() => setSelected(idx)}
              activeOpacity={0.8}
            >
              <View style={styles.modeTop}>
                <View style={[styles.modeDot, { backgroundColor: isActive ? m.accent : colors.border }]} />
                <Text style={[styles.modeLabel, isActive && { color: m.accent }]}>{m.label}</Text>
                {isActive && (
                  <View style={[styles.activePill, { backgroundColor: m.accent }]}>
                    <Text style={styles.activePillText}>Selected</Text>
                  </View>
                )}
              </View>
              <Text style={styles.modeDesc}>{m.description}</Text>
              <View style={styles.modeStats}>
                <View style={styles.modeStat}>
                  <Text style={[styles.modeStatVal, isActive && { color: m.accent }]}>{m.workTime}s</Text>
                  <Text style={styles.modeStatLbl}>Work</Text>
                </View>
                <View style={styles.modeStatDivider} />
                <View style={styles.modeStat}>
                  <Text style={[styles.modeStatVal, isActive && { color: m.accent }]}>{m.restTime}s</Text>
                  <Text style={styles.modeStatLbl}>Rest</Text>
                </View>
                <View style={styles.modeStatDivider} />
                <View style={styles.modeStat}>
                  <Text style={[styles.modeStatVal, isActive && { color: m.accent }]}>{m.rounds}</Text>
                  <Text style={styles.modeStatLbl}>Rounds</Text>
                </View>
                <View style={styles.modeStatDivider} />
                <View style={styles.modeStat}>
                  <Text style={[styles.modeStatVal, isActive && { color: m.accent }]}>{formatDuration(modeTotal)}</Text>
                  <Text style={styles.modeStatLbl}>Total</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: mode.accent }]}
        onPress={handleStart}
        activeOpacity={0.85}
      >
        <Text style={styles.startBtnText}>START {mode.label.toUpperCase()}</Text>
      </TouchableOpacity>
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

  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  pageSub: { fontSize: 14, color: colors.textSecondary, paddingHorizontal: spacing.lg, marginTop: 2, marginBottom: spacing.md },

  modeList: { flex: 1, paddingHorizontal: spacing.lg, gap: spacing.sm },

  modeCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'space-between',
    ...shadow.sm,
  },

  modeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  modeDot: { width: 10, height: 10, borderRadius: 5 },
  modeLabel: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  activePill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  modeDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.sm },

  modeStats: { flexDirection: 'row', alignItems: 'center' },
  modeStat: { flex: 1, alignItems: 'center' },
  modeStatVal: { fontSize: 16, fontWeight: '800', color: colors.text },
  modeStatLbl: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 1, letterSpacing: 0.5 },
  modeStatDivider: { width: 1, height: 28, backgroundColor: colors.border },

  startBtn: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.full, paddingVertical: spacing.md + 2,
    alignItems: 'center', ...shadow.md,
  },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
