import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, StatusBar, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, shadow } from '../utils/theme';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { prepareBeep, playBeep } from '../utils/beepSound';

// ── Animated toggle ───────────────────────────────────────────────────────────
const TRACK_W = 51;
const TRACK_H = 31;
const TOGGLE_THUMB = 27;
const TOGGLE_PAD = 2;
const TRAVEL = TRACK_W - TOGGLE_THUMB - TOGGLE_PAD * 2;
const ON_COLOR = '#34C759';

function AnimatedSwitch({ value, onValueChange }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 90,
      friction: 9,
    }).start();
  }, [value]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, ON_COLOR],
  });

  const thumbX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [TOGGLE_PAD, TOGGLE_PAD + TRAVEL],
  });

  function handlePress() {
    if (!value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onValueChange(!value);
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={{ width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: trackColor, justifyContent: 'center' }}>
        <Animated.View style={{
          position: 'absolute',
          width: TOGGLE_THUMB, height: TOGGLE_THUMB, borderRadius: TOGGLE_THUMB / 2,
          backgroundColor: '#fff',
          transform: [{ translateX: thumbX }],
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25, shadowRadius: 3, elevation: 3,
        }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Volume slider ─────────────────────────────────────────────────────────────
const THUMB = 22;

function VolumeSlider({ value, onChange }) {
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);
  const [trackW, setTrackW] = useState(0);
  const trackWRef = useRef(0);
  const trackPageXRef = useRef(0);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const clamp = (pageX) => {
    const x = pageX - trackPageXRef.current;
    onChangeRef.current(Math.max(0, Math.min(1, x / trackWRef.current)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: e => { if (trackWRef.current) clamp(e.nativeEvent.pageX); },
      onPanResponderMove: e => { if (trackWRef.current) clamp(e.nativeEvent.pageX); },
    })
  ).current;

  return (
    <View
      ref={viewRef}
      {...pan.panHandlers}
      style={styles.sliderOuter}
      onLayout={() => {
        viewRef.current?.measure((_x, _y, width, _h, pageX) => {
          trackWRef.current = width;
          trackPageXRef.current = pageX;
          setTrackW(width);
        });
      }}
    >
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value * 100}%` }]} />
      </View>
      {trackW > 0 && (
        <View style={[styles.sliderThumb, { left: value * trackW - THUMB / 2 }]} />
      )}
    </View>
  );
}

// ── Shared row / section components ──────────────────────────────────────────
function SettingRow({ label, subtitle, right }) {
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Section({ title, children }) {
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { colors, isDark } = useTheme();
  const styles = buildStyles(colors, isDark);

  useEffect(() => { prepareBeep(settings.mixWithMusic ?? true); }, [settings.mixWithMusic]);

  async function handleTest() {
    await prepareBeep();
    playBeep(settings.soundVolume);
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Section title="SOUND">
          <SettingRow
            label="Sound effects"
            subtitle="Beep on work phase and countdown end"
            right={
              <AnimatedSwitch
                value={settings.soundEnabled}
                onValueChange={v => updateSettings({ soundEnabled: v })}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            label="Exercise announcements"
            subtitle="Speak exercise name aloud when it starts"
            right={
              <AnimatedSwitch
                value={settings.ttsEnabled ?? false}
                onValueChange={v => updateSettings({ ttsEnabled: v })}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            label="Mix with music"
            subtitle="Play sounds alongside background music"
            right={
              <AnimatedSwitch
                value={settings.mixWithMusic ?? true}
                onValueChange={v => updateSettings({ mixWithMusic: v })}
              />
            }
          />
          {settings.soundEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.volBlock}>
                <View style={styles.volHeader}>
                  <Text style={styles.rowLabel}>Volume</Text>
                  <Text style={styles.volPct}>{Math.round(settings.soundVolume * 100)}%</Text>
                </View>
                <View style={styles.sliderRow}>
                  <View style={{ flex: 1 }}>
                    <VolumeSlider
                      value={settings.soundVolume}
                      onChange={v => updateSettings({ soundVolume: v })}
                    />
                  </View>
                  <TouchableOpacity style={styles.testBtn} onPress={handleTest} activeOpacity={0.7}>
                    <Ionicons name="volume-high-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </Section>

        <Section title="FEEDBACK">
          <SettingRow
            label="Haptic feedback"
            subtitle="Vibrate on interval change"
            right={
              <AnimatedSwitch
                value={settings.hapticsEnabled}
                onValueChange={v => updateSettings({ hapticsEnabled: v })}
              />
            }
          />
        </Section>

        <Section title="DISPLAY">
          <SettingRow
            label="Dark mode"
            right={
              <AnimatedSwitch
                value={settings.darkMode ?? false}
                onValueChange={v => updateSettings({ darkMode: v })}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            label="Keep screen awake"
            subtitle="Prevent sleep during workout"
            right={
              <AnimatedSwitch
                value={settings.keepAwakeEnabled}
                onValueChange={v => updateSettings({ keepAwakeEnabled: v })}
              />
            }
          />
        </Section>

        <Section title="WORKOUT">
          <SettingRow
            label="Pause on background"
            subtitle="Pause timer when you leave the app"
            right={
              <AnimatedSwitch
                value={settings.pauseOnBackground ?? false}
                onValueChange={v => updateSettings({ pauseOnBackground: v })}
              />
            }
          />
        </Section>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function buildStyles(c, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl ?? 32 },
    header: { paddingTop: spacing.md, marginBottom: spacing.md },
    title: { fontSize: 26, fontWeight: '800', color: c.text },

    section: { marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: c.textSecondary, letterSpacing: 1.2, marginBottom: 5 },
    sectionCard: { backgroundColor: isDark ? c.surface : '#fff', borderRadius: radius.lg, paddingHorizontal: spacing.md, ...shadow.sm },

    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    rowLeft: { flex: 1, marginRight: spacing.md },
    rowLabel: { fontSize: 15, fontWeight: '500', color: c.text },
    rowSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    divider: { height: 1, backgroundColor: c.border },

    // ── Volume block ──────────────────────────────────────────────────────────
    volBlock: { paddingVertical: 10 },
    volHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    volPct: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      minWidth: 38,
      textAlign: 'right',
    },
    sliderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    testBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Slider ────────────────────────────────────────────────────────────────
    sliderOuter: {
      height: 40,
      justifyContent: 'center',
      position: 'relative',
    },
    sliderTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    sliderFill: {
      height: '100%',
      backgroundColor: c.primary,
      borderRadius: 3,
    },
    sliderThumb: {
      position: 'absolute',
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: '#fff',
      top: (40 - THUMB) / 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 4,
    },

    // ── Version ───────────────────────────────────────────────────────────────
    versionContainer: { alignItems: 'center', marginTop: spacing.lg },
    versionText: { fontSize: 11, color: c.textMuted },
  });
}
