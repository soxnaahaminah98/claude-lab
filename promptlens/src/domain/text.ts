/** Lowercase, trim and strip diacritics so searches ignore case and accents. */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}
