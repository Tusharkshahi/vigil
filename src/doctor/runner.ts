import { COLLECTORS } from '../scraper/collectors';
import { runScraper } from '../scraper/client';
import { validateArray } from '../validation/schema';
import { healScraper } from '../scraper/client';
import { buildHealPrompt } from '../validation/detector';
import { getDb } from '../db';
import { ScraperStatus } from '../types';
import { printDoctorStatus } from '../reporter/terminal';

/**
 * `vigil doctor` — audits all configured scrapers, shows their health,
 * and optionally triggers healing for degraded ones.
 */
export async function runDoctor(opts: { heal?: boolean } = {}): Promise<ScraperStatus[]> {
  const db = getDb();
  const statuses: ScraperStatus[] = [];

  for (const [, collector] of Object.entries(COLLECTORS)) {
    if (!collector.id) {
      statuses.push({
        collectorId: '',
        name: collector.name,
        healthy: false,
        lastRun: null,
        lastHeal: null,
        validationErrors: ['Collector ID not configured — run vigil setup'],
      });
      continue;
    }

    // Check DB status first
    const stored = db
      .prepare('SELECT * FROM scraper_status WHERE collector_id = ?')
      .get(collector.id) as {
        healthy: number;
        last_run: string | null;
        last_heal: string | null;
        validation_errors: string;
      } | undefined;

    // Do a live validation run
    let healthy = true;
    let validationErrors: string[] = [];

    try {
      const output = runScraper(collector.id, collector.targetPattern.split('{')[0]);
      const validation = validateArray(output, collector.schemaPath);
      healthy = validation.valid;
      validationErrors = validation.errors;

      if (!healthy && opts.heal && validation.nullFields.length > 0) {
        const prompt = buildHealPrompt(
          validation.nullFields,
          `scraping ${collector.targetPattern}`
        );
        console.log(`  Healing ${collector.name}...`);
        healScraper(collector.id, prompt, collector.targetPattern.split('{')[0]);
      }
    } catch (err) {
      healthy = false;
      validationErrors = [(err as Error).message];
    }

    const status: ScraperStatus = {
      collectorId: collector.id,
      name: collector.name,
      healthy,
      lastRun: stored?.last_run ?? null,
      lastHeal: stored?.last_heal ?? null,
      validationErrors,
    };

    statuses.push(status);
  }

  printDoctorStatus(statuses);
  return statuses;
}
