import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUTS_KEY = 'hiit_saved_workouts';
const HISTORY_KEY = 'hiit_workout_history';

export async function getSavedWorkouts() {
  try {
    const data = await AsyncStorage.getItem(WORKOUTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveWorkout(workout) {
  try {
    const existing = await getSavedWorkouts();
    const updated = existing.filter(w => w.id !== workout.id);
    updated.unshift({ ...workout, id: workout.id || Date.now().toString(), savedAt: Date.now() });
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function deleteWorkout(id) {
  try {
    const existing = await getSavedWorkouts();
    const updated = existing.filter(w => w.id !== id);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function getHistory() {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addHistoryEntry(entry) {
  try {
    const existing = await getHistory();
    const updated = [{ ...entry, id: Date.now().toString(), completedAt: Date.now() }, ...existing].slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function deleteHistoryEntry(id) {
  try {
    const existing = await getHistory();
    const updated = existing.filter(h => h.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {}
}
