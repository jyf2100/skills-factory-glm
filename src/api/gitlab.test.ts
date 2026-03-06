import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createGitLabClient } from '../gitlab.js';

describe('api/gitlab', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createGitLabClient for API routes', () => {
    it('should return null when GitLab is not configured', () => {
      process.env.GITLAB_URL = '';
      process.env.GITLAB_TOKEN = '';

      const client = createGitLabClient();
      assert.strictEqual(client, null);
    });

    it('should return null when token is missing', () => {
      process.env.GITLAB_URL = 'https://gitlab.example.com';
      process.env.GITLAB_TOKEN = '';

      const client = createGitLabClient();
      assert.strictEqual(client, null);
    });

    it('should create GitLab client when configured', () => {
      process.env.GITLAB_URL = 'https://gitlab.example.com';
      process.env.GITLAB_TOKEN = 'test-token';

      const client = createGitLabClient();
      assert.ok(client);
    });

    it('should create client with correct URL and token', () => {
      process.env.GITLAB_URL = 'https://gitlab.example.com';
      process.env.GITLAB_TOKEN = 'test-token-12345';

      const client = createGitLabClient();
      assert.ok(client);

      const baseUrl = (client as any).baseUrl;
      const token = (client as any).token;

      assert.strictEqual(baseUrl, 'https://gitlab.example.com');
      assert.strictEqual(token, 'test-token-12345');
    });

    it('should remove trailing slash from URL', () => {
      process.env.GITLAB_URL = 'https://gitlab.example.com/';
      process.env.GITLAB_TOKEN = 'test-token';

      const client = createGitLabClient();
      assert.ok(client);

      const baseUrl = (client as any).baseUrl;
      assert.strictEqual(baseUrl, 'https://gitlab.example.com');
    });
  });

  describe('API route file structure', () => {
    it('should have skills route file', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/skills/route.ts');
      assert.ok(stats.isFile());
    });

    it('should have search route file', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/search/route.ts');
      assert.ok(stats.isFile());
    });

    it('should have leaderboard route file', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/leaderboard/route.ts');
      assert.ok(stats.isFile());
    });

    it('should have skill detail route directory', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/skills/[id]/route.ts');
      assert.ok(stats.isFile());
    });
  });
});
