/**
 * Publisher module for skills marketplace
 *
 * Handles publishing skills to the local repository with attestations and signatures
 */

import { createAttestation, type SkillAttestation } from './signing.js';

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
