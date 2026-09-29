import type { Context } from '@netlify/functions';
import { fetchAllSearchIssues, getConfiguredGithubToken } from './lib/github.mts';

export default async (_req: Request, _context: Context) => {
  try {
    const token = getConfiguredGithubToken();
    const items = await fetchAllSearchIssues<unknown>('is:open is:issue author:@me', token);
    return Response.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === 'GitHub token not configured') {
      return Response.json(
        {
          error: 'GitHub token not configured',
          missingEnv: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        },
        { status: 503 }
      );
    }

    console.error('Netlify issues function error:', error);
    return Response.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
};
