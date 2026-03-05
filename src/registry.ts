import fs from 'node:fs';
import path from 'node:path';

export interface RegistrySkill {
  name: string;
  source: string;
  description: string;
  keywords: string[];
}

export interface Registry {
  version: number;
  skills: RegistrySkill[];
}

const REGISTRY_FILE = 'skills-registry.json';

/**
 * Read the skills registry file
 */
export async function readRegistry(baseDir: string): Promise<Registry> {
  const registryPath = path.join(baseDir, REGISTRY_FILE);

  if (!fs.existsSync(registryPath)) {
    return { version: 1, skills: [] };
  }

  const content = await fs.promises.readFile(registryPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Search skills in registry by keyword
 */
export function searchRegistry(registry: Registry, keyword: string): RegistrySkill[] {
  const lowerKeyword = keyword.toLowerCase();

  return registry.skills.filter(skill => {
    const nameMatch = skill.name.toLowerCase().includes(lowerKeyword);
    const descMatch = skill.description.toLowerCase().includes(lowerKeyword);
    const keywordMatch = skill.keywords.some(k => k.toLowerCase().includes(lowerKeyword));

    return nameMatch || descMatch || keywordMatch;
  });
}

/**
 * List all skills in registry
 */
export function listAllSkills(registry: Registry): RegistrySkill[] {
  return registry.skills;
}
