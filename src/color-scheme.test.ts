import { describe, expect, it } from 'vitest';
import { applyColorScheme, readStoredColorScheme, toggleColorScheme } from './color-scheme';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('readStoredColorScheme', () => {
  it('defaults to dark when storage is empty', () => {
    expect(readStoredColorScheme(new MemoryStorage())).toBe('dark');
  });

  it('returns light when storage has light', () => {
    const storage = new MemoryStorage();
    storage.setItem('pr-tracker-color-scheme', 'light');
    expect(readStoredColorScheme(storage)).toBe('light');
  });

  it('returns dark for unknown stored values', () => {
    const storage = new MemoryStorage();
    storage.setItem('pr-tracker-color-scheme', 'sepia');
    expect(readStoredColorScheme(storage)).toBe('dark');
  });
});

class MemoryRoot {
  private attributes = new Map<string, string>();

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
}

describe('applyColorScheme', () => {
  it('sets data-theme and persists the scheme', () => {
    const storage = new MemoryStorage();
    const root = new MemoryRoot();
    applyColorScheme('light', root, storage);

    expect(root.getAttribute('data-theme')).toBe('light');
    expect(storage.getItem('pr-tracker-color-scheme')).toBe('light');
  });
});

describe('toggleColorScheme', () => {
  it('switches dark to light and light to dark', () => {
    expect(toggleColorScheme('dark')).toBe('light');
    expect(toggleColorScheme('light')).toBe('dark');
  });
});
