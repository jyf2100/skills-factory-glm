import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readLockfile, findSkills } from './lockfile.js';
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
});
