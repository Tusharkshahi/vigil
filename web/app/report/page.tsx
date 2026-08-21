import { REPORTS } from '../../lib/data';
import type { PackageReport } from '../../lib/data';

function SeverityBadge({ count, type }: { count: number; type: 'breaking' | 'deprecated' }) {
  if (count === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      type === 'breaking'
        ? 'bg-red-950 text-red-400 border border-red-900/50'
        : 'bg-yellow-950 text-yellow-400 border border-yellow-900/50'
    }`}>
      {type === 'breaking' ? '✗' : '⚠'} {count} {type}
    </span>
  );
}

function PackageCard({ report }: { report: PackageReport }) {
  const breakingReleases = report.releases.filter((r) => r.hasBreaking);
  const healthyReleases = report.releases.filter((r) => !r.hasBreaking);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${
        report.totalBreaking > 0 ? 'border-red-900/50 bg-red-950/20' : 'border-zinc-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${report.totalBreaking > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="font-semibold text-white font-mono">{report.package}</span>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{report.ecosystem}</span>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge count={report.totalBreaking} type="breaking" />
          <SeverityBadge count={report.totalDeprecated} type="deprecated" />
          {report.totalBreaking === 0 && (
            <span className="text-xs text-green-400 font-semibold">✓ clean</span>
          )}
        </div>
      </div>

      {/* Breaking releases */}
      {breakingReleases.map((release) => (
        <div key={release.version} className="border-b border-zinc-800/50 last:border-0">
          <div className="px-5 py-3 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-sm font-mono font-semibold">v{release.version}</span>
              <span className="text-xs text-zinc-500">{release.date}</span>
            </div>
            <a
              href={release.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              release notes ↗
            </a>
          </div>
          <ul className="px-5 py-3 space-y-1.5">
            {release.breaking.slice(0, 4).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                <span className="text-zinc-300">{b.summary}</span>
              </li>
            ))}
            {release.breaking.length > 4 && (
              <li className="text-xs text-zinc-500 pl-4">
                …and {release.breaking.length - 4} more
              </li>
            )}
            {release.deprecated.map((d, i) => (
              <li key={`dep-${i}`} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-500 mt-0.5 shrink-0">⚠</span>
                <span className="text-zinc-400">{d.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Healthy releases */}
      {healthyReleases.map((release) => (
        <div key={release.version} className="px-5 py-2.5 flex items-center gap-2 border-t border-zinc-800/30 last:border-0">
          <span className="text-green-500 text-xs">✓</span>
          <span className="font-mono text-sm text-zinc-500">v{release.version}</span>
          <span className="text-xs text-zinc-600">{release.date}</span>
          <span className="text-xs text-zinc-600 ml-auto">no breaking changes</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportPage() {
  const breaking = REPORTS.filter((r) => r.totalBreaking > 0);
  const clean = REPORTS.filter((r) => r.totalBreaking === 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-500">◈</span>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Latest Scan Report</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Breaking Change Report</h1>
        <p className="text-zinc-400 text-sm">
          Scraped via Bright Data Scraper Studio · {REPORTS.reduce((s, r) => s + r.releases.length, 0)} releases analysed across {REPORTS.length} packages
        </p>
      </div>

      {breaking.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 mb-8 text-sm text-red-300">
          <strong className="text-red-400">Action required:</strong>{' '}
          {breaking.length} package{breaking.length !== 1 ? 's' : ''} have breaking changes that may affect your application.
          Review migration guides before upgrading.
        </div>
      )}

      <div className="space-y-5">
        {/* Breaking first */}
        {breaking.map((r) => (
          <PackageCard key={r.package} report={r} />
        ))}
        {/* Clean after */}
        {clean.map((r) => (
          <PackageCard key={r.package} report={r} />
        ))}
      </div>

      <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-sm text-zinc-400">
        <strong className="text-zinc-200 block mb-1">How this data was collected</strong>
        Vigil uses three custom Bright Data Scraper Studio collectors (Collector IDs:{' '}
        <code className="font-mono text-xs text-zinc-300">c_mt38dv2i1d2xga6atq</code> ·{' '}
        <code className="font-mono text-xs text-zinc-300">c_mt38jj1t11smj3ek9e</code> ·{' '}
        <code className="font-mono text-xs text-zinc-300">c_mt38q9ng1pxd02lyaf</code>)
        {' '}to scrape GitHub releases pages, npm version history, and vendor changelogs.
        When a scraper returns invalid data, the self-healing loop automatically calls{' '}
        <code className="font-mono text-xs text-zinc-300">bdata scraper heal --auto-approve</code>.
      </div>
    </div>
  );
}
