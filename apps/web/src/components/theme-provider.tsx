'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import {
  COLOR_SCHEME_KEY,
  DEFAULT_DENSITY,
  DEFAULT_MOTION,
  DEFAULT_PALETTE,
  DENSITY_KEY,
  MOTION_KEY,
  PALETTE_KEY,
  isDensity,
  isMotionPref,
  isPaletteId,
  type Density,
  type MotionPref,
  type PaletteId,
} from '@/lib/appearance';

type AppearanceSnapshot = {
  palette: PaletteId;
  density: Density;
  motion: MotionPref;
};

type AppearanceContextValue = AppearanceSnapshot & {
  setPalette: (palette: PaletteId) => void;
  setDensity: (density: Density) => void;
  setMotion: (motion: MotionPref) => void;
  cyclePalette: () => void;
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(
  undefined,
);

const DEFAULT_SNAPSHOT: AppearanceSnapshot = {
  palette: DEFAULT_PALETTE,
  density: DEFAULT_DENSITY,
  motion: DEFAULT_MOTION,
};

const listeners = new Set<() => void>();
let snapshot: AppearanceSnapshot = DEFAULT_SNAPSHOT;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return DEFAULT_SNAPSHOT;
}

function readStored<T>(
  key: string,
  guard: (value: unknown) => value is T,
  fallback: T,
): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  return guard(raw) ? raw : fallback;
}

function applyAppearance(next: AppearanceSnapshot) {
  const root = document.documentElement;
  root.setAttribute('data-palette', next.palette);
  root.setAttribute('data-density', next.density);
  if (next.motion === 'reduce') {
    root.setAttribute('data-motion', 'reduce');
  } else {
    root.removeAttribute('data-motion');
  }
}

function writeSnapshot(partial: Partial<AppearanceSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PALETTE_KEY, snapshot.palette);
    window.localStorage.setItem(DENSITY_KEY, snapshot.density);
    window.localStorage.setItem(MOTION_KEY, snapshot.motion);
    applyAppearance(snapshot);
  }
  emit();
}

function hydrateAppearance() {
  snapshot = {
    palette: readStored(PALETTE_KEY, isPaletteId, DEFAULT_PALETTE),
    density: readStored(DENSITY_KEY, isDensity, DEFAULT_DENSITY),
    motion: readStored(MOTION_KEY, isMotionPref, DEFAULT_MOTION),
  };
  applyAppearance(snapshot);
  emit();
}

function AppearanceInner({ children }: { children: ReactNode }) {
  const { resolvedTheme, theme } = useTheme();
  const appearance = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    hydrateAppearance();
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) return;
    const content =
      theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'light dark';
    meta.setAttribute('content', content);
    window.localStorage.setItem(COLOR_SCHEME_KEY, content);
    document.documentElement.style.colorScheme =
      resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [theme, resolvedTheme]);

  const setPalette = useCallback((next: PaletteId) => {
    writeSnapshot({ palette: next });
  }, []);

  const setDensity = useCallback((next: Density) => {
    writeSnapshot({ density: next });
  }, []);

  const setMotion = useCallback((next: MotionPref) => {
    writeSnapshot({ motion: next });
  }, []);

  const cyclePalette = useCallback(() => {
    const order: PaletteId[] = ['hivis', 'blueprint', 'steel', 'timber'];
    const next = order[(order.indexOf(snapshot.palette) + 1) % order.length];
    writeSnapshot({ palette: next });
  }, []);

  const value = useMemo(
    () => ({
      ...appearance,
      setPalette,
      setDensity,
      setMotion,
      cyclePalette,
    }),
    [appearance, setPalette, setDensity, setMotion, cyclePalette],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      <AppearanceInner>{children}</AppearanceInner>
    </NextThemesProvider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error('useAppearance must be used within a ThemeProvider');
  }
  return ctx;
}

export function withViewTransition(update: () => void) {
  const reduced =
    typeof document !== 'undefined' &&
    (document.documentElement.getAttribute('data-motion') === 'reduce' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduced || typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  document.startViewTransition(update);
}
