/**
 * Install API routes
 * Returns install manifests for skills
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export interface InstallManifest {
  skillId: string;
  version: string;
  description: string;
  source: string;
  hash: string;
  files: string[];
  signature: string;
  attestationUrl: string;
}

export interface InstallResponse {
  skillId: string;
  version: string;
  manifest: InstallManifest;
  installCommand: string;
}

/**
 * Handle GET /api/v1/install/:skillId/:version
 */
export async function handleInstallSkill(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const params = (req as any).params || [];
  const skillId = params[0];
  const version = params[1];

  if (!skillId || !version) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Skill ID and version are required' }));
    return;
  }

  try {
    const baseDir = process.cwd();
    const skillsDir = path.join(baseDir, 'skills', skillId, version);

    // Check if skill exists
    if (!fs.existsSync(skillsDir)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Skill not found: ${skillId}@${version}` }));
      return;
    }

    // Read skill metadata
    const metadataPath = path.join(baseDir, 'metadata', skillId, `${version}.json`);
    let metadata: any = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }

    // Read attestation
    const attestationPath = path.join(baseDir, 'attestations', skillId, `${version}.json`);
    let attestation: any = {};
    if (fs.existsSync(attestationPath)) {
      attestation = JSON.parse(fs.readFileSync(attestationPath, 'utf-8'));
    }

    // Read signature
    const signaturePath = path.join(baseDir, 'signatures', skillId, `${version}.sig`);
    let signature = '';
    if (fs.existsSync(signaturePath)) {
      signature = fs.readFileSync(signaturePath, 'utf-8');
    }

    // List files in skill directory
    const files = listFilesRecursive(skillsDir);

    const manifest: InstallManifest = {
      skillId,
      version,
      description: metadata.description || '',
      source: attestation.source || '',
      hash: attestation.hash || '',
      files: files.map((f) => path.relative(skillsDir, f)),
      signature,
      attestationUrl: `/api/v1/attestations/${skillId}/${version}`,
    };

    const response: InstallResponse = {
      skillId,
      version,
      manifest,
      installCommand: `npx skills-factory install ${skillId}@${version}`,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: errorMessage }));
  }
}

/**
 * Recursively list all files in a directory
 */
function listFilesRecursive(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
