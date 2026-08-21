#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { runCheck } from './commands/check';
import { runDoctor } from './doctor/runner';
import { getDb } from './db';

const program = new Command();

program
  .name('vigil')
  .description('Self-healing engineering change intelligence — know about breaking changes before they hit production')
  .version('0.1.0');

// ── vigil check ──────────────────────────────────────────────────────────────
program
  .command('check [packages...]')
  .description('Check packages for recent breaking changes')
  .option('-f, --file <path>', 'Read packages from a package.json file')
  .option('-d, --days <number>', 'How many days back to look (default: 30)', '30')
  .option('-o, --output <path>', 'Save JSON report to a file')
  .option('--json', 'Output raw JSON to stdout')
  .option('--fresh', 'Re-check all releases, not just unseen ones')
  .action(async (packages: string[], opts) => {
    await runCheck(packages, {
      ...opts,
      days: parseInt(opts.days as string, 10),
    });
  });

// ── vigil doctor ─────────────────────────────────────────────────────────────
program
  .command('doctor')
  .description('Audit all scraper health and optionally trigger healing')
  .option('--heal', 'Auto-heal any degraded scrapers')
  .action(async (opts) => {
    await runDoctor(opts);
  });

// ── vigil history ─────────────────────────────────────────────────────────────
program
  .command('history')
  .description('Show recent breaking change detections')
  .option('-d, --days <number>', 'How many days back to show (default: 14)', '14')
  .option('--json', 'Output raw JSON')
  .action((opts) => {
    const db = getDb();
    const days = parseInt(opts.days as string, 10);
    const rows = db
      .prepare(
        `SELECT package, version, date, url, breaking, deprecated, created_at
         FROM change_reports
         WHERE created_at >= datetime('now', '-' || ? || ' days')
         ORDER BY created_at DESC`
      )
      .all(days) as {
        package: string;
        version: string;
        date: string;
        url: string;
        breaking: string;
        deprecated: string;
        created_at: string;
      }[];

    if (opts.json) {
      console.log(JSON.stringify(rows.map((r) => ({
        ...r,
        breaking: JSON.parse(r.breaking),
        deprecated: JSON.parse(r.deprecated),
      })), null, 2));
      return;
    }

    if (rows.length === 0) {
      console.log(`No breaking changes detected in the last ${days} days.`);
      return;
    }

    console.log(`\nBreaking changes detected in the last ${days} days:\n`);
    for (const r of rows) {
      const breaking = JSON.parse(r.breaking) as { summary: string }[];
      console.log(`  ${r.package} ${r.version} (${r.date})`);
      for (const b of breaking.slice(0, 3)) {
        console.log(`    • ${b.summary}`);
      }
      console.log(`    → ${r.url}\n`);
    }
  });

// ── vigil subscribe ───────────────────────────────────────────────────────────
program
  .command('subscribe')
  .description('Manage alert subscriptions')
  .addCommand(
    new Command('add')
      .argument('<packages...>', 'Package names to watch')
      .description('Add packages to your watch list')
      .action((packages: string[]) => {
        const db = getDb();
        const existing = db.prepare('SELECT * FROM subscriptions LIMIT 1').get() as {
          id: number;
          packages: string;
        } | undefined;

        if (existing) {
          const current = JSON.parse(existing.packages) as string[];
          const updated = [...new Set([...current, ...packages])];
          db.prepare('UPDATE subscriptions SET packages = ? WHERE id = ?').run(
            JSON.stringify(updated), existing.id
          );
          console.log(`Watching: ${updated.join(', ')}`);
        } else {
          db.prepare(
            'INSERT INTO subscriptions (packages) VALUES (?)'
          ).run(JSON.stringify(packages));
          console.log(`Now watching: ${packages.join(', ')}`);
        }
      })
  )
  .addCommand(
    new Command('set-slack')
      .argument('<url>', 'Slack incoming webhook URL')
      .description('Configure Slack alerting')
      .action((url: string) => {
        const db = getDb();
        const existing = db.prepare('SELECT id FROM subscriptions LIMIT 1').get() as { id: number } | undefined;
        if (existing) {
          db.prepare('UPDATE subscriptions SET slack_webhook = ? WHERE id = ?').run(url, existing.id);
        } else {
          db.prepare('INSERT INTO subscriptions (packages, slack_webhook) VALUES (?, ?)').run('[]', url);
        }
        console.log('Slack webhook configured.');
      })
  )
  .addCommand(
    new Command('set-discord')
      .argument('<url>', 'Discord incoming webhook URL')
      .description('Configure Discord alerting')
      .action((url: string) => {
        const db = getDb();
        const existing = db.prepare('SELECT id FROM subscriptions LIMIT 1').get() as { id: number } | undefined;
        if (existing) {
          db.prepare('UPDATE subscriptions SET discord_webhook = ? WHERE id = ?').run(url, existing.id);
        } else {
          db.prepare('INSERT INTO subscriptions (packages, discord_webhook) VALUES (?, ?)').run('[]', url);
        }
        console.log('Discord webhook configured.');
      })
  );

program.parse(process.argv);
