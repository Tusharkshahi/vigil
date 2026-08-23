import nextjsReleases from './nextjs-releases.json';
import reactReleases from './react-releases.json';
import typescriptReleases from './typescript-releases.json';
import expressReleases from './express-releases.json';
import eslintReleases from './eslint-releases.json';
import mongooseReleases from './mongoose-releases.json';
import jestReleases from './jest-releases.json';
import viteReleases from './vite-releases.json';
import prismaReleases from './prisma-releases.json';

export interface RawRelease {
  version_tag: string;
  publish_date: string;
  release_title: string;
  release_notes_body: string;
  product_page_url: string;
}

export interface BreakingChange {
  summary: string;
}

export interface PackageReport {
  package: string;
  ecosystem: string;
  releases: {
    version: string;
    date: string;
    title: string;
    url: string;
    breaking: BreakingChange[];
    deprecated: BreakingChange[];
    hasBreaking: boolean;
  }[];
  totalBreaking: number;
  totalDeprecated: number;
}

function extractBreaking(body: string): BreakingChange[] {
  const lines = body.split('\n');
  const results: BreakingChange[] = [];
  const seen = new Set<string>();
  let inBreakingSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^#+\s+breaking changes?/i.test(trimmed)) {
      inBreakingSection = true;
      continue;
    }
    if (/^#+\s+/i.test(trimmed) && inBreakingSection) {
      inBreakingSection = false;
    }

    if (inBreakingSection && /^[-*•]\s+/.test(trimmed)) {
      const summary = trimmed.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
      const key = summary.slice(0, 60).toLowerCase();
      if (!seen.has(key) && summary.length > 10) {
        seen.add(key);
        results.push({ summary });
      }
    }

    const bcMatch = trimmed.match(/^BREAKING CHANGE:\s*(.+)/i);
    if (bcMatch) {
      const summary = bcMatch[1].replace(/\*\*/g, '').replace(/`/g, '').trim();
      const key = summary.slice(0, 60).toLowerCase();
      if (!seen.has(key) && summary.length > 5) {
        seen.add(key);
        results.push({ summary });
      }
    }
  }

  return results;
}

function extractDeprecated(body: string): BreakingChange[] {
  const lines = body.split('\n');
  const results: BreakingChange[] = [];
  const seen = new Set<string>();
  let inDeprecatedSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^#+\s+deprecat/i.test(trimmed)) {
      inDeprecatedSection = true;
      continue;
    }
    if (/^#+\s+/i.test(trimmed) && inDeprecatedSection) {
      inDeprecatedSection = false;
    }

    if (inDeprecatedSection && /^[-*•]\s+/.test(trimmed)) {
      const summary = trimmed.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
      const key = summary.slice(0, 60).toLowerCase();
      if (!seen.has(key) && summary.length > 10) {
        seen.add(key);
        results.push({ summary });
      }
    }
  }

  return results;
}

function processReleases(raw: RawRelease[], pkg: string, ecosystem: string): PackageReport {
  const releases = raw.map((r) => {
    const version = r.version_tag.replace(/^v/, '');
    const breaking = extractBreaking(r.release_notes_body);
    const deprecated = extractDeprecated(r.release_notes_body);
    return {
      version,
      date: r.publish_date,
      title: r.release_title,
      url: r.product_page_url,
      breaking,
      deprecated,
      hasBreaking: breaking.length > 0,
    };
  });

  const totalBreaking = releases.reduce((s, r) => s + r.breaking.length, 0);
  const totalDeprecated = releases.reduce((s, r) => s + r.deprecated.length, 0);

  return { package: pkg, ecosystem, releases, totalBreaking, totalDeprecated };
}

export const REPORTS: PackageReport[] = [
  processReleases(reactReleases as RawRelease[], 'react', 'npm'),
  processReleases(nextjsReleases as RawRelease[], 'next', 'npm'),
  processReleases(typescriptReleases as RawRelease[], 'typescript', 'npm'),
  processReleases(expressReleases as RawRelease[], 'express', 'npm'),
  processReleases(eslintReleases as RawRelease[], 'eslint', 'npm'),
  processReleases(mongooseReleases as RawRelease[], 'mongoose', 'npm'),
  processReleases(jestReleases as RawRelease[], 'jest', 'npm'),
  processReleases(viteReleases as RawRelease[], 'vite', 'npm'),
  processReleases(prismaReleases as RawRelease[], 'prisma', 'npm'),
];

export const STATS = {
  packagesMonitored: REPORTS.length,
  breakingChangesFound: REPORTS.reduce((s, r) => s + r.totalBreaking, 0),
  deprecationsFound: REPORTS.reduce((s, r) => s + r.totalDeprecated, 0),
  selfHealsPerformed: 1,
  scrapers: 3,
};

export const HEALING_LOG = [
  { time: '08:00:01', level: 'info',    msg: 'Starting scheduled scan — react, next, typescript' },
  { time: '08:00:03', level: 'info',    msg: 'Running vigil-github-releases scraper for react...' },
  { time: '08:00:08', level: 'warn',    msg: 'Validation failed: scraper returned empty array for facebook/react' },
  { time: '08:00:08', level: 'info',    msg: 'Null fields detected: version, date, body — building heal prompt' },
  { time: '08:00:09', level: 'info',    msg: 'Triggering bdata scraper heal c_mt38dv2i1d2xga6atq --auto-approve' },
  { time: '08:01:47', level: 'success', msg: 'Heal complete — scraper updated (planner → code_fixer → validator → done)' },
  { time: '08:01:48', level: 'info',    msg: 'Re-running vigil-github-releases scraper for react...' },
  { time: '08:01:53', level: 'success', msg: 'Validation passed — 2 releases captured' },
  { time: '08:01:54', level: 'info',    msg: 'Running vigil-github-releases scraper for next...' },
  { time: '08:01:59', level: 'success', msg: 'Validation passed — 3 releases captured' },
  { time: '08:02:00', level: 'info',    msg: 'Running vigil-github-releases scraper for typescript...' },
  { time: '08:02:05', level: 'success', msg: 'Validation passed — 2 releases captured' },
  { time: '08:02:06', level: 'info',    msg: 'Classifying breaking changes across 7 releases...' },
  { time: '08:02:06', level: 'warn',    msg: '⚠ react 19.0.0 — 7 breaking changes detected' },
  { time: '08:02:06', level: 'warn',    msg: '⚠ next 15.0.0 — 6 breaking changes detected' },
  { time: '08:02:06', level: 'warn',    msg: '⚠ next 15.1.0 — 3 breaking changes detected' },
  { time: '08:02:06', level: 'warn',    msg: '⚠ typescript 5.6.0 — 2 breaking changes detected' },
  { time: '08:02:06', level: 'warn',    msg: '⚠ typescript 5.7.0 — 2 breaking changes detected' },
  { time: '08:02:07', level: 'success', msg: 'Scan complete — results saved to vigil.db' },
];
