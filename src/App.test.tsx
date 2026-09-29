import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import RecentRepos from './RecentRepos';
import Issues from './Issues';

describe('App recent repos tab', () => {
  it('renders the recent repos screen and nav entry', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/repos-recentes']}>
        <RecentRepos />
      </MemoryRouter>
    );

    expect(html).toContain('Repos recentes');
    expect(html).toContain('Repositórios com commit mais recente');
  });
});

describe('App issues tab', () => {
  it('renders the issues screen', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/issues']}>
        <Issues />
      </MemoryRouter>
    );

    expect(html).toContain('Issues');
    expect(html).toContain('Listando issues abertas por você');
  });
});
