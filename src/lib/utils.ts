/**
 * Count words in a string. Words are space-separated tokens.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Count characters (including spaces) in a string.
 */
export function countChars(text: string): number {
  return text.length;
}

/**
 * Format a number with commas for display.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Estimate token count from word count (rough approximation).
 * English text averages ~1.3 tokens per word for Claude.
 */
export function estimateTokens(wordCount: number): number {
  return Math.ceil(wordCount * 1.3);
}
