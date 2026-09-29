import { describe, expect, it } from 'vitest';
import {
  getIssueRepoName,
  getIssueRepoOwner,
  getVisibleIssues,
  type TrackerIssue,
} from './issues-list';

const issues: TrackerIssue[] = [
  {
    id: 1,
    title: 'Fix login timeout',
    html_url: 'https://github.com/org/alpha/issues/1',
    created_at: '2024-01-03T10:00:00Z',
    repository_url: 'https://api.github.com/repos/org/alpha',
    user: { login: 'alice', avatar_url: '' },
    labels: [{ name: 'bug', color: 'd73a4a' }],
    state: 'open',
  },
  {
    id: 2,
    title: 'Add dark mode',
    html_url: 'https://github.com/org/bravo/issues/2',
    created_at: '2024-01-02T10:00:00Z',
    repository_url: 'https://api.github.com/repos/org/bravo',
    user: { login: 'bob', avatar_url: '' },
    labels: [{ name: 'enhancement', color: 'a2eeef' }],
    state: 'open',
  },
  {
    id: 3,
    title: 'Update docs',
    html_url: 'https://github.com/other/charlie/issues/3',
    created_at: '2024-01-01T10:00:00Z',
    repository_url: 'https://api.github.com/repos/other/charlie',
    user: { login: 'carol', avatar_url: '' },
    labels: [],
    state: 'open',
  },
];

describe('issue repository URL helpers', () => {
  it('reads owner and name from the GitHub repository URL', () => {
    const url = 'https://api.github.com/repos/org/alpha';
    expect(getIssueRepoOwner(url)).toBe('org');
    expect(getIssueRepoName(url)).toBe('alpha');
  });
});

describe('getVisibleIssues', () => {
  it('filters issues by title or repository name', () => {
    const result = getVisibleIssues(issues, 'login', 'all', 'all', 1, 10);

    expect(result.total).toBe(1);
    expect(result.items.map((issue) => issue.id)).toEqual([1]);
  });

  it('filters issues by repository name', () => {
    const result = getVisibleIssues(issues, '', 'bravo', 'all', 1, 10);

    expect(result.total).toBe(1);
    expect(result.items.map((issue) => issue.id)).toEqual([2]);
  });

  it('filters issues by label', () => {
    const result = getVisibleIssues(issues, '', 'all', 'bug', 1, 10);

    expect(result.total).toBe(1);
    expect(result.items.map((issue) => issue.id)).toEqual([1]);
  });

  it('returns the requested page after filtering', () => {
    const result = getVisibleIssues(issues, '', 'all', 'all', 2, 1);

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.items.map((issue) => issue.id)).toEqual([2]);
  });
});
