import Link from 'next/link';
import { REPORTS } from '../lib/data';
import { InlineChecker } from './components/InlineChecker';

// ─── data ─────────────────────────────────────────────────────────────────────

const totalBreaking = REPORTS.reduce((s, r) => s + r.totalBreaking, 0);
const totalReleases = REPORTS.reduce((s, r) => s + r.releases.length, 0);

const FEATURES = [
  {
    icon: '◎',
    title: 'CLI tool',
    desc: 'Run vigil check react nextjs typescript from any terminal. Get colored, human-readable output — or JSON for CI.',
    color: 'text-blue-400',
  },
  {
    icon: '⊙',
    title: 'GitHub Actions',
    desc: 'A nightly workflow posts breaking change alerts as PR annotations — before your team merges the upgrade.',
    color: 'text-violet-400',
  },
  {
    icon: '◈',
    title: 'Slack & Discord',
    desc: 'Subscribe to a package and get a webhook notification the moment a new breaking version is released.',
    color: 'text-green-400',
  },
  {
    icon: '⟳',
    title: 'Self-healing scrapers',
    desc: 'When a scraper returns empty data, Vigil automatically calls bdata scraper heal — no human needed.',
    color: 'text-orange-400',
  },
];

const PROBLEMS = [
  {
    pkg: 'next',
    version: '15.0.0',
    pain: '`fetch()` stopped caching by default. Stale-looking data flooded production. Three engineers spent a day on it.',
  },
  {
    pkg: 'react',
    version: '19.0.0',
    pain: '`ReactDOM.render` was removed. Your legacy components silently broke on upgrade.',
  },
  {
    pkg: 'typescript',
    version: '5.6.0',
    pain: 'Iterator checks started throwing compile errors on patterns your team had used for years.',
  },
];

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Powered by Bright Data Scraper Studio · open source
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-5 leading-[1.05]">
          Breaking changes —{' '}
          <br className="hidden sm:block" />
          <span className="text-red-500">found before</span>{' '}
          <br className="hidden sm:block" />
          they find you.
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
          Vigil watches GitHub releases and npm changelogs for your dependencies.
          When a new version drops with breaking changes, you know — not after a failed deploy.
        </p>
        <p className="text-sm text-zinc-600 mb-10">
          No sign-up. No agent to install. Paste your{' '}
          <code className="font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">package.json</code>
          {' '}or connect your GitHub org.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/check"
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
          >
            Check my stack →
          </Link>
          <Link
            href="/report"
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
          >
            Browse example report
          </Link>
        </div>

        {/* Inline package checker — the product is the pitch */}
        <div className="text-left">
          <p className="text-xs text-zinc-600 text-center mb-3 font-mono uppercase tracking-widest">
            Try it — type a package name
          </p>
          <InlineChecker />
        </div>
      </section>

      {/* ── Problem section ── */}
      <section className="border-t border-zinc-900 bg-zinc-950/60 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">The problem</p>
            <h2 className="text-3xl font-bold text-white mb-4">
              It was in the release notes.<br className="hidden sm:block" />
              Did anyone read them?
            </h2>
            <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed">
              Breaking changes ship quietly. Teams upgrade packages in PRs, CI passes, and the breakage only surfaces in production.
              By then, it&apos;s expensive.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {PROBLEMS.map((p) => (
              <div key={p.pkg} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-sm font-semibold text-zinc-300">{p.pkg}</span>
                  <span className="text-xs font-mono text-red-400 bg-red-950/50 border border-red-900/30 px-1.5 py-0.5 rounded">
                    v{p.version}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{p.pain}</p>
                <p className="text-xs text-zinc-700 mt-3 italic">All of this was documented. Vigil would have caught it.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Terminal demo ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">The solution</p>
          <h2 className="text-3xl font-bold text-white mb-3">One command. Full picture.</h2>
          <p className="text-zinc-500 text-sm">
            Run Vigil in CI, in a pre-upgrade script, or just before your team touches a dependency.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Titlebar */}
          <div className="flex items-center gap-1.5 px-4 py-3 bg-zinc-950 border-b border-zinc-800">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-xs text-zinc-600 ml-3 font-mono">vigil check</span>
          </div>
          <pre className="p-6 text-sm font-mono leading-relaxed overflow-x-auto">
<span className="text-zinc-600">$</span> <span className="text-zinc-200">vigil check react nextjs typescript --days 30</span>{'\n'}
{'\n'}<span className="text-zinc-600">  Vigil — engineering change intelligence</span>
<span className="text-zinc-700">  ────────────────────────────────────────────</span>
{'\n'}
<span className="text-green-400">  ✓</span> <span className="text-zinc-300">react 18.3.0</span> <span className="text-zinc-600">— no breaking changes</span>
{'\n'}
<span className="text-red-400">  ✗</span> <span className="text-zinc-300">react 19.0.0</span> <span className="text-zinc-500">— 7 breaking changes</span>
<span className="text-zinc-600">      • ReactDOM.render removed — use createRoot</span>
<span className="text-zinc-600">      • ReactDOM.hydrate removed — use hydrateRoot</span>
<span className="text-zinc-600">      • Legacy string refs removed — migrate to useRef</span>
<span className="text-zinc-700">      …and 4 more  →  github.com/facebook/react/releases/v19.0.0</span>
{'\n'}
<span className="text-red-400">  ✗</span> <span className="text-zinc-300">next 15.0.0</span> <span className="text-zinc-500">— 6 breaking changes</span>
<span className="text-zinc-600">      • cookies(), headers() are now async — await them</span>
<span className="text-zinc-600">      • fetch() no longer cached by default</span>
<span className="text-zinc-600">      • Requires React 19 — check peer deps first</span>
<span className="text-zinc-700">      …and 3 more  →  github.com/vercel/next.js/releases/v15.0.0</span>
{'\n'}
<span className="text-yellow-400">  ⚠</span> <span className="text-zinc-300">typescript 5.6.0</span> <span className="text-zinc-500">— 1 breaking change</span>
<span className="text-zinc-600">      • Iterator checks now error on non-iterable types</span>
{'\n'}
<span className="text-zinc-500">  {totalReleases} releases checked · {totalBreaking} breaking changes · review before upgrading</span>
          </pre>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-900 bg-zinc-950/60 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">Under the hood</p>
            <h2 className="text-3xl font-bold text-white mb-3">How Vigil works</h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              Fully automated — from scraping to alerting. No manual curation. No stale data.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-[16.5%] right-[16.5%] h-px bg-zinc-800 z-0" />

            <div className="grid sm:grid-cols-3 gap-4 relative z-10">
              {[
                {
                  num: '1',
                  title: 'Scrape',
                  color: 'bg-blue-950 border-blue-900/60 text-blue-400',
                  dot: 'bg-blue-500',
                  desc: 'Three Bright Data Scraper Studio collectors continuously watch GitHub releases pages, npm version history, and vendor changelogs. Real pages, real data.',
                },
                {
                  num: '2',
                  title: 'Detect & Self-heal',
                  color: 'bg-orange-950/50 border-orange-900/60 text-orange-400',
                  dot: 'bg-orange-500',
                  desc: 'AJV schema validation checks every response. If data is missing, `bdata scraper heal --auto-approve` is called automatically. Up to 3 attempts.',
                },
                {
                  num: '3',
                  title: 'Alert you',
                  color: 'bg-green-950/50 border-green-900/60 text-green-400',
                  dot: 'bg-green-500',
                  desc: 'Breaking changes are classified by regex patterns and conventional commit markers — then pushed to Slack, Discord, GitHub PR comments, or your terminal.',
                },
              ].map((s) => (
                <div key={s.num} className={`border rounded-2xl p-6 ${s.color}`}>
                  <div className={`w-8 h-8 rounded-full ${s.dot} text-white text-xs font-bold flex items-center justify-center mb-4`}>
                    {s.num}
                  </div>
                  <div className="font-semibold text-white mb-2">{s.title}</div>
                  <p className="text-sm leading-relaxed opacity-80">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/healing"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
            >
              See a real self-healing session →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">What you get</p>
          <h2 className="text-3xl font-bold text-white">Works where you work</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex gap-4">
              <span className={`text-2xl ${f.color} shrink-0 mt-0.5`}>{f.icon}</span>
              <div>
                <div className="font-semibold text-zinc-100 mb-1">{f.title}</div>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-zinc-900 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            What&apos;s in your stack?
          </h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Paste your <code className="font-mono text-xs text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">package.json</code> for an instant report,
            or connect a GitHub org to see breaking change exposure across all your repos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/check"
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Check my stack →
            </Link>
            <a
              href="https://github.com/Tusharkshahi/vigil"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              View on GitHub ↗
            </a>
          </div>
          <p className="mt-6 text-xs text-zinc-700">
            Open source · no account required · data powered by Bright Data Scraper Studio
          </p>
        </div>
      </section>

    </div>
  );
}
