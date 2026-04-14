/**
 * Extract likely token symbol from a market title.
 * Handles common formats: "PENGUIN", "$PENGUIN", "$SOL"
 * Returns the symbol without $ prefix, or null.
 */
export function extractTokenSymbol(
  title: string,
  category?: string | null
): string | null {
  if (category && category !== "Crypto") return null;
  const words = title.split(/\s+/);
  // Match $PENGUIN or PENGUIN style (2-10 uppercase letters, optional $ prefix)
  for (const word of words) {
    // Strip leading $ and any trailing punctuation (?,.)
    const cleaned = word.replace(/^\$/, "").replace(/[?.,:!]+$/, "");
    if (/^[A-Z]{2,10}$/.test(cleaned)) {
      return cleaned;
    }
  }
  return null;
}
