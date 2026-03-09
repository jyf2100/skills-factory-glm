/**
 * GitLab API Client
 *
 * Provides methods to interact with GitLab API for managing skills.
 */

export interface GitLabProject {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  web_url: string;
  last_activity_at?: string;
  created_at: string;
  star_count: number;
  forks_count: number;
}

export interface GitLabFile {
  id: string;
  name: string;
  type: string;
  path: string;
  mode: string;
}

export interface GitLabFileContent {
  file_name: string;
  file_path: string;
  size: number;
  encoding: string;
  content: string;
  content_sha256: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  last_commit_id: string;
}

export interface GitLabConfig {
  gitlabUrl?: string;
  gitlabToken?: string;
  gitlabSkillsProject?: string;
}

/**
 * GitLab API Client class
 */
export class GitLabClient {
  private _baseUrl: string;
  private _token: string;

  constructor(baseUrl: string, token: string) {
    // Remove trailing slash if present
    this._baseUrl = baseUrl.replace(/\/$/, '');
    this._token = token;
  }

  // Getters for testing
  get baseUrl(): string {
    return this._baseUrl;
  }

  get token(): string {
    return this._token;
  }

  /**
   * Build full API URL from endpoint path
   */
  buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Build project-specific URL
   */
  buildProjectUrl(projectPath: string): string {
    const encodedProject = encodeURIComponent(projectPath);
    return this.buildUrl(`/api/v4/projects/${encodedProject}`);
  }

  /**
   * Make authenticated API request
   */
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = this.buildUrl(endpoint);
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * List projects
   */
  async listProjects(params: {
    search?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<GitLabProject[]> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.page) queryParams.append('page', params.page.toString());

    const endpoint = `/api/v4/projects?${queryParams.toString()}`;
    const response = await this.fetch(endpoint);

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId: string, ref: string = 'main'): Promise<GitLabFile[]> {
    const endpoint = `/api/v4/projects/${encodeURIComponent(projectId)}/repository/tree?ref=${ref}&per_page=100`;
    const response = await this.fetch(endpoint);

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get file content
   */
  async getFileContent(projectId: string, filePath: string, ref: string = 'main'): Promise<string> {
    const endpoint = `/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}?ref=${ref}`;
    const response = await this.fetch(endpoint);

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    const data: GitLabFileContent = await response.json();
    // GitLab returns base64 encoded content
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  /**
   * Get SKILL.md content from a project
   */
  async getSkillContent(projectId: string, ref: string = 'main'): Promise<string> {
    return this.getFileContent(projectId, 'SKILL.md', ref);
  }

  /**
   * Search for projects/skills
   */
  async searchSkills(keyword: string, perPage: number = 20): Promise<GitLabProject[]> {
    return this.listProjects({ search: keyword, per_page: perPage });
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<GitLabProject> {
    const endpoint = `/api/v4/projects/${encodeURIComponent(projectId)}`;
    const response = await this.fetch(endpoint);

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Create GitLab client from environment variables
 */
export function createGitLabClient(): GitLabClient | null {
  const url = process.env.GITLAB_URL;
  const token = process.env.GITLAB_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new GitLabClient(url, token);
}
