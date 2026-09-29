import { Moon, Sun } from 'lucide-react';
import type { ColorScheme } from './color-scheme';

interface ColorSchemeToggleProps {
  scheme: ColorScheme;
  onToggle: () => void;
}

export function ColorSchemeToggle({ scheme, onToggle }: ColorSchemeToggleProps) {
  const isLight = scheme === 'light';

  return (
    <button
      type="button"
      aria-label={isLight ? 'Ativar modo escuro' : 'Ativar modo claro'}
      onClick={onToggle}
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-muted text-fg-muted hover:text-fg-strong hover:border-blue-500 transition-colors"
    >
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
