import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

/**
 * Persists form data + modal open state in localStorage.
 * Survives tab switches, route changes, component remounts, and browser restarts.
 * Only cleared on explicit save or cancel via `clearDraft()`.
 *
 * Key fix: flushes pending data synchronously on unmount so navigation
 * never causes data loss (the debounce timer cleanup can't eat unsaved writes).
 */
export function useLocalDraft<T>(
  key: string,
  initialValue: T,
  { debounceMs = 400 }: { debounceMs?: number } = {}
): [T, (v: T | ((prev: T) => T)) => void, {
  clearDraft: () => void;
  isDirty: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}] {
  const dataKey = `draft:${key}`;
  const openKey = `draft:${key}:open`;

  // Restore data from localStorage on mount
  const [value, setValueRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(dataKey);
      if (stored) return JSON.parse(stored) as T;
    } catch { /* ignore */ }
    return initialValue;
  });

  // Restore open state
  const [isOpen, setIsOpenRaw] = useState<boolean>(() => {
    try {
      return localStorage.getItem(openKey) === "true";
    } catch { return false; }
  });

  const isDirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const valueRef = useRef(value);
  const hasRestoredRef = useRef(false);
  const clearedRef = useRef(false);

  // Keep valueRef in sync
  valueRef.current = value;

  // Show restore toast once on mount if there was saved data
  useEffect(() => {
    if (!hasRestoredRef.current) {
      hasRestoredRef.current = true;
      try {
        if (localStorage.getItem(dataKey)) {
          isDirtyRef.current = true;
          toast.info("Rascunho restaurado", { duration: 2000 });
        }
      } catch { /* ignore */ }
    }
  }, [dataKey]);

  // Persist to localStorage with debounce
  useEffect(() => {
    if (!isDirtyRef.current || clearedRef.current) return;
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(dataKey, JSON.stringify(value));
      } catch { /* quota exceeded */ }
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [value, dataKey, debounceMs]);

  // CRITICAL: Flush pending data synchronously on unmount
  // This prevents data loss when React Router unmounts the component during navigation
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && !clearedRef.current) {
        clearTimeout(timerRef.current);
        try {
          localStorage.setItem(dataKey, JSON.stringify(valueRef.current));
        } catch { /* ignore */ }
      }
    };
  }, [dataKey]);

  // Persist open state immediately (no debounce)
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenRaw(open);
    try {
      if (open) {
        localStorage.setItem(openKey, "true");
      } else {
        localStorage.removeItem(openKey);
      }
    } catch { /* ignore */ }
  }, [openKey]);

  const setValue = useCallback((v: T | ((prev: T) => T)) => {
    isDirtyRef.current = true;
    clearedRef.current = false;
    setValueRaw(v);
  }, []);

  const clearDraft = useCallback(() => {
    isDirtyRef.current = false;
    clearedRef.current = true;
    clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(dataKey);
      localStorage.removeItem(openKey);
    } catch { /* ignore */ }
    setValueRaw(initialValue);
    setIsOpenRaw(false);
  }, [dataKey, openKey, initialValue]);

  return [value, setValue, { clearDraft, isDirty: isDirtyRef.current, isOpen, setIsOpen }];
}
