import { NextRequest, NextResponse } from 'next/server';
import { createGitLabClient } from '@/gitlab';

/**
 * GET /api/skills/:id
 * Get skill details from GitLab
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const client = createGitLabClient();

  if (!client) {
    return NextResponse.json(
      { error: 'GitLab not configured' },
      { status: 401 }
    );
  }

  try {
    const skillId = params.id;
    const project = await client.getProject(skillId);

    // Get SKILL.md content
    let skillContent: string | null = null;
    try {
      skillContent = await client.getSkillContent(skillId);
    } catch (error) {
      console.warn(`SKILL.md not found for ${skillId}`);
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      path: project.path,
      path_with_namespace: project.path_with_namespace,
      description: project.description,
      web_url: project.web_url,
      created_at: project.created_at,
      last_activity_at: project.last_activity_at,
      star_count: project.star_count,
      forks_count: project.forks_count,
      content: skillContent,
    });
  } catch (error) {
    console.error('Error fetching skill details from GitLab:', error);
    return NextResponse.json(
      { error: 'Skill not found' },
      { status: 404 }
    );
  }
}
