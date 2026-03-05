/**
 * Skills Factory CLI
 *
 * Usage:
 *   npx skills-factory <command> [options]
 *
 * Commands:
 *   search <keyword>    Search for skills
 *   install <source>    Install a skill from GitHub (owner/repo)
 *   audit <skill-name>  Audit an installed skill
 *   list                List installed skills
 */

import { readLockfile, findSkills, listSkills } from './lockfile.js';

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
  install <source>    Install a skill from GitHub (owner/repo format)
  audit <skill>       Run security audit on a skill
  list                List all installed skills

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
        console.log(`Installing from: ${args[0]}`);
        // TODO: Implement install command
        break;

      case 'audit':
        if (args.length === 0) {
          console.error('Error: audit requires a skill name');
          console.error('Usage: npx skills-factory audit <skill-name>');
          process.exit(1);
        }
        console.log(`Auditing skill: ${args[0]}`);
        // TODO: Implement audit command
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
