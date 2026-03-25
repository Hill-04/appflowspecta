import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Persists form state in sessionStorage so switching browser tabs
 * or accidental reloads don't lose user work.
 * Clears automatically on explicit save/cancel via `clearDraft()`.
 */
export function useSessionDraft<T>(
  key: string,
  initialValue: T,
  { debounceMs = 400 }: { debounceMs?: number } = {}
): [T, (v: T | ((prev: T) => T)) => void, { clearDraft: () => void; isDirty: boolean }] {
  const fullKey = `draft:${key}`;

  const [value, setValueRaw] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(fullKey);
      if (stored) return JSON.parse(stored) as T;
    } catch { /* ignore */ }
    return initialValue;
  });

  const isDirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Persist to sessionStorage with debounce
  useEffect(() => {
    if (!isDirtyRef.current) return;
    timerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(fullKey, JSON.stringify(value));
      } catch { /* quota exceeded — ignore */ }
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [value, fullKey, debounceMs]);

  const setValue = useCallback((v: T | ((prev: T) => T)) => {
    isDirtyRef.current = true;
    setValueRaw(v);
  }, []);

  const clearDraft = useCallback(() => {
    isDirtyRef.current = false;
    sessionStorage.removeItem(fullKey);
  }, [fullKey]);

  // Warn on beforeunload when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return [value, setValue, { clearDraft, isDirty: isDirtyRef.current }];
}
