import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vigil — Self-Healing Engineering Change Intelligence',
  description: 'Monitor breaking changes across your software stack. Self-heals when scrapers break.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-100 hover:text-white transition-colors">
              <span className="text-red-500 text-xl">◈</span>
              <span className="tracking-tight">Vigil</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/check" className="hover:text-zinc-100 transition-colors font-medium text-zinc-300">Check your stack</Link>
              <Link href="/report" className="hover:text-zinc-100 transition-colors">Report</Link>
              <Link href="/healing" className="hover:text-zinc-100 transition-colors">Healing Log</Link>
              <a
                href="https://github.com/Tusharkshahi/vigil"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-100 transition-colors flex items-center gap-1"
              >
                GitHub
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-zinc-800 mt-24 py-8 text-center text-xs text-zinc-600">
          Built with{' '}
          <a href="https://brightdata.com" className="hover:text-zinc-400 underline transition-colors" target="_blank" rel="noopener noreferrer">
            Bright Data Scraper Studio
          </a>{' '}
          · WeMakeDevs Into the Scrape-Verse 2026
        </footer>
      </body>
    </html>
  );
}
