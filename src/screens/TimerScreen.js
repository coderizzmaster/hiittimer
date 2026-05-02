import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, Easing, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, shadow } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import EmojiIcon from '../components/EmojiIcon';
import { useTimer, buildSequence, totalDuration } from '../hooks/useTimer';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { playFanfare } from '../utils/beepSound';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m > 0 ? m + ':' : ''}${String(sec).padStart(2, '0')}`;
}

const COUNTDOWN_COLOR = '#4F46E5';

function CircleTimer({ timeLeft, total, phase }) {
  const { colors } = useTheme();
  const isWork = phase === 'work';
  const isCountdown = phase === 'countdown';
  const ringColor = isCountdown ? COUNTDOWN_COLOR : isWork ? colors.primary : colors.rest;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0) {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 150, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft, pulse]);

  const circleCenter = isCountdown ? '#EEF2FF' : isWork ? colors.phaseWork : colors.phaseRest;

  return (
    <Animated.View style={[timerStyles.circleContainer, { transform: [{ scale: pulse }] }]}>
      <View style={[timerStyles.ring, { borderColor: ringColor + '33' }]}>
        <View style={[timerStyles.ringInner, { borderColor: ringColor }]}>
          <View style={[timerStyles.circleCenter, { backgroundColor: circleCenter }]}>
            <Text style={[timerStyles.timerDigits, { color: ringColor }]}>{formatTime(timeLeft)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const CONFETTI_COLORS = ['#E8472A', '#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#00BCD4', '#FF9800', '#9C27B0', '#F59E0B', '#10B981'];
const AMBER = '#F59E0B';
const MOTIVATIONAL = [
  "You showed up. That's the hardest part.",
  "Stronger than yesterday.",
  "Champions are made in moments like this.",
  "Pain is temporary. Pride is forever.",
  "Every rep was worth it.",
  "Your future self is proud of you.",
  "That's what dedication looks like.",
  "Consistency beats motivation every time.",
];

function ConfettiBurst() {
  const particles = useRef(
    Array.from({ length: 72 }, (_, i) => {
      const angle = (i / 72) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 70 + Math.random() * 200;
      const isSquare = i % 4 === 0;
      return {
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(1),
        rotate: new Animated.Value(0),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        tx: Math.cos(angle) * speed,
        ty: Math.sin(angle) * speed - 80,
        rotateDeg: (Math.random() - 0.5) * 900,
        w: isSquare ? 9 : 5 + Math.random() * 7,
        h: isSquare ? 9 : 4 + Math.random() * 11,
        delay: Math.floor(Math.random() * 120),
      };
    })
  ).current;

  useEffect(() => {
    Animated.parallel(
      particles.map(p =>
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.x, { toValue: p.tx, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(p.y, { toValue: p.ty + 180, duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(p.rotate, { toValue: 1, duration: 1100, useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(650),
              Animated.timing(p.opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
            ]),
          ]),
        ])
      )
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: '30%', left: '50%',
            width: p.w, height: p.h,
            marginLeft: -p.w / 2, marginTop: -p.h / 2,
            backgroundColor: p.color,
            borderRadius: 2,
            opacity: p.opacity,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { rotate: p.rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rotateDeg}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

function WorkoutDoneScreen({ config, sequence, total, onDone, onRepeat, insets }) {
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const doneStyles = buildDoneStyles(colors);
  const iconScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const glowScale = useRef(new Animated.Value(0.85)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(22)).current;
  const btnsOpacity = useRef(new Animated.Value(0)).current;

  const quote = useMemo(() => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)], []);

  const totalWorkSeconds = sequence
    .filter(s => s.phase === 'work')
    .reduce((sum, s) => sum + s.duration, 0);

  useEffect(() => {
    if (settings.soundEnabled) playFanfare(settings.soundVolume).catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 110);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 220);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 380);

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1.22, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.1, duration: 950, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 0.85, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.3, duration: 950, useNativeDriver: true }),
        ]),
      ])
    ).start();

    Animated.spring(iconScale, { toValue: 1, tension: 48, friction: 6, useNativeDriver: true }).start();

    Animated.sequence([
      Animated.delay(260),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(80),
      Animated.timing(quoteOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(statsOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(statsY, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
      Animated.delay(60),
      Animated.timing(btnsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[doneStyles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ConfettiBurst />

      <View style={doneStyles.iconSection}>
        <Animated.View style={[doneStyles.glowRing, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
        <Animated.View style={[doneStyles.iconCircle, { transform: [{ scale: iconScale }] }]}>
          <EmojiIcon emoji="🏆" size={60} />
        </Animated.View>
      </View>

      <Animated.View style={{ alignItems: 'center', opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
        <Text style={doneStyles.title}>YOU{'\n'}CRUSHED IT!</Text>
        <Text style={doneStyles.subtitle}>{config.name} — complete</Text>
      </Animated.View>

      <Animated.Text style={[doneStyles.quote, { opacity: quoteOpacity }]}>
        "{quote}"
      </Animated.Text>

      <Animated.View style={[doneStyles.statsRow, { opacity: statsOpacity, transform: [{ translateY: statsY }] }]}>
        <View style={doneStyles.statCard}>
          <Text style={doneStyles.statValue}>{formatTime(totalWorkSeconds)}</Text>
          <Text style={doneStyles.statLabel}>Work Time</Text>
        </View>
        <View style={[doneStyles.statCard, doneStyles.statCardMid]}>
          <Text style={doneStyles.statValue}>{config.rounds}</Text>
          <Text style={doneStyles.statLabel}>Rounds</Text>
        </View>
        <View style={doneStyles.statCard}>
          <Text style={doneStyles.statValue}>{formatTime(total)}</Text>
          <Text style={doneStyles.statLabel}>Total Time</Text>
        </View>
      </Animated.View>

      <Animated.View style={[doneStyles.btns, { opacity: btnsOpacity }]}>
        <TouchableOpacity style={doneStyles.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={doneStyles.doneBtnText}>DONE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={doneStyles.repeatBtn} onPress={onRepeat} activeOpacity={0.8}>
          <Text style={doneStyles.repeatBtnText}>Repeat Workout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function TimerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { config } = route.params;
  const { logSession } = useWorkout();
  const { settings } = useSettings();
  const { colors, isDark } = useTheme();
  const styles = buildTimerStyles(colors);
  const sequence = useMemo(() => buildSequence(config), []);
  const total = totalDuration(sequence);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (settings.keepAwakeEnabled) {
      activateKeepAwakeAsync('workout');
      return () => deactivateKeepAwake('workout');
    }
  }, [settings.keepAwakeEnabled]);

  const handleComplete = useCallback(async () => {
    const elapsed = Math.round((Date.now() - startTime.current) / 1000);
    await logSession({ name: config.name, type: config.type, duration: elapsed, rounds: config.rounds });
  }, [config, logSession]);

  const { currentStep, stepIndex, timeLeft, running, finished, start, pause, reset, skip } = useTimer(sequence, handleComplete, true);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (finished) return;
      e.preventDefault();
      Alert.alert(
        'Quit Workout?',
        'Your progress will be lost.',
        [
          { text: 'Keep Going', style: 'cancel' },
          { text: 'Quit', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsub;
  }, [navigation, finished]);

  const isWork = currentStep?.phase === 'work';
  const isCountdown = currentStep?.phase === 'countdown';
  const bgColor = finished
    ? colors.phaseDone
    : isCountdown ? colors.phaseCountdown
    : isWork ? colors.phaseWork
    : colors.phaseRest;
  const accentColor = isCountdown ? COUNTDOWN_COLOR : isWork ? colors.primary : colors.rest;

  const workoutSequence = sequence.filter(s => s.phase !== 'countdown');
  const countdownOffset = sequence.length - workoutSequence.length;
  const workoutStepIndex = isCountdown ? -1 : stepIndex - countdownOffset;
  const totalSecondsLeft = isCountdown
    ? workoutSequence.reduce((sum, s) => sum + s.duration, 0)
    : sequence.slice(stepIndex).reduce((sum, s, i) => sum + (i === 0 ? timeLeft : s.duration), 0);

  if (finished) {
    return (
      <WorkoutDoneScreen
        config={config}
        sequence={sequence}
        total={total}
        insets={insets}
        onDone={() => { reset(); navigation.popToTop(); }}
        onRepeat={() => { startTime.current = Date.now(); reset(); }}
      />
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: bgColor, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.workoutName} numberOfLines={1}>{config.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text
        style={[styles.roundText, styles.getReadyText, { color: accentColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {isCountdown ? 'GET READY!' : isWork ? (currentStep?.label ?? 'WORK') : 'REST'}
      </Text>

      {!isCountdown && (
        <Text style={styles.roundText}>
          {`Round ${currentStep?.round ?? '—'} of ${currentStep?.totalRounds ?? config.rounds}`}
        </Text>
      )}

      <View style={styles.progressDots}>
        {workoutSequence.map((_, i) => (
          <View key={i} style={[styles.dot, i < workoutStepIndex && styles.dotDone, i === workoutStepIndex && styles.dotActive]} />
        ))}
      </View>

      <CircleTimer timeLeft={timeLeft} total={currentStep?.duration ?? 1} phase={currentStep?.phase ?? 'work'} />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL TIME REMAINING</Text>
        <Text style={styles.totalValue}>{formatTime(totalSecondsLeft)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => Alert.alert(
            'Reset Workout',
            'Are you sure you want to reset the workout?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: reset },
            ]
          )}
          activeOpacity={0.7}
        >
          <Text style={styles.ctrlIcon}>↺</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: accentColor }]}
          onPress={running ? pause : start}
          activeOpacity={0.85}
        >
          <Text style={styles.playIcon}>{running ? '| |' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={skip} activeOpacity={0.7}>
          <Text style={styles.ctrlIcon}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Static styles unaffected by theme (layout/geometry only)
const timerStyles = StyleSheet.create({
  circleContainer: { alignItems: 'center', marginTop: spacing.lg },
  ring: { width: 220, height: 220, borderRadius: 110, borderWidth: 20, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 180, height: 180, borderRadius: 90, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  circleCenter: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  timerDigits: { fontSize: 52, fontWeight: '800', letterSpacing: -2 },
});

function buildTimerStyles(c) {
  return StyleSheet.create({
    safe: { flex: 1 },
    navBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    closeIcon: { fontSize: 20, color: c.text },
    workoutName: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: c.text, paddingHorizontal: spacing.sm },

    roundText: { textAlign: 'center', fontSize: 14, color: c.textSecondary, fontWeight: '600', marginTop: spacing.sm },
    getReadyText: { fontSize: 44, fontWeight: '900', color: COUNTDOWN_COLOR, letterSpacing: -1, marginTop: spacing.xl },

    progressDots: {
      flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
      paddingHorizontal: spacing.xl, marginTop: spacing.md, gap: 4, maxHeight: 24, overflow: 'hidden',
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.border },
    dotDone: { backgroundColor: c.textMuted },
    dotActive: { backgroundColor: c.primary, width: 12 },

    totalCard: { alignItems: 'center', marginTop: spacing.lg },
    totalLabel: { fontSize: 11, fontWeight: '700', color: c.textSecondary, letterSpacing: 1.2, marginBottom: 4 },
    totalValue: { fontSize: 28, fontWeight: '800', color: c.text, letterSpacing: -1 },

    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.xl },
    ctrlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
    ctrlIcon: { fontSize: 28, color: c.text },
    playBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', ...shadow.md },
    playIcon: { fontSize: 34, fontWeight: '900', color: '#fff' },
  });
}

function buildDoneStyles(c) {
  return StyleSheet.create({
    screen: {
      flex: 1, backgroundColor: c.phaseDone,
      alignItems: 'center', justifyContent: 'space-evenly',
      paddingHorizontal: spacing.lg,
    },
    iconSection: { alignItems: 'center', justifyContent: 'center', width: 200, height: 200 },
    glowRing: {
      position: 'absolute',
      width: 190, height: 190, borderRadius: 95,
      backgroundColor: AMBER + '28',
      borderWidth: 2, borderColor: AMBER + '55',
    },
    iconCircle: {
      width: 130, height: 130, borderRadius: 65,
      backgroundColor: AMBER,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: AMBER,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.55,
      shadowRadius: 20,
      elevation: 14,
    },
    title: {
      fontSize: 46, fontWeight: '900', color: c.text,
      textAlign: 'center', letterSpacing: -1.5, lineHeight: 50,
      marginBottom: spacing.xs,
    },
    subtitle: { fontSize: 15, color: c.textSecondary, fontWeight: '600', textAlign: 'center', marginTop: 4 },
    quote: {
      fontSize: 14, color: c.textSecondary, fontStyle: 'italic',
      textAlign: 'center', paddingHorizontal: spacing.lg, lineHeight: 22,
    },
    statsRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
    statCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: radius.lg,
      paddingVertical: spacing.md + 4, alignItems: 'center', ...shadow.sm,
    },
    statCardMid: { borderWidth: 2, borderColor: AMBER + '55' },
    statValue: { fontSize: 24, fontWeight: '800', color: c.text, letterSpacing: -0.5 },
    statLabel: { fontSize: 11, fontWeight: '700', color: c.textSecondary, marginTop: 4, letterSpacing: 0.8 },

    btns: { width: '100%', alignItems: 'center', gap: spacing.sm },
    doneBtn: {
      width: '100%', backgroundColor: AMBER, borderRadius: radius.full,
      paddingVertical: spacing.md + 6, alignItems: 'center',
      shadowColor: AMBER,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 10,
    },
    doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
    repeatBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
    repeatBtnText: { fontSize: 15, color: c.textSecondary, fontWeight: '600' },
  });
}
