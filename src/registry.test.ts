import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readRegistry, searchRegistry, listAllSkills } from './registry.js';

describe('registry', () => {
  it('should read skills-registry.json', async () => {
    const registry = await readRegistry(process.cwd());
    assert.ok(registry);
    assert.ok(registry.skills.length > 0);
  });

  it('should search skills by keyword', async () => {
    const registry = await readRegistry(process.cwd());
    const matches = searchRegistry(registry, 'openclaw');
    assert.ok(matches.length >= 2, 'Should find at least 2 openclaw skills');
  });

  it('should return empty array for no matches', async () => {
    const registry = await readRegistry(process.cwd());
    const matches = searchRegistry(registry, 'nonexistent-xyz-abc');
    assert.strictEqual(matches.length, 0);
  });

  it('should search by description content', async () => {
    const registry = await readRegistry(process.cwd());
    const matches = searchRegistry(registry, 'configuration');
    assert.ok(matches.length >= 1);
  });

  it('should list all skills', async () => {
    const registry = await readRegistry(process.cwd());
    const all = listAllSkills(registry);
    assert.strictEqual(all.length, registry.skills.length);
  });
});
