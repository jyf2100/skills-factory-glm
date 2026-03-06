import { NextRequest, NextResponse } from 'next/server';
import { createGitLabClient, type GitLabProject } from '../../../gitlab';

/**
 * GET /api/skills
 * List all skills from GitLab
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
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);

    let skills: GitLabProject[];

    if (search) {
      skills = await client.searchSkills(search, perPage);
    } else {
      skills = await client.listProjects({ per_page: perPage, page });
    }

    return NextResponse.json({
      skills,
      pagination: {
        page,
        per_page: perPage,
        total: skills.length,
      },
    });
  } catch (error) {
    console.error('Error fetching skills from GitLab:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
