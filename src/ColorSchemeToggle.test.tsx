import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ColorSchemeToggle } from './ColorSchemeToggle';

describe('ColorSchemeToggle', () => {
  it('offers light mode when the scheme is dark', () => {
    const html = renderToString(<ColorSchemeToggle scheme="dark" onToggle={() => {}} />);
    expect(html).toContain('Ativar modo claro');
  });

  it('offers dark mode when the scheme is light', () => {
    const html = renderToString(<ColorSchemeToggle scheme="light" onToggle={() => {}} />);
    expect(html).toContain('Ativar modo escuro');
  });
});
