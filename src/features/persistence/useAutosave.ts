import { useEffect, useRef } from 'react';
import type { AppState } from '../../hooks/useScene';
import { saveSession } from '../../lib/storage';

const DEBOUNCE_MS = 5000;

export function useAutosave(state: AppState): void {
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!state.image) return;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { void saveSession(state); }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [state]);
}
