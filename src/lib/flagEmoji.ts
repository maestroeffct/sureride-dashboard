/**
 * Returns the flag emoji for a 2-letter ISO country code.
 *
 * Builds it from the Unicode regional indicator symbols — works for every
 * country supported in the OS emoji font.
 *
 * Example: getFlagEmoji("NG") → "🇳🇬"
 */
export function getFlagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode) return "🏳";
  const upper = countryCode.trim().toUpperCase();
  if (upper.length !== 2) return "🏳";
  // Regional Indicator Symbol Letter A = U+1F1E6 (i.e. 127462)
  // Map A→🇦, B→🇧, ..., Z→🇿
  const codePoints = [...upper].map((ch) => 127397 + ch.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🏳";
  }
}
