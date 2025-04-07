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