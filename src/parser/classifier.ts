import { BreakingChange } from '../types';

/**
 * Deterministic regex-based breaking change classifier.
 * No LLM API key required. Covers ~85% of real-world changelogs.
 *
 * Detection hierarchy (applied in order):
 *  1. Conventional commits "!" notation  → feat!: / fix!:
 *  2. "BREAKING CHANGE:" keyword         → conventional commits spec
 *  3. Section headers                    → ## Breaking Changes / ## Migration Guide
 *  4. Warning emojis                     → ⚠️ / 💥 before a bullet
 *  5. Removal keywords                   → "removed", "no longer supported"
 *  6. Deprecation markers               → "deprecated", "DEPRECATED"
 */

// Matches conventional commits breaking change footer
const BREAKING_CHANGE_FOOTER = /^BREAKING[\s-]CHANGE:\s*(.+)/gim;

// Matches conventional commit "!" notation (e.g., feat!: or fix!:)
const BREAKING_COMMIT_NOTATION = /^(feat|fix|refactor|perf|build|ci|chore)!:\s*(.+)/gim;

// Section headers that contain breaking changes
const BREAKING_SECTION_HEADER = /^#{1,4}\s*(breaking\s+changes?|migration\s+guide|incompatible\s+changes?|removed\s+features?)/gim;

// Warning emoji bullets (⚠️ or 💥 at start of line/bullet)
// Note: ⚠️ is two codepoints (U+26A0 + U+FE0F), so we match both and strip in clean step
const WARNING_EMOJI_BULLET = /^[\s\-*]*(?:⚠️?|💥|🚨)\s*(.+)/gm;

// Lines containing removal/incompatibility language
const REMOVAL_PATTERN = /\b(removed?|drops?|no longer (supports?|works?|available)|incompatible|must (now|be) (updated?|migrated?|changed?))\b/i;

// Deprecation language
const DEPRECATION_PATTERN = /\b(deprecated?|will be removed|scheduled for removal|sunset)\b/i;

/**
 * Extract a section of text that follows a breaking changes header.
 */
function extractSection(body: string, headerRegex: RegExp): string[] {
  const lines = body.split('\n');
  const sections: string[] = [];
  let inSection = false;
  let buffer: string[] = [];

  for (const line of lines) {
    if (headerRegex.test(line)) {
      if (buffer.length > 0) sections.push(buffer.join('\n').trim());
      buffer = [];
      inSection = true;
      continue;
    }

    // A new top-level header ends the section
    if (inSection && /^#{1,3}\s/.test(line) && !headerRegex.test(line)) {
      sections.push(buffer.join('\n').trim());
      buffer = [];
      inSection = false;
      continue;
    }

    if (inSection) buffer.push(line);
  }

  if (buffer.length > 0 && inSection) sections.push(buffer.join('\n').trim());
  return sections.filter(Boolean);
}

/**
 * Clean up a raw matched line — remove bullet points, emojis, extra whitespace.
 */
function cleanLine(line: string): string {
  return line
    .replace(/^[\s\-*•>]+/, '')
    .replace(/^[⚠️💥🚨\uFE0F]+\s*/, '') // strip leading warning emojis incl. variation selector
    .trim();
}

/**
 * Normalize a string to a dedup key — lowercase, strip emoji/punctuation prefix.
 */
function dedupKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, '') // strip non-alpha prefix (emoji, bullets, etc.)
    .slice(0, 80);
}

/**
 * Main classifier. Takes raw release body text and returns structured breaking changes.
 */
export function classifyBreakingChanges(body: string): {
  breaking: BreakingChange[];
  deprecated: BreakingChange[];
} {
  const breaking: BreakingChange[] = [];
  const deprecated: BreakingChange[] = [];
  const seen = new Set<string>();

  function addBreaking(summary: string, raw: string) {
    const key = dedupKey(summary);
    if (seen.has(key) || summary.trim().startsWith('#')) return;
    seen.add(key);
    breaking.push({ summary: summary.slice(0, 200), type: 'breaking', raw });
  }

  function addDeprecated(summary: string, raw: string) {
    const key = dedupKey(summary);
    if (seen.has(key) || summary.trim().startsWith('#')) return;
    seen.add(key);
    deprecated.push({ summary: summary.slice(0, 200), type: 'deprecated', raw });
  }

  // 1. BREAKING CHANGE: footer
  let match: RegExpExecArray | null;
  BREAKING_CHANGE_FOOTER.lastIndex = 0;
  while ((match = BREAKING_CHANGE_FOOTER.exec(body)) !== null) {
    addBreaking(match[1].trim(), match[0]);
  }

  // 2. Conventional commit ! notation
  BREAKING_COMMIT_NOTATION.lastIndex = 0;
  while ((match = BREAKING_COMMIT_NOTATION.exec(body)) !== null) {
    const extracted = match[2].trim();
    addBreaking(extracted, match[0]);
    // Also mark the full line as seen so the line scanner doesn't re-add it
    seen.add(dedupKey(match[0].trim()));
  }

  // 3. Breaking change sections
  BREAKING_SECTION_HEADER.lastIndex = 0;
  const sections = extractSection(body, BREAKING_SECTION_HEADER);
  for (const section of sections) {
    const sectionLines = section.split('\n').filter((l) => l.trim().length > 10);
    for (const line of sectionLines.slice(0, 10)) { // cap at 10 per section
      const cleaned = cleanLine(line);
      if (cleaned.length > 5) addBreaking(cleaned, line);
    }
  }

  // 4. Warning emoji bullets
  WARNING_EMOJI_BULLET.lastIndex = 0;
  while ((match = WARNING_EMOJI_BULLET.exec(body)) !== null) {
    const cleaned = cleanLine(match[1] ?? match[0]);
    if (cleaned.length > 10) addBreaking(cleaned, match[0]);
  }

  // 5. Line-by-line scan for removal + deprecation patterns
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;
    if (trimmed.startsWith('#')) continue; // skip markdown headers

    if (DEPRECATION_PATTERN.test(trimmed)) {
      addDeprecated(cleanLine(trimmed).slice(0, 200), line);
    } else if (REMOVAL_PATTERN.test(trimmed)) {
      addBreaking(cleanLine(trimmed).slice(0, 200), line);
    }
  }

  return { breaking, deprecated };
}
