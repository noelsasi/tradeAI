import type { ResultRow } from '@/domain/classification/types.js';

const HEADERS = [
  'Line#',
  'Description',
  'HSCode',
  'Title',
  'Confidence',
  'Risk',
  'OFAC',
  'UN',
  'EU',
  'Source',
  'Reasoning',
].join(',');

function escapeCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(results: ResultRow[]): string {
  const rows = results.map((r) =>
    [
      r.line_number,
      r.raw_description,
      r.user_overridden && r.user_override_code ? r.user_override_code : (r.hs_code ?? ''),
      r.hs_title ?? '',
      r.confidence != null ? (r.confidence * 100).toFixed(1) + '%' : '',
      r.risk_level ?? '',
      r.sanctions_ofac,
      r.sanctions_un,
      r.sanctions_eu,
      r.source ?? '',
      r.ai_reasoning ?? '',
    ]
      .map(escapeCell)
      .join(','),
  );

  return [HEADERS, ...rows].join('\r\n');
}
