import { NextRequest, NextResponse } from 'next/server';
import { createGitLabClient, type GitLabProject } from '../../gitlab';

/**
 * GET /api/search
 * Search for skills by keyword
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = createGitLabClient();

  if (!client) {
    return NextResponse.json(
      { error: 'GitLab not configured' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('q') || '';

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing search query' },
        { status: 400 }
      );
    }

    const perPage = parseInt(searchParams.get('per_page') || '20', 10);
    const skills: GitLabProject[] = await client.searchSkills(keyword, perPage);

    return NextResponse.json({
      query: keyword,
      results: skills,
      total: skills.length,
    });
  } catch (error) {
    console.error('Error searching skills from GitLab:', error);
    return NextResponse.json(
      { error: 'Failed to search skills' },
      { status: 500 }
    );
  }
}
