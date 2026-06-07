/**
 * Normalizes a string by removing combining diacritical marks (accents),
 * so accented characters like à, é, ç are treated as their base vowels.
 * Uses NFD Unicode normalization to decompose then strip combining marks.
 * Also handles the Icelandic Ð/ð (eth) and the German ß (sharp s).
 *
 * @param text - The input string (may contain accented characters).
 * @returns The normalized string with accents removed.
 */
export const normalizeText = (text: string): string => {
  if (!text) return text;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .replace(/\u00D0/g, 'D')          // Ð → D  (Icelandic eth)
    .replace(/\u00F0/g, 'd')          // ð → d
    .replace(/\u00DF/g, 'ss')         // ß → ss (German sharp s)
    .replace(/\u0141/g, 'L')          // Ł → L
    .replace(/\u0142/g, 'l')          // ł → l
    .replace(/\u0152/g, 'OE')         // Œ → OE
    .replace(/\u0153/g, 'oe')         // œ → oe
    .replace(/\u00D8/g, 'O')          // Ø → O
    .replace(/\u00F8/g, 'o');         // ø → o
};

/**
 * Formats a number representing grams into a string with 'g' or 'kg', applying specific rounding rules.
 * - For quantities >= 1000g, converts to kg and rounds to 3 decimal places (e.g., 1723.6g -> "1.724kg").
 * - For quantities < 1000g and >= 50g, rounds to the nearest whole number (e.g., 125.6g -> "126g").
 * - For quantities < 50g, rounds to one decimal place (e.g., 44.36g -> "44.4g").
 * @param grams - The amount in grams.
 * @returns The formatted string.
 */
export const formatAmount = (grams: number): string => {
  if (grams >= 1000) {
    // Convert to kg and round to 3 decimal places
    const kg = grams / 1000;
    return `${kg.toFixed(3)}kg`;
  }
  if (grams >= 50) {
    // Round to the nearest whole number for grams >= 50
    return `${Math.round(grams)}g`;
  }
  // Round to one decimal place for grams < 50
  return `${grams.toFixed(1)}g`;
};

/**
 * Formats a duration in seconds into MM:SS string.
 * @param totalSeconds - The duration in seconds.
 * @returns The formatted string (e.g., "05:30", "00:00").
 */
export const formatDurationMMSS = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
};