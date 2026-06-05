import { createHash } from 'crypto';

export function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')  // strip punctuation
    .replace(/\s+/g, ' ')       // collapse whitespace
    .trim();
}

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
