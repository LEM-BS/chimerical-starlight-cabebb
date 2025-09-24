export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeMode = 'light' | 'dark';

export interface StorageLike {
  getItem(key: string): string | null | undefined;
  setItem(key: string, value: string): void;
}

export const THEME_STORAGE_KEY = 'theme-preference';

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

export const parseThemePreference = (value: unknown): ThemePreference =>
  (isThemePreference(value) ? value : 'system');

export const getNextTheme = (current: ThemePreference): ThemePreference => {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
};

export const resolveTheme = (preference: ThemePreference, systemPrefersDark: boolean): ThemeMode => {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
};

export interface ApplyThemeOptions {
  storageKey?: string;
  systemPrefersDark?: boolean;
}

type ClassList = Pick<DOMTokenList, 'add' | 'remove'>;

type RootElement = { classList: ClassList };

export const applyTheme = (
  preference: ThemePreference,
  root: RootElement,
  storage: StorageLike,
  options: ApplyThemeOptions = {},
): ThemeMode => {
  const { storageKey = THEME_STORAGE_KEY, systemPrefersDark = false } = options;
  const resolved = resolveTheme(preference, systemPrefersDark);
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);

  try {
    storage.setItem(storageKey, preference);
  } catch {
    // ignore persistence failures
  }

  return resolved;
};

export const getStoredTheme = (
  storage: StorageLike,
  storageKey: string = THEME_STORAGE_KEY,
): ThemePreference => {
  try {
    const stored = storage.getItem(storageKey);
    return parseThemePreference(stored ?? undefined);
  } catch {
    return 'system';
  }
};
