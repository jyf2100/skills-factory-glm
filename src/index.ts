/**
 * Skills Factory CLI
 *
 * Usage:
 *   npx skills-factory <command> [options]
 *
 * Commands:
 *   search <keyword>    Search for skills by name or keyword
 *   install <source>    Install a skill from GitHub (owner/repo)
 *   audit <skill-name>  Audit an installed skill
 *   list                List installed skills
 *
 * Options:
 *   -h, --help          Show this help message
 *   -v, --version       Show version
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { readLockfile, findSkills, listSkills, addSkill, writeLockfile } from './lockfile.js';
import { parseGitHubSource, downloadSkill } from './github.js';
import { auditSkill, computeFileHash } from './security.js';

interface CliArgs {
  command: string;
  args: string[];
  flags: Record<string, boolean | string>;
}

function parseArgs(argv: string[]): CliArgs {
  const args: string[] = [];
  const flags: Record<string, boolean | string> = {};
  let command = '';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        flags[key] = nextArg;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      flags[key] = true;
    } else if (!command) {
      command = arg;
    } else {
      args.push(arg);
    }
  }

  return { command, args, flags };
}

function showHelp(): void {
  console.log(`
Skills Factory - Internal Skills Marketplace

Usage:
  npx skills-factory <command> [options]

Commands:
  search <keyword>    Search for skills by name or keyword
  install <source>    Install a skill from GitHub (owner/repo)
  audit <skill-name>  Audit an installed skill
  list                List installed skills

Options:
  -h, --help          Show this help message
  -v, --version       Show version

Examples:
  npx skills-factory search openclaw
  npx skills-factory install owner/repo
  npx skills-factory audit openclaw-config
  npx skills-factory list
`);
}

function showVersion(): void {
  console.log('0.1.0');
}

async function handleList(): Promise<void> {
  const lockfile = await readLockfile(process.cwd());
  const skills = listSkills(lockfile);

  if (skills.length === 0) {
    console.log('No skills installed.');
    return;
  }

  console.log(`Installed skills (${skills.length}):\n`);
  for (const skill of skills) {
    console.log(`  ${skill.name}`);
    console.log(`    Source: ${skill.entry.source} (${skill.entry.sourceType})`);
    console.log(`    Hash:   ${skill.entry.computedHash.slice(0, 12)}...`);
    console.log();
  }
}

async function handleSearch(keyword: string): Promise<void> {
  const lockfile = await readLockfile(process.cwd());
  const matches = findSkills(lockfile, keyword);

  if (matches.length === 0) {
    console.log(`No skills found matching "${keyword}".`);
    return;
  }

  console.log(`Found ${matches.length} skill(s) matching "${keyword}":\n`);
  for (const skill of matches) {
    console.log(`  ${skill.name}`);
    console.log(`    Source: ${skill.entry.source}`);
    console.log();
  }
}

async function handleInstall(sourceArg: string): Promise<void> {
  console.log(`Installing from: ${sourceArg}...\n`);

  const source = parseGitHubSource(sourceArg);
  const skillsDir = path.join(process.cwd(), 'skills');

  // Download skill
  console.log('Downloading skill files...');
  const result = await downloadSkill(source, skillsDir);

  if (result.files.length === 0) {
    console.error('Error: No files downloaded from repository');
    process.exit(1);
  }

  console.log(`Downloaded ${result.files.length} files to skills/${result.skillName}\n`);

  // Run security audit
  console.log('Running security audit...\n');
  const skillDir = path.join(skillsDir, result.skillName);
  const auditResult = await auditSkill(skillDir);

  // Display audit results
  if (auditResult.warnings.length > 0) {
    console.log('Warnings:');
    for (const warning of auditResult.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
    console.log();
  }
  if (auditResult.issues.length > 0) {
    console.log('Security Issues:');
    for (const issue of auditResult.issues) {
      console.log(`  [${issue.severity}] ${issue.message}`);
    }
    console.log();
  }

  if (!auditResult.passed) {
    console.error('Security audit failed');
    for (const error of auditResult.errors) {
      console.error(`  ${error}`);
    }
    process.exit(1);
  }

  console.log('✓ Security audit passed\n');

  // Add to lockfile
  const lockfile = await readLockfile(process.cwd());
  const computedHash = await computeFileHash(skillDir);

  const updatedLockfile = addSkill(lockfile, result.skillName, {
    source: `${source.owner}/${source.repo}`,
    sourceType: 'github',
    computedHash,
  });

  await writeLockfile(process.cwd(), updatedLockfile);
  console.log('✓ Updated skills-lock.json\n');

  // Sync to .agents/skills directory
  const agentsDir = path.join(process.cwd(), '.agents', 'skills', result.skillName);
  fs.rmSync(agentsDir, { recursive: true, force: true });
  fs.cpSync(skillDir, agentsDir, { recursive: true });
  console.log('✓ Synced to .agents/skills/\n');

  // Git commit
  console.log('Committing changes...');
  const { execSync } = require('child_process');
  execSync(`git add skills/${result.skillName} skills-lock.json .agents/`, { encoding: 'utf-8' });
  execSync(`git commit -m "feat: install skill ${result.skillName}"`, { encoding: 'utf-8' });

  console.log(`Installation complete: ${result.skillName}`);
}

async function handleAudit(skillName: string): Promise<void> {
  const skillDir = path.join(process.cwd(), 'skills', skillName);

  if (!fs.existsSync(skillDir)) {
    console.error(`Error: Skill "${skillName}" not found`);
    process.exit(1);
  }

  console.log(`Auditing skill: ${skillName}...\n`);
  const result = await auditSkill(skillDir);

  if (result.passed) {
    console.log(`✓ Audit passed for skill: ${skillName}\n`);
  } else {
    console.error(`✗ Audit failed for skill: ${skillName}\n`);
    for (const error of result.errors) {
      console.error(`  ${error}`);
    }
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    for (const warning of result.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
    console.log();
  }
  if (result.issues.length > 0) {
    console.log('Security Issues:');
    for (const issue of result.issues) {
      console.log(`  [${issue.severity}] ${issue.message}`);
    }
    console.log();
  }
}

export async function cli(): Promise<void> {
  const { command, args, flags } = parseArgs(process.argv.slice(2));

  if (flags.help || flags.h) {
    showHelp();
    return;
  }

  if (flags.version || flags.v) {
    showVersion();
    return;
  }

  try {
    switch (command) {
      case '':
      case 'help':
        showHelp();
        break;

      case 'list':
        await handleList();
        break;

      case 'search':
        if (args.length === 0) {
          console.error('Error: search requires a keyword argument');
          console.error('Usage: npx skills-factory search <keyword>');
          process.exit(1);
        }
        await handleSearch(args[0]);
        break;

      case 'install':
        if (args.length === 0) {
          console.error('Error: install requires a source argument');
          console.error('Usage: npx skills-factory install <owner/repo>');
          process.exit(1);
        }
        await handleInstall(args[0]);
        break;

      case 'audit':
        if (args.length === 0) {
          console.error('Error: audit requires a skill name');
          console.error('Usage: npx skills-factory audit <skill-name>');
          process.exit(1);
        }
        await handleAudit(args[0]);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
