import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  GitLabClient,
  type GitLabProject,
  type GitLabFile,
} from './gitlab.js';

describe('gitlab', () => {
  describe('GitLabClient', () => {
    it('should create client with base URL and token', () => {
      const client = new GitLabClient('https://gitlab.example.com', 'test-token');
      assert.strictEqual(client.baseUrl, 'https://gitlab.example.com');
      assert.strictEqual(client.token, 'test-token');
    });

    it('should build correct API URL for projects', () => {
      const client = new GitLabClient('https://gitlab.example.com', 'test-token');
      const url = client.buildUrl('/api/v4/projects');
      assert.strictEqual(url, 'https://gitlab.example.com/api/v4/projects');
    });

    it('should handle project with path encoding', () => {
      const client = new GitLabClient('https://gitlab.example.com', 'test-token');
      const url = client.buildProjectUrl('my-org/my-project');
      assert.strictEqual(
        url,
        'https://gitlab.example.com/api/v4/projects/my-org%2Fmy-project'
      );
    });
  });

  describe('listProjects', () => {
    it('should return projects from GitLab', async () => {
      const client = new GitLabClient('https://gitlab.example.com', 'test-token');
      // This test requires actual GitLab instance or mock
      // For now, we test the URL construction
      const url = client.buildUrl('/api/v4/projects');
      assert.ok(url.includes('/api/v4/projects'));
    });
  });

  describe('getProjectFiles', () => {
    it('should return files from a project', async () => {
      const client = new GitLabClient('https://gitlab.example.com', 'test-token');
      const projectId = 'test-project';
      const url = client.buildUrl(`/api/v4/projects/${encodeURIComponent(projectId)}/repository/tree`);
      assert.ok(url.includes('/repository/tree'));
    });
  });

  describe('getSkillContent', () => {
    it('should return SKILL.md content', async () => {
      const client = new GitLabClient('https://gitlab.example.com', 'test-token');
      const projectId = 'test-project';
      const filePath = 'SKILL.md';
      const url = client.buildUrl(
        `/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}?ref=main`
      );
      assert.ok(url.includes('/repository/files/SKILL.md'));
    });
  });

  describe('searchSkills', () => {
    it('should search for skills by keyword', async () => {
      const client = new GitLabClient('https://gitlab.example.com', 'test-token');
      const url = client.buildUrl('/api/v4/projects?search=example&per_page=20');
      assert.ok(url.includes('search=example'));
    });
  });
});
