import { Release } from '../types';
import { getDb } from '../db';
import semver from 'semver';

/**
 * Given a list of scraped releases, return only those not yet seen in the DB.
 * "New" = version not in the releases table for this package.
 */
export function findNewReleases(pkg: string, scraped: Release[]): Release[] {
  const db = getDb();
  const seen = db
    .prepare('SELECT version FROM releases WHERE package = ?')
    .all(pkg) as { version: string }[];

  const seenVersions = new Set(seen.map((r) => r.version));

  return scraped.filter((r) => {
    const normalized = semver.clean(r.version) ?? r.version;
    return !seenVersions.has(r.version) && !seenVersions.has(normalized);
  });
}

/**
 * Persist a list of releases to the DB so they aren't re-processed.
 */
export function markSeen(releases: Release[]): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO releases (package, version, date, title, body, url, source)
     VALUES (@package, @version, @date, @title, @body, @url, @source)`
  );

  const insertMany = db.transaction((items: Release[]) => {
    for (const r of items) insert.run(r);
  });

  insertMany(releases);
}

/**
 * Normalize raw scraped output into Release objects.
 * Different scrapers return slightly different field names — this normalizes them.
 */
export function normalizeReleases(pkg: string, raw: unknown, source: Release['source']): Release[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item): Release | null => {
      if (typeof item !== 'object' || item === null) return null;
      const r = item as Record<string, unknown>;

      const version =
        String(r.version ?? r.tag ?? r.tag_name ?? r.name ?? '').replace(/^v/, '') || null;
      const date = String(r.date ?? r.published_at ?? r.created_at ?? r.publishedAt ?? '');
      const body = String(r.body ?? r.content ?? r.description ?? r.release_notes ?? '');
      const title = String(r.title ?? r.name ?? version ?? '');
      const url = String(r.url ?? r.html_url ?? r.link ?? '');

      if (!version || !date) return null;

      return { version, date, title, body, url, source, package: pkg };
    })
    .filter((r): r is Release => r !== null);
}
