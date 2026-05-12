import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { prepareBeep, playBeep, playFanfare } from '../utils/beepSound';

// Build a flat sequence of intervals from a workout config
export function buildSequence(config) {
  const seq = [];

  if ((config.countdownTime ?? 5) > 0) {
    seq.push({ phase: 'countdown', duration: config.countdownTime ?? 5, label: 'GET READY', round: 1, totalRounds: config.rounds });
  }

  if (config.type === 'tabata') {
    for (let r = 0; r < config.rounds; r++) {
      seq.push({ phase: 'work', duration: config.workTime, round: r + 1, totalRounds: config.rounds, label: 'WORK' });
      if (r < config.rounds - 1) {
        seq.push({ phase: 'rest', duration: config.restTime, round: r + 1, totalRounds: config.rounds, label: 'REST' });
      }
    }
  } else if (config.type === 'emom') {
    const exercises = config.exercises || [];
    for (let r = 0; r < config.rounds; r++) {
      exercises.forEach((ex, i) => {
        seq.push({
          phase: 'work',
          duration: 60,
          round: r + 1,
          totalRounds: config.rounds,
          label: ex.name || `Exercise ${i + 1}`,
          exerciseIndex: i,
        });
      });
    }
  } else if (config.type === 'circuit' || config.type === 'custom') {
    const exercises = config.exercises || [];
    for (let r = 0; r < config.rounds; r++) {
      exercises.forEach((ex, i) => {
        seq.push({
          phase: 'work',
          duration: ex.workTime,
          round: r + 1,
          totalRounds: config.rounds,
          label: ex.name || `Exercise ${i + 1}`,
          exerciseIndex: i,
        });
        if (ex.restTime > 0) {
          seq.push({
            phase: 'rest',
            duration: ex.restTime,
            round: r + 1,
            totalRounds: config.rounds,
            label: 'REST',
            exerciseIndex: i,
          });
        }
      });
    }
  }

  return seq;
}

export function totalDuration(sequence) {
  return sequence.reduce((sum, s) => sum + (s.phase === 'countdown' ? 0 : s.duration), 0);
}

export function useTimer(sequence, onComplete, autoStart = false, volumeOverride = null) {
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(sequence[0]?.duration ?? 0);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);

  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Always-current refs so closures never read stale state
  const stepIndexRef = useRef(0);
  stepIndexRef.current = stepIndex;
  const timeLeftRef = useRef(sequence[0]?.duration ?? 0);
  timeLeftRef.current = timeLeft;
  const runningRef = useRef(autoStart);
  runningRef.current = running;
  const finishedRef = useRef(false);
  finishedRef.current = finished;

  const backgroundTimestampRef = useRef(null);

  const currentStep = sequence[stepIndex] ?? null;

  const { settings } = useSettings();
  const soundEnabledRef = useRef(settings.soundEnabled);
  const soundVolumeRef = useRef(settings.soundVolume);
  const hapticsEnabledRef = useRef(settings.hapticsEnabled);
  const pauseOnBackgroundRef = useRef(settings.pauseOnBackground);
  const mixWithMusicRef = useRef(settings.mixWithMusic ?? true);
  const ttsEnabledRef = useRef(settings.ttsEnabled ?? false);
  soundEnabledRef.current = settings.soundEnabled;
  soundVolumeRef.current = settings.soundVolume;
  mixWithMusicRef.current = settings.mixWithMusic ?? true;
  hapticsEnabledRef.current = settings.hapticsEnabled;
  pauseOnBackgroundRef.current = settings.pauseOnBackground;
  ttsEnabledRef.current = settings.ttsEnabled ?? false;
  // ttsEnabledRef kept for beep-suppression logic in triggerCue

  useEffect(() => {
    prepareBeep();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (runningRef.current && !finishedRef.current) {
          if (pauseOnBackgroundRef.current) {
            setRunning(false);
          } else {
            backgroundTimestampRef.current = Date.now();
          }
        }
      } else if (nextState === 'active') {
        if (backgroundTimestampRef.current !== null) {
          const elapsed = Math.floor((Date.now() - backgroundTimestampRef.current) / 1000);
          backgroundTimestampRef.current = null;
          if (runningRef.current && !finishedRef.current && elapsed > 0) {
            let remaining = elapsed;
            let idx = stepIndexRef.current;
            let tLeft = timeLeftRef.current;
            while (remaining > 0) {
              if (remaining < tLeft) {
                tLeft -= remaining;
                remaining = 0;
              } else {
                remaining -= tLeft;
                idx++;
                if (idx >= sequence.length) {
                  setRunning(false);
                  setFinished(true);
                  setStepIndex(sequence.length - 1);
                  setTimeLeft(0);
                  onCompleteRef.current?.();
                  return;
                }
                tLeft = sequence[idx].duration;
              }
            }
            setStepIndex(idx);
            setTimeLeft(tLeft);
          }
        }
      }
    });
    return () => sub.remove();
  }, [sequence]);

  const triggerCue = useCallback(async (phase, label) => {
    const vol = volumeOverride?.current ?? soundVolumeRef.current;
    try {
      if (phase === 'work') {
        if (hapticsEnabledRef.current) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const speakingName = ttsEnabledRef.current && label && label !== 'WORK';
        if (soundEnabledRef.current && !speakingName) playBeep(vol, mixWithMusicRef.current);
      } else if (phase === 'done') {
        if (soundEnabledRef.current) playFanfare(vol, mixWithMusicRef.current);
      } else if (phase === 'countdown') {
        // no haptic when countdown starts — ticks handle it
      } else {
        if (hapticsEnabledRef.current) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (soundEnabledRef.current && !ttsEnabledRef.current) playBeep(vol, mixWithMusicRef.current);
      }
    } catch {}
  }, [volumeOverride]);

  const countdownCue = useCallback(async () => {
    try {
      if (hapticsEnabledRef.current) await Haptics.selectionAsync();
    } catch {}
  }, []);

  useEffect(() => {
    if (!running || finished) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) {
          if (prev <= 4) countdownCue();
          return prev - 1;
        }
        // Step complete — advance directly, never pass through 0
        const next = stepIndexRef.current + 1;
        if (next >= sequence.length) {
          setRunning(false);
          setFinished(true);
          triggerCue('done');
          onCompleteRef.current?.();
          return 0;
        }
        triggerCue(sequence[next].phase, sequence[next].label);
        setStepIndex(next);
        return sequence[next].duration;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, finished, sequence, triggerCue, countdownCue]);

  const start = useCallback(() => {
    if (finished) return;
    if (stepIndexRef.current === 0 && hapticsEnabledRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 200);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 350);
    }
    triggerCue(currentStep?.phase ?? 'work', currentStep?.label);
    setRunning(true);
  }, [finished, currentStep, triggerCue]);

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setStepIndex(0);
    setTimeLeft(sequence[0]?.duration ?? 0);
  }, [sequence]);

  const skip = useCallback(() => {
    const next = stepIndexRef.current + 1;
    if (next >= sequence.length) {
      setRunning(false);
      setFinished(true);
      onCompleteRef.current?.();
      return;
    }
    triggerCue(sequence[next].phase, sequence[next].label);
    setStepIndex(next);
    setTimeLeft(sequence[next].duration);
  }, [sequence, triggerCue]);

  return {
    currentStep,
    stepIndex,
    timeLeft,
    running,
    finished,
    totalSteps: sequence.length,
    start,
    pause,
    reset,
    skip,
  };
}
