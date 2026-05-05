import React, { createContext, useContext, useState, useCallback } from 'react';
import { getSavedWorkouts, saveWorkout, deleteWorkout, getHistory, addHistoryEntry, clearHistory } from '../utils/storage';

const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [history, setHistory] = useState([]);

  const loadWorkouts = useCallback(async () => {
    const workouts = await getSavedWorkouts();
    setSavedWorkouts(workouts);
  }, []);

  const loadHistory = useCallback(async () => {
    const h = await getHistory();
    setHistory(h);
  }, []);

  const persistSave = useCallback(async (workout) => {
    const updated = await saveWorkout(workout);
    setSavedWorkouts(updated);
  }, []);

  const persistDelete = useCallback(async (id) => {
    const updated = await deleteWorkout(id);
    setSavedWorkouts(updated);
  }, []);

  const logSession = useCallback(async (entry) => {
    const updated = await addHistoryEntry(entry);
    setHistory(updated);
    return updated.length;
  }, []);

  const wipeHistory = useCallback(async () => {
    await clearHistory();
    setHistory([]);
  }, []);

  return (
    <WorkoutContext.Provider value={{
      savedWorkouts,
      history,
      loadWorkouts,
      loadHistory,
      persistSave,
      persistDelete,
      logSession,
      wipeHistory,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  return useContext(WorkoutContext);
}
