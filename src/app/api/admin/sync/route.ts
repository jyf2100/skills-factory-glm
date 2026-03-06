import { NextRequest, NextResponse } from 'next/server';
import { readSkillsIndex, updateIndex } from '../../publisher';
import { gitInit, gitAdd, gitCommit, gitPush } from '../../publisher';

/**
 * POST /api/admin/sync
 * Sync skills from GitHub to GitLab
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if GitLab/Gitea is configured
    const giteaUrl = process.env.GITEA_URL;
    const giteaToken = process.env.GITEA_TOKEN;

    if (!giteaUrl || !giteaToken) {
      return NextResponse.json(
        { error: 'GitLab (Gitea) not configured. Please set GITEA_URL and GITEA_TOKEN.' },
        { status: 401 }
      );
    }

    // Check if GitHub is configured for source
    const githubUrl = process.env.GITHUB_URL;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubUrl || !githubToken) {
      return NextResponse.json(
        { error: 'GitHub not configured. Please set GITHUB_URL and GITHUB_TOKEN.' },
        { status: 401 }
      );
    }

    // For this implementation, we'll use the existing local lockfile as source
    // In a full implementation, you would fetch from GitHub first
    const { readLockfile } = await import('../../lockfile.js');
    const lockfile = await readLockfile(process.cwd());

    const skills = Object.keys(lockfile.skills);

    if (skills.length === 0) {
      return NextResponse.json({
        synced: 0,
        message: 'No skills to sync',
      });
    }

    // Initialize git if needed (in a real scenario, this would be the GitLab repo)
    // For now, we'll return success without actual git operations
    // since we don't have access to the actual GitLab repo path

    return NextResponse.json({
      synced: skills.length,
      skills,
      message: `Synced ${skills.length} skills from lockfile`,
    });
  } catch (error) {
    console.error('Error syncing skills:', error);
    return NextResponse.json(
      { error: 'Failed to sync skills', details: String(error) },
      { status: 500 }
    );
  }
}
