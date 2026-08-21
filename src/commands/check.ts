import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';
import { COLLECTORS, getGithubUrl } from '../scraper/collectors';
import { runWithHealing } from '../healing/healer';
import { classifyBreakingChanges } from '../parser/classifier';
import { normalizeReleases, findNewReleases, markSeen } from '../parser/diff';
import { printHeader, printReport, printNoCollectors } from '../reporter/terminal';
import { toJsonReport } from '../reporter/json';
import { ChangeReport } from '../types';
import { getDb } from '../db';

interface CheckOptions {
  file?: string;
  days?: number;
  output?: string;
  json?: boolean;
  fresh?: boolean;
}

/**
 * Core check logic — resolves packages, scrapes releases, classifies breaking changes.
 */
export async function runCheck(packages: string[], opts: CheckOptions): Promise<void> {
  // Resolve package list
  let pkgs = [...packages];

  if (opts.file) {
    const pkgJsonPath = path.resolve(opts.file);
    if (!fs.existsSync(pkgJsonPath)) {
      console.error(`File not found: ${pkgJsonPath}`);
      process.exit(1);
    }
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const allDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
    };
    pkgs = [...new Set([...pkgs, ...Object.keys(allDeps)])];
  }

  if (pkgs.length === 0) {
    console.error('No packages specified. Use `vigil check react nextjs` or `vigil check --file package.json`');
    process.exit(1);
  }

  if (!opts.json) printHeader();

  // Check collectors are configured
  const githubCollector = COLLECTORS.githubReleases;
  if (!githubCollector.id) {
    printNoCollectors();
    process.exit(1);
  }

  const reports: ChangeReport[] = [];
  const lookbackDays = opts.days ?? 30;

  for (const pkg of pkgs) {
    const targetUrl = getGithubUrl(pkg);
    if (!targetUrl) {
      if (!opts.json) {
        console.log(`  Skipping ${pkg} — no GitHub repo mapping found`);
      }
      continue;
    }

    const spinner = opts.json ? null : ora(`Checking ${pkg}...`).start();

    try {
      const raw = await runWithHealing({
        collectorId: githubCollector.id,
        collectorName: `${pkg}-releases`,
        targetUrl,
        schemaPath: githubCollector.schemaPath,
        onProgress: (msg) => { if (spinner) spinner.text = msg; },
      });

      const releases = normalizeReleases(pkg, raw, 'github');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - lookbackDays);

      // Filter to recent releases
      const recent = releases.filter((r) => {
        const d = new Date(r.date);
        return !isNaN(d.getTime()) && d >= cutoff;
      });

      // Only process new ones (not seen before) unless --fresh
      const toProcess = opts.fresh ? recent : findNewReleases(pkg, recent);

      for (const release of toProcess) {
        const { breaking, deprecated } = classifyBreakingChanges(release.body);
        if (breaking.length > 0 || deprecated.length > 0) {
          reports.push({
            package: pkg,
            version: release.version,
            date: release.date,
            url: release.url,
            breaking,
            deprecated,
            hasBreaking: breaking.length > 0,
          });

          // Persist to DB
          const db = getDb();
          db.prepare(
            `INSERT OR IGNORE INTO change_reports (package, version, date, url, breaking, deprecated)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(pkg, release.version, release.date, release.url, JSON.stringify(breaking), JSON.stringify(deprecated));
        }
      }

      if (!opts.fresh) markSeen(releases);

      if (spinner) spinner.succeed(`${pkg} checked`);
    } catch (err) {
      if (spinner) spinner.fail(`${pkg} — ${(err as Error).message}`);
    }
  }

  if (opts.json || opts.output) {
    const jsonOut = toJsonReport(reports);
    if (opts.output) {
      fs.writeFileSync(path.resolve(opts.output), jsonOut, 'utf8');
      if (!opts.json) console.log(`Report saved to ${opts.output}`);
    } else {
      console.log(jsonOut);
    }
  } else {
    printReport(reports);
  }
}
