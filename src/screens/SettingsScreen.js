import React, { useRef, useState, useEffect } from 'react'; // useState used by VolumeSlider
import { View, Text, StyleSheet, Switch, TouchableOpacity, PanResponder, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow } from '../utils/theme';
import { useSettings } from '../context/SettingsContext';
import { prepareBeep, playBeep } from '../utils/beepSound';

// ── Volume slider ─────────────────────────────────────────────────────────────
const THUMB = 22;

function VolumeSlider({ value, onChange }) {
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


  useEffect(() => { prepareBeep(); }, []);

  async function handleTest() {
    await prepareBeep();
    playBeep(settings.soundVolume);
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Section title="SOUND">
          <SettingRow
            label="Sound effects"
            subtitle="Beep on work phase and countdown end"
            right={
              <Switch
                value={settings.soundEnabled}
                onValueChange={v => updateSettings({ soundEnabled: v })}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            }
          />
          {settings.soundEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.volBlock}>
                <View style={styles.volHeader}>
                  <Text style={styles.rowLabel}>Volume</Text>
                  <View style={styles.volMeta}>
                    <Text style={styles.volPct}>{Math.round(settings.soundVolume * 100)}%</Text>
                    <TouchableOpacity style={styles.testBtn} onPress={handleTest} activeOpacity={0.7}>
                      <Text style={styles.testBtnText}>▶  Test</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <VolumeSlider
                  value={settings.soundVolume}
                  onChange={v => updateSettings({ soundVolume: v })}
                />
              </View>
            </>
          )}
        </Section>

        <Section title="FEEDBACK">
          <SettingRow
            label="Haptic feedback"
            subtitle="Vibrate on interval change"
            right={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={v => updateSettings({ hapticsEnabled: v })}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            label="Countdown cues"
            subtitle="Haptic pulse on last 3 seconds"
            right={
              <Switch
                value={settings.countdownCuesEnabled}
                onValueChange={v => updateSettings({ countdownCuesEnabled: v })}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            }
          />
        </Section>

        <Section title="DISPLAY">
          <SettingRow
            label="Keep screen awake"
            subtitle="Prevent sleep during workout"
            right={
              <Switch
                value={settings.keepAwakeEnabled}
                onValueChange={v => updateSettings({ keepAwakeEnabled: v })}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            }
          />
        </Section>

        <Section title="ABOUT">
          <SettingRow label="Version" right={<Text style={styles.metaText}>1.0.0</Text>} />
          <View style={styles.divider} />
          <SettingRow label="Built with Expo" right={<Text style={styles.metaText}>React Native</Text>} />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, marginBottom: spacing.sm },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, ...shadow.sm },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  rowLeft: { flex: 1, marginRight: spacing.md },
  rowLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  metaText: { fontSize: 14, color: colors.textSecondary },

  // ── Volume block ────────────────────────────────────────────────────────────
  volBlock: {
    paddingVertical: spacing.md,
  },
  volHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  volMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  volPct: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    minWidth: 38,
    textAlign: 'right',
  },
  testBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // ── Slider ──────────────────────────────────────────────────────────────────
  sliderOuter: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
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
});
