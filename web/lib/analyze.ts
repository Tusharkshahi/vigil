import { REPORTS } from './data';

// npm package name → our report key (react-dom counts as react, etc.)
const ALIASES: Record<string, string> = {
  next: 'next',
  nextjs: 'next',
  react: 'react',
  'react-dom': 'react',          // dedup — same breaking changes as react
  typescript: 'typescript',
  ts: 'typescript',
};

export interface ReleaseRisk {
  version: string;
  date: string;
  url: string;
  breaking: { summary: string }[];
  deprecated: { summary: string }[];
  isAhead: boolean;
}

export interface PackageRisk {
  name: string;                  // display name (first alias seen)
  currentRange: string;
  currentVersion: SemVer | null;
  monitored: boolean;
  atRisk: boolean;
  releases: ReleaseRisk[];
}

interface SemVer { major: number; minor: number; patch: number }

function parseSemVer(range: string): SemVer | null {
  // Strip everything that isn't a digit or dot, then parse
  const cleaned = range.replace(/[^0-9.]/g, '').trim();
  const parts = cleaned.split('.').map(Number);
  if (!parts.length || isNaN(parts[0])) return null;
  return { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };
}

function semverGt(a: SemVer, b: SemVer): boolean {
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}

export function analyzePackages(deps: Record<string, string>): PackageRisk[] {
  const seenCanonical = new Set<string>(); // deduplicate react + react-dom etc.
  const results: PackageRisk[] = [];

  for (const [name, range] of Object.entries(deps)) {
    const canonical = ALIASES[name.toLowerCase()];
    if (canonical && seenCanonical.has(canonical)) continue; // skip duplicate
    if (canonical) seenCanonical.add(canonical);

    const report = canonical ? REPORTS.find((r) => r.package === canonical) : undefined;

    if (!report) {
      results.push({
        name,
        currentRange: range,
        currentVersion: null,
        monitored: false,
        atRisk: false,
        releases: [],
      });
      continue;
    }

    const currentVersion = parseSemVer(range);

    const releases: ReleaseRisk[] = report.releases.map((r) => {
      const relVer = parseSemVer(r.version);
      const isAhead = currentVersion !== null && relVer !== null
        ? semverGt(relVer, currentVersion)
        : false;
      return {
        version: r.version,
        date: r.date,
        url: r.url,
        breaking: r.breaking,
        deprecated: r.deprecated,
        isAhead,
      };
    });

    const atRisk = releases.some((r) => r.isAhead && r.breaking.length > 0);

    results.push({
      name,
      currentRange: range,
      currentVersion,
      monitored: true,
      atRisk,
      releases,
    });
  }

  return results;
}

export function parsePackageJson(text: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(text);
    return {
      ...(parsed.dependencies ?? {}),
      ...(parsed.devDependencies ?? {}),
      ...(parsed.peerDependencies ?? {}),
    };
  } catch {
    return null;
  }
}

export function summarize(results: PackageRisk[]) {
  const monitored = results.filter((r) => r.monitored);
  const atRisk = results.filter((r) => r.atRisk);
  const totalBreaking = atRisk.reduce(
    (s, r) =>
      s + r.releases
        .filter((rel) => rel.isAhead && rel.breaking.length > 0)
        .reduce((a, rel) => a + rel.breaking.length, 0),
    0
  );
  return {
    monitored: monitored.length,
    atRisk: atRisk.length,
    totalBreaking,
    total: results.length,
  };
}
