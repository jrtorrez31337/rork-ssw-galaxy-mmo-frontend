/**
 * Client-side profanity filter
 *
 * This filter runs on the client to mask profanity in displayed messages.
 * It's a user preference that defaults to ON but can be toggled off.
 *
 * Note: The backend also has a profanity filter, but this gives users
 * control over what they see regardless of what others send.
 */

// Common profanity words to filter (kept minimal and tasteful)
// This list can be expanded as needed
const PROFANITY_LIST: string[] = [
  // Common English profanity
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'bastard', 'crap',
  'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'fag', 'retard',
  // Common variations
  'f u c k', 'f-u-c-k', 's h i t', 's-h-i-t',
  'a s s', 'a-s-s', 'b i t c h', 'b-i-t-c-h',
  // Leet speak variations
  'f4ck', 'sh1t', 'b1tch', 'a55', 'd1ck', 'c0ck',
  // Additional
  'motherfucker', 'fucker', 'fucking', 'fucked',
  'shitty', 'bullshit', 'horseshit', 'dipshit',
  'asshole', 'asswipe', 'dumbass', 'jackass',
];

// Build regex pattern for each word (case insensitive, word boundaries)
const buildPattern = (word: string): RegExp => {
  // Escape special regex characters
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Allow for common character substitutions
  const flexible = escaped
    .replace(/a/gi, '[a@4]')
    .replace(/e/gi, '[e3]')
    .replace(/i/gi, '[i1!]')
    .replace(/o/gi, '[o0]')
    .replace(/s/gi, '[s$5]')
    .replace(/t/gi, '[t7]');
  return new RegExp(flexible, 'gi');
};

// Pre-compile patterns for performance
const PROFANITY_PATTERNS: RegExp[] = PROFANITY_LIST.map(buildPattern);

/**
 * Filter profanity from a message
 * Replaces profane words with asterisks
 *
 * @param text - The message text to filter
 * @returns The filtered message with profanity masked
 */
export function filterProfanity(text: string): string {
  let filtered = text;

  for (const pattern of PROFANITY_PATTERNS) {
    filtered = filtered.replace(pattern, (match) => {
      // Replace with asterisks of same length
      return '*'.repeat(match.length);
    });
  }

  return filtered;
}

/**
 * Check if a message contains profanity
 * Useful for warning users before sending
 *
 * @param text - The message text to check
 * @returns True if profanity is detected
 */
export function containsProfanity(text: string): boolean {
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Get a cleaned version of text for display
 * Only filters if enabled by user settings
 *
 * @param text - The message text
 * @param filterEnabled - Whether the filter is enabled
 * @returns The (possibly) filtered message
 */
export function getDisplayText(text: string, filterEnabled: boolean): string {
  if (!filterEnabled) {
    return text;
  }
  return filterProfanity(text);
}
