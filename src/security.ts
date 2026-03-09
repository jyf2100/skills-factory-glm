import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface ValidationResult {
  valid: boolean;
  name?: string;
  description?: string;
  version?: string;
  error?: string;
}

export interface SecurityIssue {
  type: string;
  file: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AuditResult {
  passed: boolean;
  skillName: string;
  hash: string;
  errors: string[];
  warnings: string[];
  issues: SecurityIssue[];
}

// Sensitive patterns to detect
const SENSITIVE_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, name: 'OpenAI API key' },
  { pattern: /sk-ant-[a-zA-Z0-9-]{20,}/g, name: 'Anthropic API key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub PAT' },
  { pattern: /github_pat_[a-zA-Z0-9_]{22,}/g, name: 'GitHub fine-grained PAT' },
  { pattern: /xox[bap]-[a-zA-Z0-9-]{20,}/g, name: 'Stripe API key' },
  { pattern: /AKIA[A-Z0-9]{16}/g, name: 'AWS Access Key' },
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, name: 'Private key' },
  { pattern: /api[_-]?key\s*=\s*['"][^'"]{10,}['"]/gi, name: 'API key assignment' },
  { pattern: /secret[_-]?key\s*=\s*['"][^'"]{10,}['"]/gi, name: 'Secret key assignment' },
  { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Password assignment' },
  { pattern: /token\s*=\s*['"][^'"]{10,}['"]/gi, name: 'Token assignment' },
];

// Suspicious file patterns
const SUSPICIOUS_FILES = [
  /\.env$/i,
  /\.env\./i,
  /\.pem$/i,
  /\.key$/i,
  /credentials/i,
  /secrets?\.json$/i,
  /\.npmrc$/i,
  /_netrc$/i,
  /id_rsa/i,
  /id_ed25519/i,
];

/**
 * Validate SKILL.md frontmatter
 */
export function validateSkillMd(content: string): ValidationResult {
  // Check for YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return {
      valid: false,
      error: 'Missing YAML frontmatter. SKILL.md must start with ---',
    };
  }

  const frontmatter = frontmatterMatch[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  const versionMatch = frontmatter.match(/^version:\s*(.+)$/m);

  if (!nameMatch) {
    return {
      valid: false,
      error: 'Missing required "name" field in frontmatter',
    };
  }

  if (!descMatch) {
    return {
      valid: false,
      error: 'Missing required "description" field in frontmatter',
    };
  }

  return {
    valid: true,
    name: nameMatch[1].trim(),
    description: descMatch[1].trim(),
    version: versionMatch?.[1].trim(),
  };
}

/**
 * Compute SHA-256 hash of content
 */
export async function computeHash(content: string): Promise<string> {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compute hash for a file
 */
export async function computeFileHash(filePath: string): Promise<string> {
  const content = await fs.promises.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compute hash for a directory (all files combined)
 */
export async function computeDirectoryHash(dirPath: string): Promise<string> {
  const files = getAllFiles(dirPath, dirPath);
  const hashContents: string[] = [];

  for (const file of files.sort()) {
    const filePath = path.join(dirPath, file);
    const content = await fs.promises.readFile(filePath);
    hashContents.push(`${file}:${crypto.createHash('sha256').update(content).digest('hex')}`);
  }

  return crypto.createHash('sha256').update(hashContents.join('\n')).digest('hex');
}

/**
 * Detect security issues in content
 */
export function detectSecurityIssues(
  filePath: string,
  content: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const fileName = path.basename(filePath);

  // Check for suspicious file names
  for (const pattern of SUSPICIOUS_FILES) {
    if (pattern.test(fileName)) {
      issues.push({
        type: 'suspicious-file',
        file: filePath,
        message: `Suspicious file detected: ${fileName}`,
        severity: 'high',
      });
      return issues; // Don't check content if file is already suspicious
    }
  }

  // Check for sensitive patterns in content
  for (const { pattern, name } of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      issues.push({
        type: 'sensitive-pattern',
        file: filePath,
        message: `Potential ${name} found`,
        severity: 'high',
      });
    }
  }

  // Check for script files (shell, python, etc)
  if (filePath.endsWith('.sh') || content.startsWith('#!')) {
    issues.push({
      type: 'script',
      file: filePath,
      message: 'Shell script detected',
      severity: 'medium',
    });
  }

  return issues;
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files;
}

/**
 * Audit a skill directory
 */
export async function auditSkill(skillDir: string): Promise<AuditResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const issues: SecurityIssue[] = [];

  // Check if directory exists
  if (!fs.existsSync(skillDir)) {
    return {
      passed: false,
      skillName: path.basename(skillDir),
      hash: '',
      errors: [`Skill directory not found: ${skillDir}`],
      warnings: [],
      issues: [],
    };
  }

  // Check for SKILL.md
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    errors.push('SKILL.md not found');
    return {
      passed: false,
      skillName: path.basename(skillDir),
      hash: '',
      errors,
      warnings,
      issues,
    };
  }

  // Validate SKILL.md
  const skillMdContent = await fs.promises.readFile(skillMdPath, 'utf-8');
  const validation = validateSkillMd(skillMdContent);

  if (!validation.valid) {
    errors.push(`Invalid SKILL.md: ${validation.error}`);
  }

  // Compute hash of entire skill directory
  const files = getAllFiles(skillDir, skillDir);
  const hashContents: string[] = [];

  for (const file of files.sort()) {
    const filePath = path.join(skillDir, file);
    const content = await fs.promises.readFile(filePath);
    hashContents.push(`${file}:${crypto.createHash('sha256').update(content).digest('hex')}`);
  }

  const combinedHash = await computeHash(hashContents.join('\n'));

  // Scan all files for security issues
  for (const file of files) {
    const filePath = path.join(skillDir, file);
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const fileIssues = detectSecurityIssues(file, content);
    issues.push(...fileIssues);
  }

  // Convert issues to errors/warnings
  for (const issue of issues) {
    if (issue.severity === 'high') {
      errors.push(`${issue.file}: ${issue.message}`);
    } else {
      warnings.push(`${issue.file}: ${issue.message}`);
    }
  }

  return {
    passed: errors.length === 0,
    skillName: validation.name || path.basename(skillDir),
    hash: combinedHash,
    errors,
    warnings,
    issues,
  };
}
