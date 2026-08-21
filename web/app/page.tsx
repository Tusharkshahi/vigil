import Link from 'next/link';
import { STATS, REPORTS } from '../lib/data';

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-sm font-medium text-zinc-300 mt-1">{label}</div>
      {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Scrape',
    color: 'text-blue-400',
    border: 'border-blue-900',
    desc: 'Three custom Bright Data Scraper Studio collectors watch GitHub releases, npm version history, and vendor changelogs — continuously.',
  },
  {
    step: '02',
    title: 'Validate',
    color: 'text-yellow-400',
    border: 'border-yellow-900',
    desc: 'AJV schema validation + null field detection checks every response. If fields are missing or the array is empty, healing is triggered automatically.',
  },
  {
    step: '03',
    title: 'Self-Heal',
    color: 'text-orange-400',
    border: 'border-orange-900',
    desc: '`bdata scraper heal --auto-approve` is invoked with a targeted prompt built from the null fields. The AI fixes the selectors. Up to 3 attempts.',
  },
  {
    step: '04',
    title: 'Classify',
    color: 'text-red-400',
    border: 'border-red-900',
    desc: 'Release notes are scanned with regex patterns: BREAKING CHANGE keywords, conventional commit ! notation, removal/deprecation language.',
  },
  {
    step: '05',
    title: 'Alert',
    color: 'text-green-400',
    border: 'border-green-900',
    desc: 'Breaking changes are posted to Slack or Discord webhooks, annotated on GitHub PRs via Actions, and stored in a local SQLite history.',
  },
];

export default function Home() {
  const breakingPackages = REPORTS.filter((r) => r.totalBreaking > 0);

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <div className="pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-400 text-xs font-mono px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {STATS.breakingChangesFound} breaking changes detected across {STATS.packagesMonitored} packages
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-4">
          Know before it{' '}
          <span className="text-red-500">breaks</span>.
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8 text-balance">
          Vigil monitors breaking changes across your engineering stack using Bright Data scrapers — and heals itself when those scrapers break.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/report"
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            View latest report
          </Link>
          <Link
            href="/healing"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Watch healing log →
          </Link>
          <a
            href="https://github.com/Tusharkshahi/vigil"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-100 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            GitHub ↗
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-20">
        <StatCard value={STATS.packagesMonitored} label="Packages monitored" />
        <StatCard value={STATS.breakingChangesFound} label="Breaking changes" sub="found this cycle" />
        <StatCard value={STATS.scrapers} label="Bright Data scrapers" sub="GitHub · npm · Vendor" />
        <StatCard value={STATS.selfHealsPerformed} label="Self-heals" sub="performed automatically" />
      </div>

      {/* Alert banner */}
      <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-5 mb-20">
        <div className="flex items-start gap-3">
          <span className="text-red-400 text-lg mt-0.5">⚠</span>
          <div>
            <div className="font-semibold text-red-300 mb-1">Action required in your stack</div>
            <div className="text-sm text-zinc-400">
              {breakingPackages.map((r, i) => (
                <span key={r.package}>
                  <span className="font-mono text-zinc-300">{r.package}</span> has {r.totalBreaking} breaking change{r.totalBreaking !== 1 ? 's' : ''}
                  {i < breakingPackages.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          </div>
          <Link href="/report" className="ml-auto text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Full report →
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white">How it works</h2>
          <p className="text-zinc-500 mt-2 text-sm">Fully autonomous — scrape, validate, heal, classify, alert.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className={`bg-zinc-900 border ${step.border} rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-mono text-xs font-bold ${step.color}`}>{step.step}</span>
                <span className={`font-semibold text-sm ${step.color}`}>{step.title}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CLI block */}
      <div className="mb-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Drop it into your workflow</h2>
          <p className="text-zinc-500 mt-2 text-sm">CLI, GitHub Actions, Slack/Discord webhooks.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="text-xs text-zinc-500 ml-2 font-mono">Terminal</span>
          </div>
          <pre className="p-6 text-sm font-mono overflow-x-auto text-zinc-300 leading-relaxed">
{`$ vigil check react nextjs typescript --days 30

  Vigil — engineering change intelligence
  ──────────────────────────────────────────────────

  ✓ react 18.3.0 — no breaking changes

  ✗ react 19.0.0 — 7 breaking changes
      • ReactDOM.render removed — use createRoot instead
      • ReactDOM.hydrate removed — use hydrateRoot instead
      • Legacy string refs removed — migrate to useRef
      ...and 4 more
    → https://github.com/facebook/react/releases/tag/v19.0.0

  ✗ next 15.0.0 — 6 breaking changes
      • cookies(), headers(), draftMode() are now async
      • fetch() no longer cached by default
      • React 18 peer dependency removed (requires React 19)
      ...and 3 more
    → https://github.com/vercel/next.js/releases/tag/v15.0.0

  5/6 releases have breaking changes — review before upgrading`}
          </pre>
        </div>
      </div>
    </div>
  );
}
