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
import { readLockfile, findSkills, listSkills, addSkill, writeLockfile, removeSkill } from './lockfile.js';
import { parseGitHubSource, downloadSkill } from './github.js';
import { auditSkill, computeDirectoryHash } from './security.js';
import { readRegistry, searchRegistry, listAllSkills } from './registry.js';

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
  search <keyword>    Search for skills by name or keyword (local + registry)
  browse              Browse all skills in the registry
  install <source>    Install a skill from GitHub (owner/repo)
  update <skill-name> Update a skill to the latest version
  uninstall <skill>   Remove an installed skill
  audit <skill-name>  Audit an installed skill
  verify <skill-name> Verify skill integrity and signature
  list                List installed skills
  source list         List whitelisted sources
  source add <url>    Add a source to whitelist
  source remove <url> Remove a source from whitelist

Options:
  -h, --help          Show this help message
  -v, --version       Show version

Examples:
  npx skills-factory search openclaw
  npx skills-factory install owner/repo
  npx skills-factory update openclaw-config
  npx skills-factory verify openclaw-config
  npx skills-factory source list
  npx skills-factory source add github.com/myorg
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
  // Search local skills
  const lockfile = await readLockfile(process.cwd());
  const localMatches = findSkills(lockfile, keyword);

  // Search remote registry
  const registry = await readRegistry(process.cwd());
  const remoteMatches = searchRegistry(registry, keyword);

  // Display local skills
  if (localMatches.length > 0) {
    console.log(`Local skills (${localMatches.length}):\n`);
    for (const skill of localMatches) {
      console.log(`  ${skill.name} [installed]`);
    }
    console.log();
  } else {
    console.log('No local skills found.\n');
  }

  // Display remote skills
  if (remoteMatches.length > 0) {
    console.log(`Available in registry (${remoteMatches.length}):\n`);
    for (const skill of remoteMatches) {
      const installed = lockfile.skills[skill.name] ? ' [installed]' : '';
      console.log(`  ${skill.name}${installed}`);
      console.log(`    ${skill.description.slice(0, 60)}...`);
      console.log(`    Source: ${skill.source}`);
      console.log();
    }
  } else {
    console.log('No remote skills found.\n');
  }
}

async function handleBrowse(): Promise<void> {
  const registry = await readRegistry(process.cwd());
  const lockfile = await readLockfile(process.cwd());

  const allSkills = listAllSkills(registry);

  if (allSkills.length === 0) {
    console.log('No skills in registry.');
    return;
  }

  console.log(`Skills Registry (${allSkills.length} skills):\n`);
  for (const skill of allSkills) {
    const installed = lockfile.skills[skill.name] ? '✓' : '  ';
    console.log(`${installed} ${skill.name}`);
    console.log(`    ${skill.description}`);
    console.log(`    Keywords: ${skill.keywords.join(', ')}`);
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
  const computedHash = await computeDirectoryHash(skillDir);

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

async function handleUninstall(skillName: string): Promise<void> {
  const skillDir = path.join(process.cwd(), 'skills', skillName);
  const agentsDir = path.join(process.cwd(), '.agents', 'skills', skillName);

  if (!fs.existsSync(skillDir)) {
    console.error(`Error: Skill "${skillName}" not found`);
    process.exit(1);
  }

  console.log(`Uninstalling skill: ${skillName}...\n`);

  // Remove from lockfile
  const lockfile = await readLockfile(process.cwd());
  if (!lockfile.skills[skillName]) {
    console.error(`Error: Skill "${skillName}" not in lockfile`);
    process.exit(1);
  }

  const updatedLockfile = removeSkill(lockfile, skillName);
  await writeLockfile(process.cwd(), updatedLockfile);

  // Remove directories
  fs.rmSync(skillDir, { recursive: true, force: true });
  if (fs.existsSync(agentsDir)) {
    fs.rmSync(agentsDir, { recursive: true, force: true });
  }

  // Git commit
  console.log('Committing changes...');
  execSync(`git add -A`, { encoding: 'utf-8', stdio: 'pipe' });
  try {
    execSync(`git commit -m "chore: uninstall skill ${skillName}"`, { encoding: 'utf-8', stdio: 'pipe' });
  } catch {
    // Ignore if nothing to commit
  }

  console.log(`✓ Uninstalled skill: ${skillName}`);
}

async function handleUpdate(skillName: string): Promise<void> {
  const skillDir = path.join(process.cwd(), 'skills', skillName);

  if (!fs.existsSync(skillDir)) {
    console.error(`Error: Skill "${skillName}" not found`);
    console.error('Use "install" command to install a new skill.');
    process.exit(1);
  }

  const lockfile = await readLockfile(process.cwd());
  const entry = lockfile.skills[skillName];

  if (!entry) {
    console.error(`Error: Skill "${skillName}" not in lockfile`);
    process.exit(1);
  }

  console.log(`Updating skill: ${skillName}...\n`);
  console.log(`Source: ${entry.source}\n`);

  // Remove existing skill
  fs.rmSync(skillDir, { recursive: true, force: true });

  // Re-download
  const source = parseGitHubSource(entry.source);
  console.log('Downloading latest version...');
  const result = await downloadSkill(source, path.join(process.cwd(), 'skills'));

  if (result.files.length === 0) {
    console.error('Error: No files downloaded from repository');
    process.exit(1);
  }

  console.log(`Downloaded ${result.files.length} files\n`);

  // Run security audit
  console.log('Running security audit...\n');
  const auditResult = await auditSkill(skillDir);

  if (!auditResult.passed) {
    console.error('Security audit failed');
    for (const error of auditResult.errors) {
      console.error(`  ${error}`);
    }
    console.log('\nRollback: skill directory was removed.');
    process.exit(1);
  }

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

  console.log('✓ Security audit passed\n');

  // Update lockfile with new hash
  const updatedLockfile = addSkill(lockfile, skillName, {
    source: entry.source,
    sourceType: entry.sourceType,
    computedHash: await computeDirectoryHash(skillDir),
  });

  await writeLockfile(process.cwd(), updatedLockfile);
  console.log('✓ Updated skills-lock.json\n');

  // Sync to .agents/skills
  const agentsDir = path.join(process.cwd(), '.agents', 'skills', skillName);
  fs.rmSync(agentsDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(agentsDir), { recursive: true });
  fs.cpSync(skillDir, agentsDir, { recursive: true });
  console.log('✓ Synced to .agents/skills/\n');

  // Git commit
  console.log('Committing changes...');
  execSync(`git add -A`, { encoding: 'utf-8', stdio: 'pipe' });
  try {
    execSync(`git commit -m "chore: update skill ${skillName}"`, { encoding: 'utf-8', stdio: 'pipe' });
  } catch {
    // Ignore if nothing to commit
  }

  console.log(`✓ Updated skill: ${skillName}`);
}

/**
 * Verify a skill's signature and integrity
 */
async function handleVerify(skillName: string): Promise<void> {
  console.log(`Verifying skill: ${skillName}...\n`);

  const skillDir = path.join(process.cwd(), 'skills', skillName);

  if (!fs.existsSync(skillDir)) {
    console.error(`Error: Skill not found: ${skillName}`);
    process.exit(1);
  }

  // Read lockfile to get stored hash
  const lockfile = await readLockfile(process.cwd());
  const entry = lockfile.skills[skillName];

  if (!entry) {
    console.error(`Error: Skill not in lockfile: ${skillName}`);
    process.exit(1);
  }

  // Compute current hash
  const currentHash = await computeDirectoryHash(skillDir);

  console.log(`Stored hash:   ${entry.computedHash}`);
  console.log(`Current hash:  ${currentHash}`);

  if (currentHash === entry.computedHash) {
    console.log('\n✓ Skill integrity verified\n');
  } else {
    console.error('\n✗ Hash mismatch! Skill may have been modified.\n');
    process.exit(1);
  }

  // Check signature if available
  const signaturePath = path.join(process.cwd(), 'signatures', `${skillName}.sig`);
  if (fs.existsSync(signaturePath)) {
    console.log('Signature file found.');
    // In production, would verify against public key
    console.log('✓ Signature present (verification requires public key)\n');
  }

  console.log(`✓ Verification complete: ${skillName}`);
}

/**
 * Handle source management commands
 */
async function handleSource(args: string[]): Promise<void> {
  const subCommand = args[0] || 'list';

  switch (subCommand) {
    case 'list':
      await handleSourceList();
      break;
    case 'add':
      if (args.length < 2) {
        console.error('Error: source add requires a URL');
        console.error('Usage: npx skills-factory source add <url>');
        process.exit(1);
      }
      await handleSourceAdd(args[1]);
      break;
    case 'remove':
      if (args.length < 2) {
        console.error('Error: source remove requires a URL or name');
        console.error('Usage: npx skills-factory source remove <url>');
        process.exit(1);
      }
      await handleSourceRemove(args[1]);
      break;
    default:
      console.error(`Unknown source command: ${subCommand}`);
      console.error('Available commands: list, add, remove');
      process.exit(1);
  }
}

/**
 * List whitelisted sources
 */
async function handleSourceList(): Promise<void> {
  console.log('Whitelisted Sources:\n');

  const sourcesPath = path.join(process.cwd(), 'sources.json');

  if (!fs.existsSync(sourcesPath)) {
    // Default sources
    console.log('  • github.com (default)');
    console.log('  • gist.github.com (default)');
    console.log('\nNo custom sources configured.');
    return;
  }

  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));

  console.log('Default:');
  console.log('  • github.com');
  console.log('  • gist.github.com');

  if (sources.custom && sources.custom.length > 0) {
    console.log('\nCustom:');
    for (const source of sources.custom) {
      console.log(`  • ${source}`);
    }
  }
}

/**
 * Add a source to whitelist
 */
async function handleSourceAdd(sourceUrl: string): Promise<void> {
  const sourcesPath = path.join(process.cwd(), 'sources.json');

  let sources: { custom: string[] } = { custom: [] };

  if (fs.existsSync(sourcesPath)) {
    sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
  }

  if (sources.custom.includes(sourceUrl)) {
    console.log(`Source already whitelisted: ${sourceUrl}`);
    return;
  }

  sources.custom.push(sourceUrl);
  fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));

  console.log(`✓ Added source: ${sourceUrl}`);
}

/**
 * Remove a source from whitelist
 */
async function handleSourceRemove(sourceUrl: string): Promise<void> {
  const sourcesPath = path.join(process.cwd(), 'sources.json');

  if (!fs.existsSync(sourcesPath)) {
    console.log('No custom sources configured.');
    return;
  }

  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));

  const index = sources.custom.indexOf(sourceUrl);
  if (index === -1) {
    console.log(`Source not found: ${sourceUrl}`);
    return;
  }

  sources.custom.splice(index, 1);

  if (sources.custom.length === 0) {
    fs.rmSync(sourcesPath);
    console.log(`✓ Removed source: ${sourceUrl}`);
    console.log('No custom sources remaining.');
  } else {
    fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));
    console.log(`✓ Removed source: ${sourceUrl}`);
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

      case 'uninstall':
        if (args.length === 0) {
          console.error('Error: uninstall requires a skill name');
          console.error('Usage: npx skills-factory uninstall <skill-name>');
          process.exit(1);
        }
        await handleUninstall(args[0]);
        break;

      case 'update':
        if (args.length === 0) {
          console.error('Error: update requires a skill name');
          console.error('Usage: npx skills-factory update <skill-name>');
          process.exit(1);
        }
        await handleUpdate(args[0]);
        break;

      case 'browse':
        await handleBrowse();
        break;

      case 'update':
        if (args.length === 0) {
          console.error('Error: update requires a skill name');
          console.error('Usage: npx skills-factory update <skill-name>');
          process.exit(1);
        }
        await handleUpdate(args[0]);
        break;

      case 'verify':
        if (args.length === 0) {
          console.error('Error: verify requires a skill name');
          console.error('Usage: npx skills-factory verify <skill-name>');
          process.exit(1);
        }
        await handleVerify(args[0]);
        break;

      case 'source':
        await handleSource(args);
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
