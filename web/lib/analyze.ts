import { REPORTS } from './data';

// Canonical package name mapping  (npm package name → our report key)
const ALIASES: Record<string, string> = {
  next: 'next',
  nextjs: 'next',
  react: 'react',
  'react-dom': 'react',
  typescript: 'typescript',
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
  name: string;
  currentRange: string;
  currentMajor: number | null;
  monitored: boolean;
  atRisk: boolean;       // has breaking releases AHEAD of current version
  releases: ReleaseRisk[];
}

function parseCurrentMajor(range: string): number | null {
  const cleaned = range.replace(/[^0-9]/g, ' ').trim();
  const major = parseInt(cleaned.split(' ')[0]);
  return isNaN(major) ? null : major;
}

function getMajorVersion(version: string): number {
  return parseInt(version.split('.')[0]) || 0;
}

export function analyzePackages(deps: Record<string, string>): PackageRisk[] {
  return Object.entries(deps).map(([name, range]) => {
    const key = ALIASES[name.toLowerCase()];
    const report = key ? REPORTS.find((r) => r.package === key) : undefined;

    if (!report) {
      return {
        name,
        currentRange: range,
        currentMajor: null,
        monitored: false,
        atRisk: false,
        releases: [],
      };
    }

    const currentMajor = parseCurrentMajor(range);

    const releases: ReleaseRisk[] = report.releases.map((r) => {
      const relMajor = getMajorVersion(r.version);
      const isAhead = currentMajor !== null ? relMajor > currentMajor : false;
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

    return {
      name,
      currentRange: range,
      currentMajor,
      monitored: true,
      atRisk,
      releases,
    };
  });
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

// Summary stats from a list of results
export function summarize(results: PackageRisk[]) {
  const monitored = results.filter((r) => r.monitored);
  const atRisk = results.filter((r) => r.atRisk);
  const totalBreaking = atRisk.reduce(
    (s, r) => s + r.releases.filter((rel) => rel.isAhead && rel.breaking.length > 0).reduce((a, rel) => a + rel.breaking.length, 0),
    0
  );
  return { monitored: monitored.length, atRisk: atRisk.length, totalBreaking, total: results.length };
}
