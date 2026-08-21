'use client';

import { useState, useCallback } from 'react';
import { analyzePackages, parsePackageJson, summarize, PackageRisk, ReleaseRisk } from '../../lib/analyze';
import { fetchOrgRepos, fetchPackageJson, GithubRepo } from '../../lib/github';

// ─── Breaking change list with expand/collapse ────────────────────────────────

function BreakingList({ release }: { release: ReleaseRisk }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? release.breaking : release.breaking.slice(0, 3);
  const hidden = release.breaking.length - 3;

  return (
    <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-red-400">v{release.version}</span>
          <span className="text-xs text-zinc-600">{release.date}</span>
        </div>
        <a href={release.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          release notes ↗
        </a>
      </div>
      <ul className="space-y-1.5">
        {visible.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-red-500 shrink-0 mt-0.5">✗</span>
            <span className="leading-relaxed">{b.summary}</span>
          </li>
        ))}
      </ul>
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-red-400/70 hover:text-red-400 transition-colors pl-4 underline underline-offset-2"
        >
          + {hidden} more breaking change{hidden !== 1 ? 's' : ''}
        </button>
      )}
      {release.deprecated.length > 0 && (
        <div className="mt-2 border-t border-red-900/20 pt-2">
          {release.deprecated.slice(0, 2).map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-500 mt-1">
              <span className="text-yellow-600 shrink-0">⚠</span>
              <span>{d.summary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single package row ───────────────────────────────────────────────────────

function PackageRow({ pkg }: { pkg: PackageRisk }) {
  const [open, setOpen] = useState(false);
  const breakingAhead = pkg.releases.filter((r) => r.isAhead && r.breaking.length > 0);
  const safeAhead = pkg.releases.filter((r) => r.isAhead && r.breaking.length === 0);
  const totalBreaking = breakingAhead.reduce((s, r) => s + r.breaking.length, 0);

  return (
    <div className="border-b border-zinc-800/50 last:border-0">
      <button
        onClick={() => pkg.monitored && setOpen((o) => !o)}
        className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors ${pkg.monitored ? 'hover:bg-zinc-800/30 cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${
          pkg.atRisk ? 'bg-red-500' : pkg.monitored ? 'bg-green-500' : 'bg-zinc-700'
        }`} />
        <span className="font-mono text-sm text-zinc-200 flex-1">{pkg.name}</span>
        <span className="text-xs text-zinc-600 font-mono mr-1">{pkg.currentRange}</span>

        {!pkg.monitored && (
          <span className="text-xs text-zinc-600 italic">not tracked</span>
        )}
        {pkg.monitored && pkg.atRisk && (
          <span className="text-xs font-semibold text-red-400 bg-red-950 border border-red-900/50 px-2 py-0.5 rounded-full">
            ⚠ {totalBreaking} breaking {open ? '▲' : '▼'}
          </span>
        )}
        {pkg.monitored && !pkg.atRisk && (
          <span className="text-xs font-semibold text-green-400 bg-green-950 border border-green-900/50 px-2 py-0.5 rounded-full">
            ✓ safe {open ? '▲' : '▼'}
          </span>
        )}
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-3">
          {breakingAhead.length === 0 && (
            <p className="text-sm text-zinc-500 italic">
              All {pkg.releases.length} tracked version{pkg.releases.length !== 1 ? 's' : ''} are safe from your current {pkg.currentRange}.
            </p>
          )}
          {breakingAhead.map((r) => <BreakingList key={r.version} release={r} />)}
          {safeAhead.map((r) => (
            <div key={r.version} className="text-xs text-zinc-600 pl-1">
              v{r.version} — no breaking changes
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Summary banner ───────────────────────────────────────────────────────────

function SummaryBar({ results }: { results: PackageRisk[] }) {
  const s = summarize(results);
  if (s.total === 0) return null;

  return (
    <div className={`rounded-xl border p-4 mb-5 ${
      s.atRisk > 0 ? 'bg-red-950/20 border-red-900/40' : 'bg-green-950/20 border-green-900/40'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`text-3xl font-bold tabular-nums leading-none mt-0.5 ${s.atRisk > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {s.atRisk > 0 ? s.totalBreaking : '✓'}
        </div>
        <div>
          <div className={`font-semibold text-sm ${s.atRisk > 0 ? 'text-red-300' : 'text-green-300'}`}>
            {s.atRisk > 0
              ? `${s.totalBreaking} breaking change${s.totalBreaking !== 1 ? 's' : ''} in your upgrade path`
              : 'Your monitored packages look safe'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {s.atRisk > 0
              ? `${s.atRisk} of ${s.monitored} tracked packages have upcoming breaking changes`
              : `All ${s.monitored} tracked packages are clear`}
            {s.total - s.monitored > 0 && (
              <span className="ml-1">· {s.total - s.monitored} untracked (coverage grows as more scrapers are added)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsTable({ results }: { results: PackageRisk[] }) {
  if (results.length === 0) return null;

  const sorted = [...results].sort((a, b) => {
    if (a.atRisk && !b.atRisk) return -1;
    if (!a.atRisk && b.atRisk) return 1;
    if (a.monitored && !b.monitored) return -1;
    if (!a.monitored && b.monitored) return 1;
    return a.name.localeCompare(b.name);
  });

  // Separate monitored from untracked
  const monitored = sorted.filter((r) => r.monitored);
  const untracked = sorted.filter((r) => !r.monitored);

  return (
    <div className="space-y-3">
      {monitored.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {monitored.map((pkg) => <PackageRow key={pkg.name} pkg={pkg} />)}
        </div>
      )}
      {untracked.length > 0 && (
        <details className="group">
          <summary className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer list-none flex items-center gap-1 py-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {untracked.length} untracked package{untracked.length !== 1 ? 's' : ''} (not yet monitored by Vigil)
          </summary>
          <div className="mt-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
            {untracked.map((pkg) => (
              <div key={pkg.name} className="px-5 py-2.5 flex items-center gap-3 border-b border-zinc-800/30 last:border-0">
                <span className="w-2 h-2 rounded-full bg-zinc-700 shrink-0" />
                <span className="font-mono text-sm text-zinc-500">{pkg.name}</span>
                <span className="text-xs text-zinc-700 font-mono ml-auto">{pkg.currentRange}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Tab 1: paste package.json ────────────────────────────────────────────────

const EXAMPLE = `{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.4"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "eslint": "^8.0.0"
  }
}`;

function PasteTab() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<PackageRisk[] | null>(null);
  const [error, setError] = useState('');

  const analyze = useCallback(() => {
    setError('');
    const deps = parsePackageJson(text);
    if (!deps) { setError('Invalid JSON — paste the full contents of your package.json'); return; }
    setResults(analyzePackages(deps));
  }, [text]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Paste your <code className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">package.json</code> — Vigil checks which of your dependencies have upcoming breaking changes.
        </label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResults(null); }}
          placeholder={EXAMPLE}
          rows={12}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 font-mono text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 resize-y transition-colors"
        />
        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={analyze}
          disabled={!text.trim()}
          className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Analyze stack
        </button>
        <button
          onClick={() => { setText(EXAMPLE); setResults(null); }}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Load example
        </button>
      </div>

      {results && (
        <div>
          <SummaryBar results={results} />
          <ResultsTable results={results} />
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: GitHub org/user scan ─────────────────────────────────────────────

interface RepoResult {
  repo: GithubRepo;
  deps: Record<string, string> | null;
  results: PackageRisk[];
  loading: boolean;
}

function RepoBadge({ rr }: { rr: RepoResult }) {
  const [open, setOpen] = useState(false);
  const s = summarize(rr.results);
  const hasRisk = s.atRisk > 0;
  const monitoredResults = rr.results.filter((r) => r.monitored);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => !rr.loading && rr.deps && setOpen((o) => !o)}
        className={`w-full text-left px-5 py-4 flex items-center gap-3 transition-colors ${rr.deps ? 'hover:bg-zinc-800/30' : ''}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${
          rr.loading ? 'bg-zinc-600 animate-pulse' :
          !rr.deps ? 'bg-zinc-800' :
          hasRisk ? 'bg-red-500' : 'bg-green-500'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-200">{rr.repo.name}</span>
            {rr.repo.language && (
              <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded hidden sm:inline">
                {rr.repo.language}
              </span>
            )}
          </div>
          {rr.repo.description && !rr.loading && (
            <div className="text-xs text-zinc-600 truncate mt-0.5">{rr.repo.description}</div>
          )}
        </div>

        {rr.loading && <span className="text-xs text-zinc-600 animate-pulse">scanning…</span>}
        {!rr.loading && !rr.deps && <span className="text-xs text-zinc-700">no package.json</span>}
        {!rr.loading && rr.deps && (
          <>
            {hasRisk ? (
              <span className="text-xs font-semibold text-red-400 bg-red-950 border border-red-900/50 px-2 py-0.5 rounded-full shrink-0">
                ⚠ {s.totalBreaking} breaking
              </span>
            ) : (
              <span className="text-xs font-semibold text-green-400 bg-green-950 border border-green-900/50 px-2 py-0.5 rounded-full shrink-0">
                ✓ safe
              </span>
            )}
            <span className="text-zinc-700 text-xs">{open ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {open && monitoredResults.length > 0 && (
        <div className="border-t border-zinc-800">
          {monitoredResults.map((pkg) => <PackageRow key={pkg.name} pkg={pkg} />)}
        </div>
      )}
      {open && monitoredResults.length === 0 && (
        <div className="border-t border-zinc-800 px-5 py-3 text-xs text-zinc-600">
          No monitored packages found — dependencies not tracked by Vigil yet.
        </div>
      )}
    </div>
  );
}

function GithubTab() {
  const [input, setInput] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [repos, setRepos] = useState<RepoResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const scan = useCallback(async () => {
    if (!input.trim()) return;
    setError('');
    setRepos([]);
    setScanning(true);

    try {
      const repoList = await fetchOrgRepos(input.trim(), token || undefined);
      const initial: RepoResult[] = repoList.map((repo) => ({
        repo, deps: null, results: [], loading: true,
      }));
      setRepos(initial);

      const BATCH = 5;
      for (let i = 0; i < repoList.length; i += BATCH) {
        const batch = repoList.slice(i, i + BATCH);
        await Promise.all(batch.map(async (repo) => {
          const deps = await fetchPackageJson(repo.full_name, repo.default_branch, token || undefined);
          const results = deps ? analyzePackages(deps) : [];
          setRepos((prev) =>
            prev.map((rr) =>
              rr.repo.full_name === repo.full_name
                ? { ...rr, deps, results, loading: false }
                : rr
            )
          );
        }));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScanning(false);
    }
  }, [input, token]);

  const done = repos.filter((r) => !r.loading);
  const atRisk = done.filter((r) => summarize(r.results).atRisk > 0);
  const withPkg = done.filter((r) => r.deps !== null);

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-500">
        Enter a GitHub username or org — Vigil scans each repository&apos;s <code className="font-mono text-xs bg-zinc-800 px-1 py-0.5 rounded">package.json</code> and shows which ones are exposed to breaking changes.
      </p>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !scanning && scan()}
            placeholder="vercel  or  facebook  or  your-username"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
          />
          <button
            onClick={scan}
            disabled={!input.trim() || scanning}
            className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shrink-0"
          >
            {scanning ? 'Scanning…' : 'Scan'}
          </button>
        </div>

        <button
          onClick={() => setShowToken((s) => !s)}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {showToken ? '▼' : '▶'} GitHub token (optional) — raises the rate limit from 60 to 5,000 requests/hr, enabling more repos
        </button>
        {showToken && (
          <div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
            <p className="text-xs text-zinc-700 mt-1">Token stays in your browser — only sent to api.github.com, never to Vigil.</p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-3">{error}</div>
        )}
      </div>

      {repos.length > 0 && (
        <div>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { val: done.length, sub: 'repos scanned', color: 'text-zinc-300' },
              { val: withPkg.length, sub: 'have package.json', color: 'text-zinc-300' },
              { val: atRisk.length, sub: atRisk.length > 0 ? 'at risk' : 'at risk', color: atRisk.length > 0 ? 'text-red-400' : 'text-green-400' },
            ].map(({ val, sub, color }) => (
              <div key={sub} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold tabular-nums ${color}`}>{val}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {scanning && (
            <p className="text-xs text-zinc-600 mb-3 animate-pulse">
              Scanning {repos.filter((r) => r.loading).length} remaining repos…
            </p>
          )}

          {/* Repos — at-risk first, then safe, then no-package.json */}
          <div className="space-y-2">
            {[...repos]
              .sort((a, b) => {
                if (a.loading !== b.loading) return a.loading ? 1 : -1;
                const aR = summarize(a.results).atRisk > 0;
                const bR = summarize(b.results).atRisk > 0;
                if (aR !== bR) return aR ? -1 : 1;
                if ((a.deps !== null) !== (b.deps !== null)) return a.deps ? -1 : 1;
                return 0;
              })
              .map((rr) => <RepoBadge key={rr.repo.full_name} rr={rr} />)
            }
          </div>

          {!scanning && !token && repos.length >= 20 && (
            <p className="text-xs text-zinc-700 mt-4 text-center">
              Showing first 20 repos · add a GitHub token above to scan more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'paste',  label: 'Paste package.json' },
  { id: 'github', label: 'Scan GitHub org / user' },
] as const;

type Tab = typeof TABS[number]['id'];

export default function CheckPage() {
  const [tab, setTab] = useState<Tab>('paste');

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-red-500">◈</span>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Stack Analyser</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Check your stack</h1>
        <p className="text-zinc-400 text-sm max-w-xl">
          See which packages in your project have upcoming breaking changes — so you know what to expect before upgrading.
        </p>
      </div>

      <div className="flex border-b border-zinc-800 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'paste'  && <PasteTab />}
      {tab === 'github' && <GithubTab />}
    </div>
  );
}
