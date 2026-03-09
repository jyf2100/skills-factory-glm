import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  getConfig,
  getGiteaAuth,
  type Config,
} from './config.js';

describe('config', () => {
  let originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Save original environment variables
    originalEnv.GITEA_URL = process.env.GITEA_URL;
    originalEnv.GITEA_TOKEN = process.env.GITEA_TOKEN;
    // Clear for tests
    delete process.env.GITEA_URL;
    delete process.env.GITEA_TOKEN;
  });

  afterEach(() => {
    // Restore original environment variables
    if (originalEnv.GITEA_URL !== undefined) {
      process.env.GITEA_URL = originalEnv.GITEA_URL;
    }
    if (originalEnv.GITEA_TOKEN !== undefined) {
      process.env.GITEA_TOKEN = originalEnv.GITEA_TOKEN;
    }
    originalEnv = {};
  });
});

// Test with environment isolation
describe('config with env isolation', () => {
  let originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Save original environment variables
    originalEnv.GITEA_URL = process.env.GITEA_URL;
    originalEnv.GITEA_TOKEN = process.env.GITEA_TOKEN;
    // Clear for tests
    delete process.env.GITEA_URL;
    delete process.env.GITEA_TOKEN;
  });

  afterEach(() => {
    // Restore original environment variables
    if (originalEnv.GITEA_URL !== undefined) {
      process.env.GITEA_URL = originalEnv.GITEA_URL;
    }
    if (originalEnv.GITEA_TOKEN !== undefined) {
      process.env.GITEA_TOKEN = originalEnv.GITEA_TOKEN;
    }
    originalEnv = {};
  });

  describe('getConfig', () => {
    it('should return default config when no env vars set', () => {
      const config = getConfig();

      assert.strictEqual(config.giteaUrl, '');
      assert.strictEqual(config.giteaToken, '');
      assert.strictEqual(config.hasRemote, false);
    });

    it('should read config from environment variables', () => {
      process.env.GITEA_URL = 'https://gitea.example.com/skills.git';
      process.env.GITEA_TOKEN = 'test-token';

      const config = getConfig();

      assert.strictEqual(config.giteaUrl, 'https://gitea.example.com/skills.git');
      assert.strictEqual(config.giteaToken, 'test-token');
      assert.strictEqual(config.hasRemote, true);
    });
  });

  describe('getGiteaAuth', () => {
    it('should return null when no token configured', () => {
      process.env.GITEA_URL = 'https://gitea.example.com/skills.git';
      process.env.GITEA_TOKEN = '';

      const auth = getGiteaAuth();

      assert.strictEqual(auth, null);
    });

    it('should return auth URL when token is configured', () => {
      process.env.GITEA_URL = 'https://gitea.example.com/skills.git';
      process.env.GITEA_TOKEN = 'test-token';

      const auth = getGiteaAuth();

      assert.strictEqual(auth, 'https://test-token@gitea.example.com/skills.git');
    });
  });

  describe('Config validation', () => {
    it('should validate Gitea URL format', () => {
      process.env.GITEA_URL = 'https://gitea.example.com/skills.git';
      process.env.GITEA_TOKEN = 'test-token';

      const config = getConfig();

      // Valid URL with .git extension
      assert.strictEqual(config.giteaUrl, 'https://gitea.example.com/skills.git');
      assert.strictEqual(config.hasRemote, true);
      assert.strictEqual(config.isValid, true);
    });

    it('should reject URL without .git extension', () => {
      process.env.GITEA_URL = 'https://gitea.example.com/skills';

      const config = getConfig();

      // URL without .git extension should have warning
      assert.strictEqual(config.giteaUrl, 'https://gitea.example.com/skills');
      assert.strictEqual(config.isValid, false);
    });
  });
});
