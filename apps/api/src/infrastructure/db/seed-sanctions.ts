/**
 * Loads OpenSanctions consolidated dataset into sanctions_entries.
 *
 * OpenSanctions publishes a free FtM (FollowTheMoney) JSON dataset at:
 *   https://data.opensanctions.org/datasets/latest/sanctions/entities.ftm.json
 *
 * Each line is a JSON entity. We filter for Person/Organization entities that
 * appear on OFAC SDN, UN Consolidated, or EU Consolidated lists.
 *
 * Run: pnpm tsx src/infrastructure/db/seed-sanctions.ts
 * Safe to re-run — checks last seed timestamp and skips if < 7 days old.
 */

import { createInterface } from 'readline';
import { Readable } from 'stream';
import { db } from './client.js';
import { upsertSanctionsEntries, getSanctionsCount } from '@/repositories/sanctions-repository.js';

const DATASET_URL = 'https://data.opensanctions.org/datasets/latest/sanctions/entities.ftm.json';

// Map OpenSanctions dataset names to our list_name enum
const LIST_MAP: Record<string, 'ofac' | 'un' | 'eu'> = {
  'us_ofac_sdn': 'ofac',
  'us_ofac_cons': 'ofac',
  'un_sc_sanctions': 'un',
  'eu_fsf': 'eu',
  'eu_esma_sanclist': 'eu',
};

interface FtmEntity {
  id: string;
  schema: string;
  properties: {
    name?: string[];
    alias?: string[];
    topics?: string[];
    datasets?: string[];
    country?: string[];
    commodity?: string[];
  };
  datasets?: string[];
}

async function shouldSkipSeed(): Promise<boolean> {
  try {
    const [row] = await db<[{ seeded_at: Date }?]>`
      SELECT seeded_at FROM sanctions_seed_runs
      ORDER BY seeded_at DESC LIMIT 1
    `;
    if (!row) return false;
    const age = Date.now() - new Date(row.seeded_at).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return age < sevenDays;
  } catch {
    return false;
  }
}

async function recordSeedRun(source: string, count: number): Promise<void> {
  await db`
    INSERT INTO sanctions_seed_runs (source, record_count)
    VALUES (${source}, ${count})
  `;
}

export async function seedSanctions(force = false): Promise<void> {
  if (!force && (await shouldSkipSeed())) {
    const count = await getSanctionsCount();
    console.log(`[sanctions-seed] Skipping — seeded within last 7 days (${count} entries loaded)`);
    return;
  }

  console.log('[sanctions-seed] Downloading OpenSanctions dataset...');

  let res: Response;
  try {
    res = await fetch(DATASET_URL, { signal: AbortSignal.timeout(120_000) });
  } catch {
    console.warn('[sanctions-seed] Download failed — continuing without sanctions data');
    return;
  }

  if (!res.ok || !res.body) {
    console.warn(`[sanctions-seed] HTTP ${res.status} — continuing without sanctions data`);
    return;
  }

  const nodeStream = Readable.fromWeb(res.body as import('stream/web').ReadableStream<Uint8Array>);
  const rl = createInterface({ input: nodeStream, crlfDelay: Infinity });

  const BATCH_SIZE = 500;
  let batch: Parameters<typeof upsertSanctionsEntries>[0] = [];
  let total = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    let entity: FtmEntity;
    try {
      entity = JSON.parse(line) as FtmEntity;
    } catch {
      continue;
    }

    if (!['Person', 'Organization', 'Company', 'LegalEntity'].includes(entity.schema)) continue;

    const datasets = entity.datasets ?? entity.properties?.datasets ?? [];
    const matchedList = datasets
      .map((d) => LIST_MAP[d])
      .find((l) => l !== undefined);

    if (!matchedList) continue;

    const name = entity.properties?.name?.[0];
    if (!name) continue;

    batch.push({
      listName: matchedList,
      entityName: name,
      aliases: entity.properties?.alias ?? [],
      hsCodes: [],
      country: entity.properties?.country?.[0] ?? null,
    });

    if (batch.length >= BATCH_SIZE) {
      await upsertSanctionsEntries(batch);
      total += batch.length;
      process.stdout.write(`\r[sanctions-seed] Loaded ${total} entries...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertSanctionsEntries(batch);
    total += batch.length;
  }

  await recordSeedRun(DATASET_URL, total);
  console.log(`\n[sanctions-seed] Done — ${total} entries loaded`);
}

// Allow running directly
if (process.argv[1]?.endsWith('seed-sanctions.ts') || process.argv[1]?.endsWith('seed-sanctions.js')) {
  const force = process.argv.includes('--force');
  seedSanctions(force)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[sanctions-seed] Fatal error:', err);
      process.exit(1);
    });
}
