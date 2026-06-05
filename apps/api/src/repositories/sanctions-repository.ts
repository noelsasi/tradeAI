import { db } from '@/infrastructure/db/client.js';

export interface SanctionsMatch {
  entity_name: string;
  list_name: 'ofac' | 'un' | 'eu';
  country: string | null;
}

// Screen a description + HS code against the loaded sanctions_entries table.
// Matches on:
//   a) HS code appears in the entity's hs_codes array, OR
//   b) A keyword from the description matches entity_name / aliases (full-text)
export async function findSanctionsMatches(
  description: string,
  hsCode: string,
): Promise<SanctionsMatch[]> {
  const stripped = hsCode.replace(/\./g, '');

  // Cap description to first 200 chars for tsquery — avoids very long invoices blowing up
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 3)  // skip short stopwords
    .slice(0, 10)
    .join(' & ');

  if (!words) return [];

  return db<SanctionsMatch[]>`
    SELECT DISTINCT entity_name, list_name, country
    FROM sanctions_entries
    WHERE
      ${stripped} = ANY(hs_codes)
      OR (
        ${words} != ''
        AND to_tsvector('english', entity_name) @@ to_tsquery('english', ${words})
      )
    LIMIT 10
  `;
}

// Used by the seed script to bulk-upsert OpenSanctions entries
export async function upsertSanctionsEntries(
  entries: Array<{
    listName: 'ofac' | 'un' | 'eu';
    entityName: string;
    aliases: string[];
    hsCodes: string[];
    country: string | null;
  }>,
): Promise<void> {
  if (entries.length === 0) return;

  const rows = entries.map((e) => ({
    list_name: e.listName,
    entity_name: e.entityName,
    aliases: e.aliases,
    hs_codes: e.hsCodes,
    country: e.country,
  }));

  await db`
    INSERT INTO sanctions_entries (list_name, entity_name, aliases, hs_codes, country, updated_at)
    SELECT
      e.list_name,
      e.entity_name,
      ARRAY(SELECT jsonb_array_elements_text(e.aliases)),
      ARRAY(SELECT jsonb_array_elements_text(e.hs_codes)),
      e.country,
      NOW()
    FROM jsonb_to_recordset(${db.json(rows)}::jsonb) AS e(list_name text, entity_name text, aliases jsonb, hs_codes jsonb, country text)
    ON CONFLICT DO NOTHING
  `;
}

export async function getSanctionsCount(): Promise<number> {
  const [row] = await db<[{ count: string }]>`SELECT COUNT(*)::text AS count FROM sanctions_entries`;
  return parseInt(row.count, 10);
}
