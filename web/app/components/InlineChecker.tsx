'use client';

import { useState } from 'react';
import Link from 'next/link';
import { analyzePackages } from '../../lib/analyze';

const POPULAR = ['react', 'next', 'typescript'];

export function InlineChecker() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ReturnType<typeof analyzePackages>[0] | null>(null);
  const [notFound, setNotFound] = useState(false);

  function check(name: string) {
    const pkg = name.trim().toLowerCase();
    if (!pkg) return;
    const results = analyzePackages({ [pkg]: '*' });
    // Use * so version comparison is skipped, show all releases
    const r = results[0];
    if (!r || !r.monitored) { setNotFound(true); setResult(null); return; }
    setNotFound(false);
    setResult(r);
  }

  const breakingReleases = result?.releases.filter((r) => r.breaking.length > 0) ?? [];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xl mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null); setNotFound(false); }}
          onKeyDown={(e) => e.key === 'Enter' && check(query)}
          placeholder="react, next, typescript…"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
        />
        <button
          onClick={() => check(query)}
          className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm shrink-0"
        >
          Check
        </button>
      </div>

      <div className="flex gap-2 mt-2.5">
        {POPULAR.map((p) => (
          <button
            key={p}
            onClick={() => { setQuery(p); check(p); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors font-mono"
          >
            {p}
          </button>
        ))}
      </div>

      {notFound && (
        <div className="mt-4 text-sm text-zinc-500 text-center py-3">
          Not tracked yet.{' '}
          <Link href="/check" className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors">
            Scan your full package.json →
          </Link>
        </div>
      )}

      {result && (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono font-semibold text-zinc-200">{result.name}</span>
            {breakingReleases.length > 0 ? (
              <span className="text-xs text-red-400 bg-red-950 border border-red-900/50 px-2 py-0.5 rounded-full font-semibold">
                ⚠ {breakingReleases.reduce((s, r) => s + r.breaking.length, 0)} breaking changes tracked
              </span>
            ) : (
              <span className="text-xs text-green-400 bg-green-950 border border-green-900/50 px-2 py-0.5 rounded-full font-semibold">
                ✓ no breaking changes tracked
              </span>
            )}
          </div>
          {breakingReleases.slice(0, 2).map((r) => (
            <div key={r.version} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-red-400 font-semibold">v{r.version}</span>
                <span className="text-xs text-zinc-600">{r.date}</span>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-zinc-400 ml-auto transition-colors">notes ↗</a>
              </div>
              {r.breaking.slice(0, 2).map((b, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-400 mb-0.5">
                  <span className="text-red-500 shrink-0">✗</span>
                  <span className="leading-relaxed">{b.summary}</span>
                </div>
              ))}
              {r.breaking.length > 2 && (
                <div className="text-xs text-zinc-600 pl-4">+{r.breaking.length - 2} more</div>
              )}
            </div>
          ))}
          <Link
            href="/check"
            className="mt-3 block text-center text-xs text-red-400 hover:text-red-300 transition-colors border border-red-900/40 rounded-lg py-2 hover:bg-red-950/20"
          >
            Check against your actual version in package.json →
          </Link>
        </div>
      )}
    </div>
  );
}
