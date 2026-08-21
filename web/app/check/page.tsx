'use client';

import { useState, useCallback } from 'react';
import { analyzePackages, parsePackageJson, summarize, PackageRisk } from '../../lib/analyze';
import { fetchOrgRepos, fetchPackageJson, GithubRepo } from '../../lib/github';

// ─── shared sub-components ────────────────────────────────────────────────────

function RiskBadge({ atRisk, monitored }: { atRisk: boolean; monitored: boolean }) {
  if (!monitored) return <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">not monitored</span>;
  if (atRisk) return <span className="text-xs text-red-400 bg-red-950 border border-red-900/50 px-2 py-0.5 rounded-full">⚠ at risk</span>;
  return <span className="text-xs text-green-400 bg-green-950 border border-green-900/50 px-2 py-0.5 rounded-full">✓ safe</span>;
}

function PackageRow({ pkg }: { pkg: PackageRisk }) {
  const [open, setOpen] = useState(false);
  const breakingAhead = pkg.releases.filter((r) => r.isAhead && r.breaking.length > 0);
  const deprecatedAhead = pkg.releases.filter((r) => r.isAhead && r.deprecated.length > 0);

  return (
    <div className="border-b border-zinc-800/50 last:border-0">
      <button
        onClick={() => pkg.monitored && setOpen((o) => !o)}
        className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${pkg.atRisk ? 'bg-red-500' : pkg.monitored ? 'bg-green-500' : 'bg-zinc-600'}`} />
        <span className="font-mono text-sm text-zinc-200 flex-1">{pkg.name}</span>
        <span className="text-xs text-zinc-500 mr-2">{pkg.currentRange}</span>
        <RiskBadge atRisk={pkg.atRisk} monitored={pkg.monitored} />
        {pkg.monitored && <span className="text-zinc-600 text-xs ml-1">{open ? '▲' : '▼'}</span>}
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-2">
          {breakingAhead.length === 0 && deprecatedAhead.length === 0 && (
            <p className="text-sm text-zinc-500">All tracked versions are safe for your current range.</p>
          )}
          {breakingAhead.map((r) => (
            <div key={r.version} className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-semibold text-red-400">v{r.version}</span>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  release notes ↗
                </a>
              </div>
              <ul className="space-y-1">
                {r.breaking.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                    <span>{b.summary}</span>
                  </li>
                ))}
                {r.breaking.length > 3 && (
                  <li className="text-xs text-zinc-500 pl-4">…and {r.breaking.length - 3} more</li>
                )}
              </ul>
            </div>
          ))}
          {deprecatedAhead.map((r) => (
            <div key={`dep-${r.version}`} className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
              <span className="font-mono text-xs text-yellow-400 font-semibold">v{r.version} — deprecations</span>
              <ul className="mt-1 space-y-0.5">
                {r.deprecated.slice(0, 2).map((d, i) => (
                  <li key={i} className="text-xs text-zinc-400 pl-3">⚠ {d.summary}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ results }: { results: PackageRisk[] }) {
  const s = summarize(results);
  if (s.total === 0) return null;
  return (
    <div className={`rounded-xl border p-4 mb-6 flex items-center gap-4 ${
      s.atRisk > 0 ? 'bg-red-950/20 border-red-900/40' : 'bg-green-950/20 border-green-900/40'
    }`}>
      <div className={`text-3xl font-bold tabular-nums ${s.atRisk > 0 ? 'text-red-400' : 'text-green-400'}`}>
        {s.atRisk > 0 ? s.totalBreaking : '✓'}
      </div>
      <div>
        <div className={`font-semibold text-sm ${s.atRisk > 0 ? 'text-red-300' : 'text-green-300'}`}>
          {s.atRisk > 0 ? `${s.totalBreaking} breaking change${s.totalBreaking !== 1 ? 's' : ''} ahead` : 'Stack looks safe'}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {s.atRisk > 0
            ? `${s.atRisk} of ${s.monitored} monitored packages have upcoming breaking changes`
            : `All ${s.monitored} monitored packages are clear`}
          {s.total - s.monitored > 0 && ` · ${s.total - s.monitored} not yet tracked by Vigil`}
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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {sorted.map((pkg) => <PackageRow key={pkg.name} pkg={pkg} />)}
    </div>
  );
}

// ─── Tab 1: paste package.json ────────────────────────────────────────────────

const EXAMPLE = JSON.stringify({
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    next: '^14.0.4',
  },
  devDependencies: {
    typescript: '^5.0.0',
    eslint: '^8.0.0',
  },
}, null, 2);

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
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Paste your <code className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">package.json</code>
        </label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResults(null); }}
          placeholder={EXAMPLE}
          rows={12}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 font-mono text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 resize-none transition-colors"
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
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
          <p className="text-xs text-zinc-600 mt-3">
            Click any monitored package to see specific breaking changes. Only packages tracked by Vigil scrapers are analysed — coverage grows as more scrapers are added.
          </p>
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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => rr.deps && setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-center gap-3"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${
          rr.loading ? 'bg-zinc-600 animate-pulse' :
          rr.deps === null ? 'bg-zinc-700' :
          hasRisk ? 'bg-red-500' : 'bg-green-500'
        }`} />

        <span className="font-semibold text-zinc-200 flex-1 text-sm">{rr.repo.name}</span>

        {rr.loading && <span className="text-xs text-zinc-500">scanning…</span>}
        {!rr.loading && rr.deps === null && <span className="text-xs text-zinc-600">no package.json</span>}
        {!rr.loading && rr.deps && (
          <>
            {hasRisk
              ? <span className="text-xs text-red-400 bg-red-950 border border-red-900/50 px-2 py-0.5 rounded-full">⚠ {s.totalBreaking} breaking</span>
              : <span className="text-xs text-green-400 bg-green-950 border border-green-900/50 px-2 py-0.5 rounded-full">✓ safe</span>
            }
            <span className="text-zinc-600 text-xs">{open ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {open && rr.deps && (
        <div className="border-t border-zinc-800">
          {rr.results.filter(r => r.monitored).map((pkg) => (
            <PackageRow key={pkg.name} pkg={pkg} />
          ))}
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

      // Initialise all rows as loading
      const initial: RepoResult[] = repoList.map((repo) => ({
        repo, deps: null, results: [], loading: true,
      }));
      setRepos(initial);

      // Scan each repo concurrently in batches of 5
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
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">GitHub username or org</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && scan()}
            placeholder="e.g.  vercel  or  facebook"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
          />
        </div>

        <div>
          <button
            onClick={() => setShowToken((s) => !s)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showToken ? '▲' : '▼'} {showToken ? 'Hide' : 'Add'} GitHub token (optional — raises rate limit from 60 to 5,000 req/hr)
          </button>
          {showToken && (
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          )}
          {showToken && <p className="text-xs text-zinc-600 mt-1">Token is stored in memory only — never sent to any server, only to api.github.com.</p>}
        </div>

        <button
          onClick={scan}
          disabled={!input.trim() || scanning}
          className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          {scanning ? 'Scanning repos…' : 'Scan repositories'}
        </button>

        {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3">{error}</p>}
      </div>

      {repos.length > 0 && (
        <div>
          {/* Summary */}
          {done.length > 0 && (
            <div className="flex items-center gap-6 text-sm mb-5 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="text-center">
                <div className="text-xl font-bold text-white tabular-nums">{done.length}</div>
                <div className="text-xs text-zinc-500">repos scanned</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-zinc-300 tabular-nums">{withPkg.length}</div>
                <div className="text-xs text-zinc-500">have package.json</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold tabular-nums ${atRisk.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{atRisk.length}</div>
                <div className="text-xs text-zinc-500">at risk</div>
              </div>
              {scanning && (
                <div className="ml-auto text-xs text-zinc-500 animate-pulse">
                  scanning {repos.filter(r => r.loading).length} remaining…
                </div>
              )}
            </div>
          )}

          {/* Repos — at-risk first */}
          <div className="space-y-3">
            {[...repos]
              .sort((a, b) => {
                if (a.loading && !b.loading) return 1;
                if (!a.loading && b.loading) return -1;
                const aRisk = summarize(a.results).atRisk > 0;
                const bRisk = summarize(b.results).atRisk > 0;
                if (aRisk && !bRisk) return -1;
                if (!aRisk && bRisk) return 1;
                return 0;
              })
              .map((rr) => <RepoBadge key={rr.repo.full_name} rr={rr} />)
            }
          </div>

          {!scanning && !token && repos.length >= 20 && (
            <p className="text-xs text-zinc-600 mt-4 text-center">
              Showing first 20 repos (unauthenticated limit). Add a GitHub token above to scan more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'paste', label: 'Paste package.json' },
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
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Breaking Change Scanner</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Check your stack</h1>
        <p className="text-zinc-400 text-sm">
          See which packages in your project have upcoming breaking changes — before you upgrade.
        </p>
      </div>

      {/* Tabs */}
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
