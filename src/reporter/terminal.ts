import chalk from 'chalk';
import { ChangeReport, ScraperStatus } from '../types';

export function printHeader(): void {
  console.log('');
  console.log(chalk.bold.white('  Vigil') + chalk.gray(' — engineering change intelligence'));
  console.log(chalk.gray('  ' + '─'.repeat(50)));
  console.log('');
}

export function printReport(reports: ChangeReport[]): void {
  if (reports.length === 0) {
    console.log(chalk.green('  ✓ No breaking changes found'));
    console.log('');
    return;
  }

  const hasBreaking = reports.filter((r) => r.hasBreaking);
  const clean = reports.filter((r) => !r.hasBreaking);

  if (clean.length > 0) {
    for (const r of clean) {
      console.log(
        chalk.green('  ✓') + ' ' +
        chalk.bold(r.package) + ' ' +
        chalk.gray(r.version) +
        chalk.gray(' — no breaking changes')
      );
    }
  }

  if (hasBreaking.length > 0) {
    console.log('');
    for (const r of hasBreaking) {
      console.log(
        chalk.red('  ✗') + ' ' +
        chalk.bold.red(r.package) + ' ' +
        chalk.yellow(r.version) +
        chalk.gray(` — ${r.breaking.length} breaking change${r.breaking.length > 1 ? 's' : ''}`)
      );

      for (const b of r.breaking.slice(0, 5)) {
        const summary = b.summary.replace(/\*\*/g, '').replace(/`/g, '').trim();
        console.log(chalk.gray('      •') + ' ' + chalk.white(summary));
      }

      if (r.breaking.length > 5) {
        console.log(chalk.gray(`      ...and ${r.breaking.length - 5} more`));
      }

      if (r.deprecated.length > 0) {
        console.log(
          chalk.yellow('    ⚠') + chalk.gray(` ${r.deprecated.length} deprecation${r.deprecated.length > 1 ? 's' : ''}`)
        );
      }

      console.log(chalk.gray(`    → ${r.url}`));
      console.log('');
    }
  }

  // Summary line
  const total = reports.length;
  const breakingCount = hasBreaking.length;
  if (breakingCount > 0) {
    console.log(
      chalk.gray('  ') +
      chalk.red.bold(`${breakingCount}/${total} packages`) +
      chalk.gray(' have breaking changes — review before upgrading')
    );
  } else {
    console.log(chalk.green(`  ✓ All ${total} packages are clean`));
  }
  console.log('');
}

export function printDoctorStatus(statuses: ScraperStatus[]): void {
  console.log(chalk.bold.white('  Vigil Doctor') + chalk.gray(' — scraper health'));
  console.log(chalk.gray('  ' + '─'.repeat(50)));
  console.log('');

  for (const s of statuses) {
    const icon = s.healthy ? chalk.green('✓') : chalk.red('✗');
    const name = chalk.bold(s.name);
    const lastRun = s.lastRun
      ? chalk.gray(`last run: ${s.lastRun}`)
      : chalk.gray('never run');
    const lastHeal = s.lastHeal ? chalk.yellow(` | last heal: ${s.lastHeal}`) : '';

    console.log(`  ${icon} ${name}  ${lastRun}${lastHeal}`);

    if (!s.healthy && s.validationErrors.length > 0) {
      console.log(chalk.red(`       Errors: ${s.validationErrors.join(', ')}`));
    }
  }
  console.log('');
}

export function printNoCollectors(): void {
  console.log(chalk.yellow('  ⚠ No Collector IDs configured'));
  console.log('');
  console.log(chalk.gray('  Run the setup to create scrapers:'));
  console.log(chalk.cyan('    npx -p @brightdata/cli bdata login'));
  console.log(chalk.cyan('    vigil setup'));
  console.log('');
}
