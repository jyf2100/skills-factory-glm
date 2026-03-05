/**
 * Skills API Routes
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

interface Skill {
  id: string;
  name: string;
  description: string;
  source: string;
  keywords: string[];
  version?: string;
  installed?: boolean;
}

interface Registry {
  version: number;
  skills: Skill[];
}

async function readRegistry(baseDir: string): Promise<Registry> {
  const registryPath = path.join(baseDir, 'skills-registry.json');

  if (!fs.existsSync(registryPath)) {
    return { version: 1, skills: [] };
  }

  const content = await fs.promises.readFile(registryPath, 'utf-8');
  return JSON.parse(content);
}

async function readLockfile(baseDir: string): Promise<{ skills: Record<string, { source: string }> }> {
  const lockPath = path.join(baseDir, 'skills-lock.json');

  if (!fs.existsSync(lockPath)) {
    return { skills: {} };
  }

  const content = await fs.promises.readFile(lockPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Handle GET /api/v1/skills and GET /api/v1/skills/:id
 */
export async function handleSkillsRoute(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: string[]
): Promise<void> {
  const baseDir = process.cwd();
  const registry = await readRegistry(baseDir);
  const lockfile = await readLockfile(baseDir);

  // Mark installed skills
  const skills = registry.skills.map(skill => ({
    ...skill,
    installed: !!lockfile.skills[skill.name],
  }));

  // GET /api/v1/skills/:id - single skill
  if (params.length > 0 && params[0]) {
    const skillId = params[0];
    const skill = skills.find(s => s.id === skillId || s.name === skillId);

    if (!skill) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Skill not found: ${skillId}` }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(skill));
    return;
  }

  // GET /api/v1/skills - list all skills
  const query = (req as any).query;
  const searchQuery = query?.get?.('q') || query?.get?.('search');

  let filteredSkills = skills;
  if (searchQuery) {
    const keyword = searchQuery.toLowerCase();
    filteredSkills = skills.filter(skill =>
      skill.name.toLowerCase().includes(keyword) ||
      skill.description.toLowerCase().includes(keyword) ||
      skill.keywords.some(k => k.toLowerCase().includes(keyword))
    );
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    total: filteredSkills.length,
    skills: filteredSkills,
  }));
}
