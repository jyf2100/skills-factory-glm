import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('frontend', () => {
  describe('Component files', () => {
    it('should have SearchBar component', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/components/SearchBar.tsx');
      assert.ok(stats.isFile());
    });

    it('should have SkillCard component', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/components/SkillCard.tsx');
      assert.ok(stats.isFile());
    });

    it('should have SkillList component', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/components/SkillList.tsx');
      assert.ok(stats.isFile());
    });
  });

  describe('Next.js routes', () => {
    it('should have page route', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/page.tsx');
      assert.ok(stats.isFile());
    });

    it('should have leaderboard route', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/leaderboard/page.tsx');
      assert.ok(stats.isFile());
    });

    it('should have admin route', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/admin/page.tsx');
      assert.ok(stats.isFile());
    });

    it('should have skill detail route', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/skills/[id]/page.tsx');
      assert.ok(stats.isFile());
    });
  });

  describe('API routes', () => {
    it('should have skills list API', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/skills/route.ts');
      assert.ok(stats.isFile());
    });

    it('should have search API', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/search/route.ts');
      assert.ok(stats.isFile());
    });

    it('should have leaderboard API', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/leaderboard/route.ts');
      assert.ok(stats.isFile());
    });

    it('should have admin sync API', async () => {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat('src/app/api/admin/sync/route.ts');
      assert.ok(stats.isFile());
    });
  });
});
