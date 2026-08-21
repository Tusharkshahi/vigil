import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Resolves the bdata CLI — works via npx or global install
function getBdataCmd(): string {
  try {
    execSync('bdata --version', { stdio: 'ignore' });
    return 'bdata';
  } catch {
    return 'npx -p @brightdata/cli bdata';
  }
}

const BDATA = getBdataCmd();
const TMP_DIR = path.join(os.tmpdir(), 'vigil');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function run(args: string): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync(`${BDATA} ${args}`, {
    shell: true,
    encoding: 'utf8',
    timeout: 900_000, // 15 min — scraper creation can take up to 25 min
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
}

/**
 * Create a new Scraper Studio scraper.
 * Returns the collector_id (c_*) on success.
 */
export function createScraper(url: string, description: string, name: string): string {
  const outFile = path.join(TMP_DIR, `create-${Date.now()}.json`);
  const result = run(
    `scraper create "${url}" "${description}" --name "${name}" --json -o "${outFile}"`
  );

  if (result.exitCode !== 0) {
    throw new Error(`bdata scraper create failed:\n${result.stderr}`);
  }

  const raw = fs.readFileSync(outFile, 'utf8');
  const parsed = JSON.parse(raw);
  const collectorId = parsed.collector_id ?? parsed.id;

  if (!collectorId) {
    throw new Error(`No collector_id in response: ${raw}`);
  }

  fs.unlinkSync(outFile);
  return collectorId as string;
}

/**
 * Run a scraper against a URL and return the parsed JSON result.
 */
export function runScraper(collectorId: string, url: string): unknown {
  const outFile = path.join(TMP_DIR, `run-${Date.now()}.json`);
  const result = run(`scraper run "${collectorId}" "${url}" --json -o "${outFile}"`);

  if (result.exitCode !== 0) {
    throw new Error(`bdata scraper run failed:\n${result.stderr}`);
  }

  const raw = fs.readFileSync(outFile, 'utf8');
  fs.unlinkSync(outFile);
  return JSON.parse(raw);
}

/**
 * Trigger self-healing on a broken scraper.
 * Uses --auto-approve so no manual intervention is needed.
 */
export function healScraper(
  collectorId: string,
  prompt: string,
  verifyUrl: string
): { success: boolean; output: unknown } {
  const outFile = path.join(TMP_DIR, `heal-${Date.now()}.json`);
  const result = run(
    `scraper heal "${collectorId}" "${prompt}" --url "${verifyUrl}" --auto-approve --json -o "${outFile}"`
  );

  if (result.exitCode !== 0) {
    return { success: false, output: { error: result.stderr } };
  }

  const raw = fs.readFileSync(outFile, 'utf8');
  fs.unlinkSync(outFile);
  const parsed = JSON.parse(raw);
  return {
    success: parsed.status === 'done',
    output: parsed,
  };
}
