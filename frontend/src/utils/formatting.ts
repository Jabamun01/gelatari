/**
 * Formats a number representing grams into a string with 'g' or 'kg'.
 * Converts to kg with one decimal place if >= 1000g.
 * Rounds to the nearest gram otherwise.
 * @param grams - The amount in grams.
 * @returns The formatted string (e.g., "500g", "1.2kg").
 */
export const formatAmount = (grams: number): string => {
  if (grams >= 1000) {
    // Convert to kg and format to 1 decimal place
    return `${(grams / 1000).toFixed(1)}kg`;
  }
  // Format as grams (integer)
  return `${Math.round(grams)}g`;
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