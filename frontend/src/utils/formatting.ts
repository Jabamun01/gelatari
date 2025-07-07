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