import { HEALING_LOG } from '../../lib/data';

const LEVEL_STYLES = {
  info:    { dot: 'bg-blue-500',   text: 'text-blue-400',   label: 'INFO',    badge: 'bg-blue-950 text-blue-400 border-blue-900/50' },
  warn:    { dot: 'bg-yellow-500', text: 'text-yellow-400', label: 'WARN',    badge: 'bg-yellow-950 text-yellow-400 border-yellow-900/50' },
  success: { dot: 'bg-green-500',  text: 'text-green-400',  label: 'OK',      badge: 'bg-green-950 text-green-400 border-green-900/50' },
  error:   { dot: 'bg-red-500',    text: 'text-red-400',    label: 'ERROR',   badge: 'bg-red-950 text-red-400 border-red-900/50' },
} as const;

export default function HealingPage() {
  const healStart = HEALING_LOG.findIndex((l) => l.msg.includes('heal'));
  const healEnd = HEALING_LOG.findIndex((l) => l.msg.includes('Heal complete'));

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-500">◈</span>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Self-Healing System</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Healing Log</h1>
        <p className="text-zinc-400 text-sm">
          Vigil detected that the React scraper returned an empty array. It automatically triggered{' '}
          <code className="font-mono text-xs text-zinc-300">bdata scraper heal --auto-approve</code>{' '}
          and recovered without any human intervention.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-zinc-900 border border-red-900/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">1</div>
          <div className="text-xs text-zinc-500">Scraper failed</div>
        </div>
        <div className="bg-zinc-900 border border-orange-900/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400 mb-1">1m 38s</div>
          <div className="text-xs text-zinc-500">Heal duration</div>
        </div>
        <div className="bg-zinc-900 border border-green-900/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
          <div className="text-xs text-zinc-500">Auto-recovered</div>
        </div>
      </div>

      {/* How the healing works */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 text-sm">
        <div className="font-semibold text-zinc-200 mb-3">Self-healing pipeline</div>
        <div className="flex flex-wrap gap-2 items-center text-xs font-mono">
          {['validation fails', '→', 'null fields detected', '→', 'heal prompt built', '→', 'bdata scraper heal', '→', 'planner', '→', 'code_fixer', '→', 'step_preview_runner', '→', 'validator', '→', 're-run'].map((step, i) => (
            <span key={i} className={step === '→' ? 'text-zinc-600' : 'bg-zinc-800 text-zinc-300 px-2 py-1 rounded'}>
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Log timeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="text-xs text-zinc-500 ml-2 font-mono">vigil — nightly scan log — 2026-08-21</span>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {HEALING_LOG.map((entry, i) => {
            const style = LEVEL_STYLES[entry.level as keyof typeof LEVEL_STYLES];
            const isHealBlock = i >= healStart && i <= healEnd;

            return (
              <div
                key={i}
                className={`flex items-start gap-4 px-5 py-3 text-sm font-mono ${
                  isHealBlock ? 'bg-orange-950/10' : ''
                }`}
              >
                <span className="text-zinc-600 shrink-0 w-16 text-xs pt-0.5">{entry.time}</span>
                <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded border ${style.badge} mt-0.5`}>
                  {style.label}
                </span>
                <span className={`${style.text} leading-relaxed`}>{entry.msg}</span>
                {isHealBlock && i === healStart && (
                  <span className="ml-auto text-xs bg-orange-900/40 text-orange-400 border border-orange-900/50 px-2 py-0.5 rounded shrink-0">
                    healing →
                  </span>
                )}
                {i === healEnd && (
                  <span className="ml-auto text-xs bg-green-900/40 text-green-400 border border-green-900/50 px-2 py-0.5 rounded shrink-0">
                    ← recovered
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-sm text-zinc-500 leading-relaxed">
        <strong className="text-zinc-400">Why did the scraper fail?</strong>
        {' '}The <code className="font-mono text-xs text-zinc-300">vigil-github-releases</code> scraper was initially trained on the Next.js releases page.
        When run against the React repository, the page rendered differently in batch mode and the selectors returned no results.
        Vigil detected the empty array, built a targeted heal prompt describing the missing fields, and invoked{' '}
        <code className="font-mono text-xs text-zinc-300">bdata scraper heal --auto-approve</code>.
        The AI-powered healer updated the selectors in under 2 minutes.
      </div>
    </div>
  );
}
