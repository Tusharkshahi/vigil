import { healScraper, runScraper } from '../scraper/client';
import { validateArray } from '../validation/schema';
import { inspectRelease, buildHealPrompt } from '../validation/detector';
import { getDb } from '../db';
import { HealAttempt, ValidationResult } from '../types';

const MAX_HEAL_ATTEMPTS = 3;

interface HealContext {
  collectorId: string;
  collectorName: string;
  targetUrl: string;
  schemaPath: string;
  onProgress?: (msg: string) => void;
}

/**
 * Run a scraper, validate the output, and auto-heal if validation fails.
 * Returns the final valid output or throws if healing failed after all attempts.
 */
export async function runWithHealing(ctx: HealContext): Promise<unknown> {
  const log = ctx.onProgress ?? console.log;
  const db = getDb();

  for (let attempt = 1; attempt <= MAX_HEAL_ATTEMPTS; attempt++) {
    log(`[${ctx.collectorName}] Running scraper (attempt ${attempt}/${MAX_HEAL_ATTEMPTS})...`);

    let output: unknown;
    try {
      output = runScraper(ctx.collectorId, ctx.targetUrl);
    } catch (err) {
      log(`[${ctx.collectorName}] Scraper run failed: ${(err as Error).message}`);
      if (attempt === MAX_HEAL_ATTEMPTS) throw err;
      continue;
    }

    // Validate the output
    const validation = validateArray(output, ctx.schemaPath);

    if (validation.valid) {
      log(`[${ctx.collectorName}] ✓ Validation passed`);
      db.prepare(
        `INSERT OR REPLACE INTO scraper_status (collector_id, name, healthy, last_run, validation_errors)
         VALUES (?, ?, 1, datetime('now'), '')`
      ).run(ctx.collectorId, ctx.collectorName);
      return output;
    }

    log(`[${ctx.collectorName}] ✗ Validation failed: ${validation.errors.join(', ')}`);

    if (attempt === MAX_HEAL_ATTEMPTS) {
      // Mark as degraded and escalate
      db.prepare(
        `INSERT OR REPLACE INTO scraper_status (collector_id, name, healthy, last_run, validation_errors)
         VALUES (?, ?, 0, datetime('now'), ?)`
      ).run(ctx.collectorId, ctx.collectorName, validation.errors.join('; '));
      throw new Error(
        `[${ctx.collectorName}] Scraper degraded after ${MAX_HEAL_ATTEMPTS} heal attempts. ` +
        `Null fields: ${validation.nullFields.join(', ')}`
      );
    }

    // Build a targeted heal prompt from the null fields
    const firstItem = Array.isArray(output) ? output[0] : output;
    const releaseInspection = inspectRelease(firstItem as Parameters<typeof inspectRelease>[0]);
    const healPrompt = buildHealPrompt(
      releaseInspection.nullFields.length > 0 ? releaseInspection.nullFields : validation.nullFields,
      `scraping ${ctx.targetUrl}`
    );

    log(`[${ctx.collectorName}] Triggering self-heal (attempt ${attempt})...`);
    log(`  Prompt: ${healPrompt}`);

    const healResult = healScraper(ctx.collectorId, healPrompt, ctx.targetUrl);

    // Log heal attempt to SQLite
    const healRecord: Omit<HealAttempt, 'attempt'> & { attempt: number } = {
      collectorId: ctx.collectorId,
      prompt: healPrompt,
      timestamp: new Date().toISOString(),
      success: healResult.success,
      attempt,
    };

    db.prepare(
      `INSERT INTO heal_log (collector_id, prompt, timestamp, success, attempt)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      healRecord.collectorId,
      healRecord.prompt,
      healRecord.timestamp,
      healRecord.success ? 1 : 0,
      healRecord.attempt
    );

    db.prepare(
      `INSERT OR REPLACE INTO scraper_status (collector_id, name, healthy, last_run, last_heal, validation_errors)
       VALUES (?, ?, 0, datetime('now'), datetime('now'), ?)`
    ).run(ctx.collectorId, ctx.collectorName, validation.errors.join('; '));

    if (!healResult.success) {
      log(`[${ctx.collectorName}] Heal attempt ${attempt} did not complete — retrying...`);
    } else {
      log(`[${ctx.collectorName}] Heal attempt ${attempt} completed — re-validating...`);
    }
  }

  throw new Error(`[${ctx.collectorName}] Healing loop exhausted`);
}
