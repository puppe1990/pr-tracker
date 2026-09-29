export type ColorScheme = 'dark' | 'light';

export const COLOR_SCHEME_STORAGE_KEY = 'pr-tracker-color-scheme';

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface ThemeRoot {
  setAttribute(name: string, value: string): void;
}

export function readStoredColorScheme(storage: KeyValueStore): ColorScheme {
  return storage.getItem(COLOR_SCHEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

export function applyColorScheme(
  scheme: ColorScheme,
  root: ThemeRoot,
  storage: KeyValueStore
): void {
  root.setAttribute('data-theme', scheme);
  storage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
}

export function toggleColorScheme(scheme: ColorScheme): ColorScheme {
  return scheme === 'dark' ? 'light' : 'dark';
}
