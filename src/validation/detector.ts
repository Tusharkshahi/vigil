import { Release, ValidationResult } from '../types';

const REQUIRED_RELEASE_FIELDS: (keyof Release)[] = ['version', 'date', 'body'];

/**
 * Check a scraped release object for missing/empty critical fields.
 * Returns a ValidationResult with specific null field names for targeted heal prompts.
 */
export function inspectRelease(item: Partial<Release>): ValidationResult {
  const nullFields: string[] = [];
  const errors: string[] = [];

  for (const field of REQUIRED_RELEASE_FIELDS) {
    const value = item[field];
    if (value === null || value === undefined || String(value).trim() === '') {
      nullFields.push(field);
      errors.push(`Field "${field}" is null or empty`);
    }
  }

  // Body must be meaningful (not just whitespace or boilerplate)
  if (item.body && item.body.trim().length < 20) {
    nullFields.push('body');
    errors.push(`Field "body" is too short (< 20 chars) — likely empty release page`);
  }

  // Version should look like a version number
  if (item.version && !/\d+\.\d+/.test(item.version)) {
    errors.push(`Field "version" doesn't look like a version: "${item.version}"`);
  }

  return {
    valid: nullFields.length === 0 && errors.length === 0,
    errors,
    nullFields,
  };
}

/**
 * Build a targeted heal prompt based on which fields are null.
 * The more specific the prompt, the better the AI heal.
 */
export function buildHealPrompt(nullFields: string[], context: string): string {
  if (nullFields.length === 0) return '';

  const fieldDescriptions: Record<string, string> = {
    version: 'the release version number (e.g. "15.1.0")',
    date: 'the release publish date',
    body: 'the full release notes / changelog text',
    title: 'the release title',
    url: 'the permalink URL to this release',
  };

  const descriptions = nullFields
    .map((f) => fieldDescriptions[f] ?? f)
    .join(', ');

  return (
    `The following fields are returning null or empty: ${nullFields.join(', ')}. ` +
    `Specifically, the scraper cannot extract ${descriptions}. ` +
    `Context: ${context}. ` +
    `Please re-examine the page structure and update the selectors to correctly capture these fields.`
  );
}
