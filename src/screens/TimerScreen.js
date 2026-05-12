import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, Easing, Alert, useWindowDimensions, PanResponder } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, shadow } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import EmojiIcon from '../components/EmojiIcon';
import { useTimer, buildSequence, totalDuration } from '../hooks/useTimer';
import { useWorkout } from '../context/WorkoutContext';
import { useSettings } from '../context/SettingsContext';
import { playFanfare, playDing } from '../utils/beepSound';
import * as StoreReview from 'expo-store-review';
import { Image as ExpoImage } from 'expo-image';
import { getRandomCelebrationGif } from '../utils/celebrationGifs';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m > 0 ? m + ':' : ''}${String(sec).padStart(2, '0')}`;
}

const COUNTDOWN_COLOR = '#4F46E5';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function useRingScale() {
  const { width } = useWindowDimensions();
  const sc = Math.min(width / 390, 1.6);
  return {
    sc,
    RING_SIZE: Math.round(220 * sc),
    RING_RADIUS: Math.round(95 * sc),
    RING_STROKE: Math.round(14 * sc),
    RING_CIRCUMFERENCE: 2 * Math.PI * Math.round(95 * sc),
    CENTER_SIZE: Math.round(160 * sc),
    DIGIT_SIZE: Math.round(52 * sc),
  };
}

function CircleTimer({ timeLeft, total, phase, running }) {
  const { colors } = useTheme();
  const { RING_SIZE, RING_RADIUS, RING_STROKE, RING_CIRCUMFERENCE, CENTER_SIZE, DIGIT_SIZE } = useRingScale();
  const isWork = phase === 'work';
  const isCountdown = phase === 'countdown';
  const ringColor = isCountdown ? COUNTDOWN_COLOR : isWork ? colors.primary : colors.rest;
  const pulse = useRef(new Animated.Value(1)).current;
  const dashOffset = useRef(new Animated.Value(0)).current;
  const prevTotalRef = useRef(total);
  const prevTimeLeftRef = useRef(timeLeft);

  useEffect(() => {
    const totalChanged = total !== prevTotalRef.current;
    const timeJumpedUp = timeLeft > prevTimeLeftRef.current;
    prevTotalRef.current = total;
    prevTimeLeftRef.current = timeLeft;

    if (totalChanged || timeJumpedUp) {
      dashOffset.stopAnimation();
      dashOffset.setValue(RING_CIRCUMFERENCE * (1 - (total > 0 ? timeLeft / total : 0)));
    }

    if (!running) {
      dashOffset.stopAnimation();
      return;
    }

    Animated.timing(dashOffset, {
      toValue: RING_CIRCUMFERENCE,
      duration: timeLeft * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, total, running]);

  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0) {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 150, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft, pulse]);

  const circleCenter = isCountdown ? '#EEF2FF' : isWork ? colors.phaseWork : colors.phaseRest;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  return (
    <Animated.View style={[timerStyles.circleContainer, { transform: [{ scale: pulse }] }]}>
      <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
          <Circle
            cx={cx} cy={cy} r={RING_RADIUS}
            strokeWidth={RING_STROKE}
            stroke={ringColor + '33'}
            fill="none"
          />
          <AnimatedCircle
            cx={cx} cy={cy} r={RING_RADIUS}
            strokeWidth={RING_STROKE}
            stroke={ringColor}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${cx}, ${cy}`}
          />
        </Svg>
        <View style={[timerStyles.circleCenter, { backgroundColor: circleCenter, width: CENTER_SIZE, height: CENTER_SIZE, borderRadius: CENTER_SIZE / 2 }]}>
          <Text style={[timerStyles.timerDigits, { color: ringColor, fontSize: DIGIT_SIZE }]}>{formatTime(timeLeft)}</Text>
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

function TappableStatCard({ value, label, cardStyle, valueStyle, labelStyle, zIndex }) {
  const scale = useRef(new Animated.Value(1)).current;
  function onPressIn() {
    Animated.spring(scale, { toValue: 1.06, useNativeDriver: true, tension: 200, friction: 10 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  }
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }], zIndex }}>
      <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.82} style={cardStyle}>
        <Text style={valueStyle}>{value}</Text>
        <Text style={labelStyle}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function WorkoutDoneScreen({ config, sequence, total, onDone, onRepeat, insets, requestReview }) {
  const { colors, isDark } = useTheme();
  const { sc } = useRingScale();
  const { settings } = useSettings();
  const doneStyles = buildDoneStyles(colors, isDark, sc);
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
  const gifUrl = useMemo(() => getRandomCelebrationGif(), []);

  const totalWorkSeconds = sequence
    .filter(s => s.phase === 'work')
    .reduce((sum, s) => sum + s.duration, 0);

  useEffect(() => {
    if (settings.soundEnabled) playFanfare(settings.soundVolume, settings.mixWithMusic ?? true).catch(() => {});
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 80);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 160);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 240);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 320);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 450);
    }

    if (requestReview) {
      setTimeout(() => StoreReview.requestReview().catch(() => {}), 3000);
    }

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
          {gifUrl ? (
            <ExpoImage
              source={{ uri: gifUrl }}
              style={doneStyles.gifImage}
              contentFit="cover"
            />
          ) : (
            <EmojiIcon emoji="🥳" size={Math.round(60 * sc)} />
          )}
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
        <TappableStatCard value={formatTime(totalWorkSeconds)} label="Work Time" cardStyle={doneStyles.statCard} valueStyle={doneStyles.statValue} labelStyle={doneStyles.statLabel} />
        <TappableStatCard value={config.rounds} label="Rounds" cardStyle={[doneStyles.statCard, doneStyles.statCardMid]} valueStyle={doneStyles.statValue} labelStyle={doneStyles.statLabel} zIndex={1} />
        <TappableStatCard value={formatTime(total)} label="Total Time" cardStyle={doneStyles.statCard} valueStyle={doneStyles.statValue} labelStyle={doneStyles.statLabel} />
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

function TimerVolumeSlider({ value, onChange, onRelease, color }) {
  const [trackW, setTrackW] = useState(0);
  const trackWRef = useRef(0);
  const trackPageXRef = useRef(0);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onReleaseRef = useRef(onRelease);
  onReleaseRef.current = onRelease;

  const clamp = (pageX) => {
    const x = pageX - trackPageXRef.current;
    onChangeRef.current(Math.max(0, Math.min(1, x / trackWRef.current)));
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: e => { if (trackWRef.current) clamp(e.nativeEvent.pageX); },
    onPanResponderMove: e => { if (trackWRef.current) clamp(e.nativeEvent.pageX); },
    onPanResponderRelease: () => { onReleaseRef.current?.(); },
    onPanResponderTerminate: () => { onReleaseRef.current?.(); },
  })).current;

  return (
    <View
      ref={viewRef}
      {...pan.panHandlers}
      style={{ height: 36, justifyContent: 'center' }}
      onLayout={() => {
        viewRef.current?.measure((_x, _y, w, _h, pageX) => {
          trackWRef.current = w;
          trackPageXRef.current = pageX;
          setTrackW(w);
        });
      }}
    >
      <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${value * 100}%`, backgroundColor: color, borderRadius: 2 }} />
      </View>
      {trackW > 0 && (
        <View style={{
          position: 'absolute',
          width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
          left: value * trackW - 10, top: 8,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
        }} />
      )}
    </View>
  );
}

export default function TimerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { config } = route.params;
  const { logSession } = useWorkout();
  const { settings } = useSettings();
  const { colors, isDark } = useTheme();
  const { sc } = useRingScale();
  const styles = buildTimerStyles(colors, sc);
  const sequence = useMemo(() => buildSequence(config), []);
  const total = totalDuration(sequence);
  const startTime = useRef(Date.now());
  const [localVolume, setLocalVolume] = useState(settings.soundVolume);
  const localVolumeRef = useRef(localVolume);
  localVolumeRef.current = localVolume;

  useEffect(() => {
    if (settings.keepAwakeEnabled) {
      activateKeepAwakeAsync('workout');
      return () => deactivateKeepAwake('workout');
    }
  }, [settings.keepAwakeEnabled]);

  const isFifthWorkoutRef = useRef(false);

  const handleComplete = useCallback(async () => {
    const elapsed = Math.round((Date.now() - startTime.current) / 1000);
    const count = await logSession({ name: config.name, type: config.type, duration: elapsed, rounds: config.rounds });
    isFifthWorkoutRef.current = count === 5 || count === 25;
  }, [config, logSession]);

  const { currentStep, stepIndex, timeLeft, running, finished, start, pause, reset, skip } = useTimer(sequence, handleComplete, true, localVolumeRef);

  // TTS: speak phase name when the step changes
  useEffect(() => {
    if (!settings.ttsEnabled) return;
    const step = sequence[stepIndex];
    if (!step) return;
    if (step.phase === 'rest') {
      playDing(localVolumeRef.current, settings.mixWithMusic ?? true);
      Speech.speak('Rest', { rate: 0.9, volume: localVolumeRef.current });
    } else if (step.phase === 'work' && step.label && step.label !== 'WORK') {
      playDing(localVolumeRef.current, settings.mixWithMusic ?? true);
      Speech.speak(step.label, { rate: 0.9, volume: localVolumeRef.current });
    }
  }, [stepIndex, sequence, settings.ttsEnabled]);

  // TTS: count down the last 3 seconds before each transition
  useEffect(() => {
    if (!settings.ttsEnabled || !running || timeLeft < 1 || timeLeft > 3) return;
    Speech.speak(String(timeLeft), { rate: 1.1, volume: localVolumeRef.current });
  }, [timeLeft, running, settings.ttsEnabled]);

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
        requestReview={isFifthWorkoutRef.current}
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

      <View style={styles.body}>
        <Text
          style={[styles.roundText, styles.getReadyText, { color: accentColor }]}
          numberOfLines={1}
        >
          {isCountdown ? 'GET READY!' : isWork ? (currentStep?.label ?? 'WORK') : 'REST'}
        </Text>

        <Text style={styles.roundText}>
          {isCountdown ? '' : `Round ${currentStep?.round ?? '—'} of ${currentStep?.totalRounds ?? config.rounds}`}
        </Text>

        <View style={styles.progressDots}>
          {workoutSequence.map((_, i) => (
            <View key={i} style={[styles.dot, i < workoutStepIndex && styles.dotDone, i === workoutStepIndex && styles.dotActive]} />
          ))}
        </View>

        <CircleTimer timeLeft={timeLeft} total={currentStep?.duration ?? 1} phase={currentStep?.phase ?? 'work'} running={running} />

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
            <Ionicons name="refresh" size={Math.round(24 * sc)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: accentColor }]}
            onPress={running ? pause : start}
            activeOpacity={0.85}
          >
            <Ionicons name={running ? 'pause' : 'play'} size={Math.round(32 * sc)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={skip} activeOpacity={0.7}>
            <Ionicons name="play-skip-forward" size={Math.round(24 * sc)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.volumeRow}>
          <Ionicons name="volume-low" size={16} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <TimerVolumeSlider
              value={localVolume}
              onChange={setLocalVolume}
              onRelease={() => { if (settings.soundEnabled) playDing(localVolumeRef.current, settings.mixWithMusic ?? true); }}
              color={accentColor}
            />
          </View>
          <Ionicons name="volume-high" size={16} color={colors.textSecondary} />
        </View>
        {settings.ttsEnabled && (
          <Text style={styles.ttsNote}>Voice volume uses device buttons</Text>
        )}
      </View>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  circleContainer: { alignItems: 'center', marginTop: spacing.lg },
  circleCenter: { alignItems: 'center', justifyContent: 'center' },
  timerDigits: { fontWeight: '800', letterSpacing: -2 },
});

function buildTimerStyles(c, sc = 1) {
  const s = (n) => Math.round(n * sc);
  return StyleSheet.create({
    safe: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    body: sc > 1 ? { flex: 1, justifyContent: 'center', paddingBottom: '20%' } : {},
    navBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    closeIcon: { fontSize: 20, color: c.text },
    workoutName: { flex: 1, textAlign: 'center', fontSize: s(16), fontWeight: '700', color: c.text, paddingHorizontal: spacing.sm },

    roundText: { textAlign: 'center', fontSize: s(14), color: c.textSecondary, fontWeight: '600', marginTop: spacing.sm, height: s(20), lineHeight: s(20) },
    getReadyText: { fontSize: s(44), fontWeight: '900', color: COUNTDOWN_COLOR, letterSpacing: -1, marginTop: spacing.xl, height: s(52), lineHeight: s(52) },

    progressDots: {
      flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
      paddingHorizontal: spacing.xl, marginTop: spacing.md, gap: 4, maxHeight: 24, overflow: 'hidden',
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.border },
    dotDone: { backgroundColor: c.textMuted },
    dotActive: { backgroundColor: c.primary, width: 12 },

    totalCard: { alignItems: 'center', marginTop: spacing.lg },
    totalLabel: { fontSize: s(11), fontWeight: '700', color: c.textSecondary, letterSpacing: 1.2, marginBottom: 4 },
    totalValue: { fontSize: s(28), fontWeight: '800', color: c.text, letterSpacing: -1 },

    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(spacing.xl), marginTop: spacing.xl },
    volumeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: s(256), alignSelf: 'center', marginTop: spacing.md },
    ttsNote: { textAlign: 'center', fontSize: s(11), color: c.textMuted, marginTop: 4 },
    ctrlBtn: { width: s(56), height: s(56), borderRadius: s(28), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.sm },
    playBtn: { width: s(80), height: s(80), borderRadius: s(40), alignItems: 'center', justifyContent: 'center', ...shadow.md },
  });
}

function buildDoneStyles(c, isDark, sc = 1) {
  const s = (n) => Math.round(n * sc);
  return StyleSheet.create({
    screen: {
      flex: 1, backgroundColor: c.phaseDone,
      alignItems: 'center', justifyContent: 'space-evenly',
      paddingHorizontal: spacing.lg,
    },
    iconSection: { alignItems: 'center', justifyContent: 'center', width: s(200), height: s(200) },
    glowRing: {
      position: 'absolute',
      width: s(190), height: s(190), borderRadius: s(95),
      backgroundColor: AMBER + '28',
      borderWidth: 2, borderColor: AMBER + '55',
    },
    iconCircle: {
      width: s(160), height: s(160), borderRadius: s(80),
      backgroundColor: AMBER,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      shadowColor: AMBER,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.55,
      shadowRadius: 20,
      elevation: 14,
    },
    gifImage: {
      width: s(160), height: s(160),
    },
    title: {
      fontSize: s(36), fontWeight: '900', color: c.text,
      textAlign: 'center', letterSpacing: 2, lineHeight: s(44),
      marginBottom: spacing.xs,
    },
    subtitle: { fontSize: s(15), color: c.textSecondary, fontWeight: '600', textAlign: 'center', marginTop: 4 },
    quote: {
      fontSize: s(14), color: c.textSecondary, fontStyle: 'italic',
      textAlign: 'center', paddingHorizontal: spacing.lg, lineHeight: s(22),
    },
    statsRow: { flexDirection: 'row', gap: spacing.sm, width: '100%', maxWidth: 520, alignSelf: 'center' },
    statCard: {
      backgroundColor: isDark ? c.surface : '#fff', borderRadius: radius.md,
      paddingVertical: spacing.md + 6, alignItems: 'center', borderWidth: 1.5, borderColor: AMBER,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    },
    statCardMid: { zIndex: 1 },
    statValue: { fontSize: s(21), fontWeight: '800', color: c.text, letterSpacing: -1 },
    statLabel: { fontSize: s(10), fontWeight: '700', color: c.textSecondary, marginTop: 4, letterSpacing: 1.2 },

    btns: { width: '100%', maxWidth: 520, alignSelf: 'center', alignItems: 'center', gap: spacing.sm },
    doneBtn: {
      width: '100%', backgroundColor: AMBER, borderRadius: radius.full,
      paddingVertical: s(spacing.md), alignItems: 'center',
      shadowColor: AMBER,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 10,
    },
    doneBtnText: { color: '#fff', fontSize: s(17), fontWeight: '900', letterSpacing: 1 },
    repeatBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
    repeatBtnText: { fontSize: s(15), color: c.textSecondary, fontWeight: '600' },
  });
}
