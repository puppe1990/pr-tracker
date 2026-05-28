import { describe, expect, it } from 'vitest';
import { getVisibleRecentRepos, type RecentRepo } from './recent-repos';

const repos: RecentRepo[] = [
  {
    full_name: 'org/zebra',
    name: 'zebra',
    owner: { login: 'org', avatar_url: '' },
    description: 'third repo',
    updated_at: '2024-01-01T10:00:00Z',
    html_url: 'https://github.com/org/zebra',
  },
  {
    full_name: 'other/charlie',
    name: 'charlie',
    owner: { login: 'other', avatar_url: '' },
    description: 'fourth repo',
    updated_at: '2024-01-04T10:00:00Z',
    html_url: 'https://github.com/other/charlie',
  },
  {
    full_name: 'org/alpha',
    name: 'alpha',
    owner: { login: 'org', avatar_url: '' },
    description: 'first repo',
    updated_at: '2024-01-03T10:00:00Z',
    html_url: 'https://github.com/org/alpha',
  },
  {
    full_name: 'org/bravo',
    name: 'bravo',
    owner: { login: 'org', avatar_url: '' },
    description: 'second repo',
    updated_at: '2024-01-02T10:00:00Z',
    html_url: 'https://github.com/org/bravo',
  },
];

describe('getVisibleRecentRepos', () => {
  it('orders repos by most recent update', () => {
    const result = getVisibleRecentRepos(repos, '', 'all', 'all', 1, 2);

    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
    expect(result.items.map((repo) => repo.name)).toEqual(['charlie', 'alpha']);
  });

  it('filters repos by search term', () => {
    const result = getVisibleRecentRepos(repos, 'zeb', 'all', 'all', 1, 10);

    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items.map((repo) => repo.name)).toEqual(['zebra']);
  });

  it('filters repos by organization', () => {
    const result = getVisibleRecentRepos(repos, '', 'org', 'all', 1, 10);

    expect(result.total).toBe(3);
    expect(result.items.map((repo) => repo.full_name)).toEqual([
      'org/alpha',
      'org/bravo',
      'org/zebra',
    ]);
  });

  it('filters repos by selected repository', () => {
    const result = getVisibleRecentRepos(repos, '', 'org', 'org/bravo', 1, 10);

    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items.map((repo) => repo.name)).toEqual(['bravo']);
  });

  it('returns the requested page', () => {
    const result = getVisibleRecentRepos(repos, '', 'all', 'all', 2, 2);

    expect(result.page).toBe(2);
    expect(result.items.map((repo) => repo.name)).toEqual(['bravo', 'zebra']);
  });
});
