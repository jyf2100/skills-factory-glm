import fs from 'node:fs';
import path from 'node:path';

export interface SkillEntry {
  source: string;
  sourceType: string;
  computedHash: string;
}

export interface Lockfile {
  version: number;
  skills: Record<string, SkillEntry>;
}

export interface SkillInfo {
  name: string;
  entry: SkillEntry;
}

const LOCKFILE_NAME = 'skills-lock.json';

/**
 * Read the skills-lock.json file from a directory
 */
export async function readLockfile(baseDir: string): Promise<Lockfile> {
  const lockPath = path.join(baseDir, LOCKFILE_NAME);

  if (!fs.existsSync(lockPath)) {
    return { version: 1, skills: {} };
  }

  const content = await fs.promises.readFile(lockPath, 'utf-8');
  return JSON.parse(content) as Lockfile;
}

/**
 * Write the skills-lock.json file
 */
export async function writeLockfile(baseDir: string, lockfile: Lockfile): Promise<void> {
  const lockPath = path.join(baseDir, LOCKFILE_NAME);
  await fs.promises.writeFile(lockPath, JSON.stringify(lockfile, null, 2) + '\n', 'utf-8');
}

/**
 * Find skills matching a keyword (searches in name and source)
 */
export function findSkills(lockfile: Lockfile, keyword: string): SkillInfo[] {
  const lowerKeyword = keyword.toLowerCase();
  const results: SkillInfo[] = [];

  for (const [name, entry] of Object.entries(lockfile.skills)) {
    const nameMatch = name.toLowerCase().includes(lowerKeyword);
    const sourceMatch = entry.source.toLowerCase().includes(lowerKeyword);

    if (nameMatch || sourceMatch) {
      results.push({ name, entry });
    }
  }

  return results;
}

/**
 * List all installed skills
 */
export function listSkills(lockfile: Lockfile): SkillInfo[] {
  return Object.entries(lockfile.skills).map(([name, entry]) => ({
    name,
    entry,
  }));
}

/**
 * Add or update a skill in the lockfile
 */
export function addSkill(
  lockfile: Lockfile,
  name: string,
  entry: SkillEntry
): Lockfile {
  return {
    ...lockfile,
    skills: {
      ...lockfile.skills,
      [name]: entry,
    },
  };
}

/**
 * Remove a skill from the lockfile
 */
export function removeSkill(lockfile: Lockfile, name: string): Lockfile {
  const { [name]: removed, ...remaining } = lockfile.skills;
  return {
    ...lockfile,
    skills: remaining,
  };
}
