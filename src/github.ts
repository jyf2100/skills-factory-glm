import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import type { RequestOptions } from 'node:https';

export interface GitHubSource {
  owner: string;
  repo: string;
  branch: string;
  skillPath: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/**
 * Parse a GitHub source string into components
 */
export function parseGitHubSource(source: string): GitHubSource {
  // Remove URL prefix if present
  let normalized = source.replace(/^https?:\/\/github\.com\//, '');
  normalized = normalized.replace(/\.git$/, '');

  const parts = normalized.split('/').filter(Boolean);

  if (parts.length < 2) {
    throw new Error(
      `Invalid GitHub source: "${source}". Expected format: owner/repo or owner/repo/path`
    );
  }

  return {
    owner: parts[0],
    repo: parts[1],
    branch: 'main',
    skillPath: parts.slice(2).join('/'),
  };
}

/**
 * Simple GitHub API client
 */
export class GitHubClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
  }

  private async fetch<T>(apiPath: string): Promise<T> {
    const headers: Record<string, string> = {
      'User-Agent': 'SkillsFactory/0.1.0',
      'Accept': 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options: RequestOptions = {
      hostname: 'api.github.com',
      path: apiPath,
      method: 'GET',
      headers,
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 404) {
            reject(new Error(`GitHub API: Not Found - ${apiPath}`));
            return;
          }
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`GitHub API error: ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Failed to parse GitHub response`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('GitHub API request timeout'));
      });
      req.end();
    });
  }

  /**
   * Get repository tree
   */
  async getTree(owner: string, repo: string, branch: string = 'main'): Promise<GitHubTreeItem[]> {
    const data = await this.fetch<{ tree: GitHubTreeItem[] }>(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );
    return data.tree;
  }

  /**
   * Download a file from raw GitHub content
   */
  async downloadFile(
    owner: string,
    repo: string,
    filePath: string,
    destPath: string,
    branch: string = 'main'
  ): Promise<void> {
    const headers: Record<string, string> = {
      'User-Agent': 'SkillsFactory/0.1.0',
    };

    const options: RequestOptions = {
      hostname: 'raw.githubusercontent.com',
      path: `/${owner}/${repo}/${branch}/${filePath}`,
      method: 'GET',
      headers,
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode === 404) {
          reject(new Error(`File not found: ${filePath}`));
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Failed to download: ${res.statusCode}`));
          return;
        }

        const dir = path.dirname(destPath);
        fs.mkdirSync(dir, { recursive: true });

        const file = fs.createWriteStream(destPath);
        res.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      });

      req.on('error', reject);
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('Download timeout'));
      });
      req.end();
    });
  }
}

export interface DownloadResult {
  skillName: string;
  files: string[];
}

/**
 * Download a skill from GitHub
 */
export async function downloadSkill(
  source: GitHubSource,
  destDir: string
): Promise<DownloadResult> {
  const client = new GitHubClient();
  const { owner, repo, branch, skillPath } = source;

  // Get repository tree
  let tree: GitHubTreeItem[];
  try {
    tree = await client.getTree(owner, repo, branch);
  } catch (error) {
    throw new Error(
      `Failed to fetch repository tree: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Filter files for the skill path
  const basePath = skillPath ? `${skillPath}/` : '';
  const skillFiles = tree.filter(
    (item) =>
      item.type === 'blob' &&
      (skillPath ? item.path.startsWith(basePath) : item.path.includes('SKILL.md'))
  );

  if (skillFiles.length === 0) {
    throw new Error(`No files found in ${owner}/${repo}/${skillPath || '(root)'}`);
  }

  // Determine skill name from SKILL.md or path
  let skillName = '';
  const skillMdPath = skillFiles.find((f) => f.path.endsWith('SKILL.md'))?.path;
  if (skillMdPath) {
    const parts = skillMdPath.split('/');
    const skillMdIndex = parts.findIndex((p) => p === 'SKILL.md');
    if (skillMdIndex > 0) {
      skillName = parts[skillMdIndex - 1];
    } else if (skillPath) {
      skillName = path.basename(skillPath);
    } else {
      skillName = repo;
    }
  } else {
    skillName = skillPath ? path.basename(skillPath) : repo;
  }

  // Create destination directory
  const skillDestDir = path.join(destDir, skillName);
  fs.mkdirSync(skillDestDir, { recursive: true });

  // Download all files
  const downloadedFiles: string[] = [];
  for (const file of skillFiles) {
    const relativePath = skillPath ? file.path.slice(basePath.length) : file.path;
    const destPath = path.join(skillDestDir, relativePath);

    try {
      await client.downloadFile(owner, repo, file.path, destPath, branch);
      downloadedFiles.push(relativePath);
    } catch (error) {
      console.error(`Warning: Failed to download ${file.path}: ${error}`);
    }
  }

  return { files: downloadedFiles, skillName };
}
