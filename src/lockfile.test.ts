import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readLockfile, findSkills, listSkills, removeSkill } from './lockfile.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(import.meta.url.replace('file://', ''));

describe('lockfile', () => {
  it('should read skills-lock.json', async () => {
    const lockfile = await readLockfile(process.cwd());
    assert.ok(lockfile);
    assert.strictEqual(lockfile.version, 1);
    assert.ok(lockfile.skills);
  });

  it('should find skills matching keyword', async () => {
    const lockfile = await readLockfile(process.cwd());
    const matches = findSkills(lockfile, 'openclaw');
    assert.ok(matches.length >= 2, 'Should find at least 2 openclaw skills');
    assert.ok(matches.some(s => s.name === 'openclaw-config'));
    assert.ok(matches.some(s => s.name === 'openclaw-setup'));
  });

  it('should return empty array for no matches', async () => {
    const lockfile = await readLockfile(process.cwd());
    const matches = findSkills(lockfile, 'nonexistent-skill-xyz');
    assert.strictEqual(matches.length, 0);
  });

  it('should remove skill from lockfile', () => {
    const lockfile = {
      version: 1,
      skills: {
        'skill-a': { source: 'a/b', sourceType: 'github', computedHash: 'hash-a' },
        'skill-b': { source: 'c/d', sourceType: 'github', computedHash: 'hash-b' },
      },
    };
    const result = removeSkill(lockfile, 'skill-a');
    assert.ok(!result.skills['skill-a'], 'skill-a should be removed');
    assert.ok(result.skills['skill-b'], 'skill-b should remain');
  });

  it('should list all skills', async () => {
    const lockfile = await readLockfile(process.cwd());
    const skills = listSkills(lockfile);
    assert.ok(skills.length >= 2, 'Should have at least 2 skills');
  });
});
