import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, shadow } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const MODES = [
  {
    label: 'Classic Tabata',
    description: 'The original protocol. Short max-effort bursts with minimal rest.',
    workTime: 20, restTime: 10, rounds: 8,
    accent: '#E8472A',
    lightBg: '#FFF5F4', darkBg: '#2D1A16',
  },
  {
    label: 'Power Intervals',
    description: 'Longer sets for explosive strength and power output.',
    workTime: 30, restTime: 15, rounds: 6,
    accent: '#7C3AED',
    lightBg: '#F5F3FF', darkBg: '#1E1A2D',
  },
  {
    label: 'Endurance Burn',
    description: 'Extended rounds to build sustained cardio conditioning.',
    workTime: 40, restTime: 20, rounds: 10,
    accent: '#0284C7',
    lightBg: '#F0F9FF', darkBg: '#142030',
  },
];

const COUNTDOWN = 5;

export default function TabataScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(0);
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const styles = buildStyles(colors);
  const mode = MODES[selected];

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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

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
          const cardBg = isActive ? (isDark ? m.darkBg : m.lightBg) : colors.surface;
          const modeTotal = (m.workTime + m.restTime) * m.rounds - m.restTime;
          return (
            <TouchableOpacity
              key={m.label}
              style={[
                styles.modeCard,
                { backgroundColor: cardBg },
                isActive && { borderColor: m.accent, borderWidth: 2 },
              ]}
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

    pageTitle: { fontSize: 26, fontWeight: '800', color: c.text, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
    pageSub: { fontSize: 14, color: c.textSecondary, paddingHorizontal: spacing.lg, marginTop: 2, marginBottom: spacing.md },

    modeList: { flex: 1, paddingHorizontal: spacing.lg, gap: spacing.sm },

    modeCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: radius.lg,
      padding: spacing.md, borderWidth: 1.5, borderColor: c.border,
      justifyContent: 'space-between',
      ...shadow.sm,
    },

    modeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    modeDot: { width: 10, height: 10, borderRadius: 5 },
    modeLabel: { fontSize: 16, fontWeight: '800', color: c.text, flex: 1 },
    activePill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
    activePillText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

    modeDesc: { fontSize: 13, color: c.textSecondary, lineHeight: 18, marginBottom: spacing.sm },

    modeStats: { flexDirection: 'row', alignItems: 'center' },
    modeStat: { flex: 1, alignItems: 'center' },
    modeStatVal: { fontSize: 16, fontWeight: '800', color: c.text },
    modeStatLbl: { fontSize: 10, fontWeight: '600', color: c.textMuted, marginTop: 1, letterSpacing: 0.5 },
    modeStatDivider: { width: 1, height: 28, backgroundColor: c.border },

    startBtn: {
      marginHorizontal: spacing.lg, marginTop: spacing.md,
      borderRadius: radius.full, paddingVertical: spacing.md + 2,
      alignItems: 'center', ...shadow.md,
    },
    startBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  });
}
