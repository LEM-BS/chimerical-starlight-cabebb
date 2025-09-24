import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyTheme,
  getNextTheme,
  getStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '../src/utils/theme';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  clear() {
    this.store.clear();
  }
}

describe('theme utilities', () => {
  let root: HTMLElement;
  let storage: MemoryStorage;

  beforeEach(() => {
    root = document.createElement('div');
    storage = new MemoryStorage();
  });

  it('cycles through theme preferences', () => {
    expect(getNextTheme('system')).toBe('light');
    expect(getNextTheme('light')).toBe('dark');
    expect(getNextTheme('dark')).toBe('system');
  });

  it('applies explicit light mode', () => {
    const result = applyTheme('light', root, storage, { systemPrefersDark: true });
    expect(result).toBe('light');
    expect(root.classList.contains('light')).toBe(true);
    expect(root.classList.contains('dark')).toBe(false);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('applies explicit dark mode', () => {
    const result = applyTheme('dark', root, storage, { systemPrefersDark: false });
    expect(result).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.classList.contains('light')).toBe(false);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('resolves system theme to dark when system prefers dark', () => {
    const result = applyTheme('system', root, storage, { systemPrefersDark: true });
    expect(result).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('resolves system theme to light when system prefers light', () => {
    const result = applyTheme('system', root, storage, { systemPrefersDark: false });
    expect(result).toBe('light');
    expect(root.classList.contains('light')).toBe(true);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('guards against invalid stored values', () => {
    storage.setItem(THEME_STORAGE_KEY, 'unexpected');
    const stored = getStoredTheme(storage as unknown as Storage, THEME_STORAGE_KEY);
    expect(stored).toBe('system');
  });

  it('resolves theme preference helper correctly', () => {
    const values: Array<[ThemePreference, boolean, 'light' | 'dark']> = [
      ['light', true, 'light'],
      ['dark', false, 'dark'],
      ['system', true, 'dark'],
      ['system', false, 'light'],
    ];

    for (const [preference, prefersDark, expected] of values) {
      expect(resolveTheme(preference, prefersDark)).toBe(expected);
    }
  });
});
