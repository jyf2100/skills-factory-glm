/**
 * Publisher module for skills marketplace
 *
 * Handles publishing skills to the local repository with attestations and signatures
 */

import { spawn } from 'node:child_process';
import { createAttestation, type SkillAttestation } from './signing.js';

/**
 * Git operation result
 */
export interface GitResult {
  success: boolean;
  message: string;
  commitHash?: string;
}

/**
 * Execute a git command
 */
function execGit(cwd: string, args: string[]): Promise<GitResult> {
  return new Promise((resolve) => {
    const proc = spawn('git', args, { cwd });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: stdout.trim(), commitHash: stdout.trim() });
      } else {
        resolve({ success: false, message: stderr.trim() || stdout.trim() });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });
  });
}

/**
 * Initialize a git repository
 */
export async function gitInit(repoPath: string): Promise<GitResult> {
  const result = await execGit(repoPath, ['init']);
  if (result.success) {
    return { success: true, message: 'Git repository initialized' };
  }
  return result;
}

/**
 * Stage files for commit
 */
export async function gitAdd(repoPath: string, paths: string[]): Promise<GitResult> {
  const result = await execGit(repoPath, ['add', ...paths]);
  if (result.success) {
    return { success: true, message: 'Files staged' };
  }
  return result;
}

/**
 * Commit staged changes
 */
export async function gitCommit(repoPath: string, message: string): Promise<GitResult> {
  const result = await execGit(repoPath, ['commit', '-m', message]);
  if (result.success) {
    // Extract commit hash from output like "[main (root-commit) 5b7de2c]" or "[main 5b7de2c]"
    const match = result.message.match(/\[\S+\s+(?:\([^)]+\)\s+)?([a-f0-9]+)/);
    const commitHash = match ? match[1] : undefined;
    return { success: true, message: 'Changes committed', commitHash };
  }
  // Handle "nothing to commit" case
  if (result.message.includes('nothing to commit')) {
    return { success: true, message: 'Nothing to commit' };
  }
  return result;
}

/**
 * Skill record for tracking published skills
 */
export interface SkillRecord {
  skillId: string;
  version: string;
  sourceUrl: string;
  sourceCommit: string;
  hash: string;
  fetchedAt: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reviewer?: string;
  reviewedAt?: string;
}

/**
 * Index entry for skills-index.json
 */
export interface IndexEntry {
  skillId: string;
  version: string;
  description: string;
  riskLevel: string;
  publishedAt?: string;
}

/**
 * Skills index structure
 */
export interface SkillsIndex {
  version: number;
  skills: IndexEntry[];
}

/**
 * Extended attestation with review info
 */
export interface PublishedAttestation extends SkillAttestation {
  reviewedAt: string;
  publishedAt: string;
  hash: string;
  sourceCommit: string;
  riskLevel: string;
}

/**
 * Repository paths helper
 */
export interface RepositoryPaths {
  basePath: string;
  getSkillPath: (skillId: string, version: string) => string;
  getMetadataPath: (skillId: string, version: string) => string;
  getAttestationPath: (skillId: string, version: string) => string;
  getSignaturePath: (skillId: string, version: string) => string;
  getIndexPath: () => string;
}

/**
 * Create repository paths helper
 */
export function createRepository(basePath: string): RepositoryPaths {
  return {
    basePath,
    getSkillPath: (skillId, version) => `${basePath}/skills/${skillId}/${version}`,
    getMetadataPath: (skillId, version) => `${basePath}/metadata/${skillId}/${version}.json`,
    getAttestationPath: (skillId, version) => `${basePath}/attestations/${skillId}/${version}.json`,
    getSignaturePath: (skillId, version) => `${basePath}/signatures/${skillId}/${version}.sig`,
    getIndexPath: () => `${basePath}/index/skills-index.json`,
  };
}

/**
 * Generate attestation for a published skill
 */
export function generateAttestation(
  record: SkillRecord,
  reviewer: string,
  privateKeyHex: string
): PublishedAttestation {
  const now = new Date().toISOString();
  const baseAttestation = createAttestation(
    record.skillId,
    record.version,
    record.hash,
    record.sourceUrl,
    privateKeyHex,
    reviewer
  );

  return {
    ...baseAttestation,
    reviewedAt: record.reviewedAt || now,
    publishedAt: now,
    hash: record.hash,
    sourceCommit: record.sourceCommit,
    riskLevel: record.riskLevel,
  };
}

/**
 * Update the skills index with a new or updated skill
 */
export function updateIndex(
  existingIndex: SkillsIndex,
  newSkill: {
    skillId: string;
    version: string;
    description: string;
    riskLevel: string;
  }
): SkillsIndex {
  const existingIdx = existingIndex.skills.findIndex(
    (s) => s.skillId === newSkill.skillId
  );

  const entry: IndexEntry = {
    ...newSkill,
    publishedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    // Update existing entry
    const updated = [...existingIndex.skills];
    updated[existingIdx] = entry;
    return { ...existingIndex, skills: updated };
  } else {
    // Add new entry
    return { ...existingIndex, skills: [...existingIndex.skills, entry] };
  }
}
