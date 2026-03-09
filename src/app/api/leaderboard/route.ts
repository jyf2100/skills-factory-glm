import { NextRequest, NextResponse } from 'next/server';
import { createGitLabClient, type GitLabProject } from '@/gitlab';

/**
 * GET /api/leaderboard
 * Get skill leaderboard
 *
 * Query params:
 * - type: 'all-time' | 'trending' | 'hot' (default: 'all-time')
 * - per_page: number (default: 20)
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
    const type = searchParams.get('type') || 'all-time';
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);

    let skills: GitLabProject[];
    let sortBy: keyof GitLabProject;

    switch (type) {
      case 'trending':
        // Sort by last_activity_at (most recently updated)
        skills = await client.listProjects({ per_page: 100 });
        sortBy = 'last_activity_at';
        break;
      case 'hot':
        // Sort by star_count (most stars in recent period)
        skills = await client.listProjects({ per_page: 100 });
        sortBy = 'star_count';
        break;
      case 'all-time':
      default:
        // Sort by star_count (most stars overall)
        skills = await client.listProjects({ per_page: 100 });
        sortBy = 'star_count';
        break;
    }

    // Sort skills
    const sortedSkills = skills
      .filter(skill => skill.name) // Only include projects with names
      .sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return bVal.localeCompare(aVal); // Descending for dates
        }
        return (bVal as number) - (aVal as number); // Descending for numbers
      })
      .slice(0, perPage);

    return NextResponse.json({
      type,
      skills: sortedSkills.map((skill, index) => ({
        rank: index + 1,
        id: skill.id,
        name: skill.name,
        path: skill.path,
        path_with_namespace: skill.path_with_namespace,
        description: skill.description,
        web_url: skill.web_url,
        star_count: skill.star_count,
        forks_count: skill.forks_count,
        last_activity_at: skill.last_activity_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching leaderboard from GitLab:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
