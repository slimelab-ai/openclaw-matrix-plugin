import { normalizeLowercaseStringOrEmpty } from "openclaw/plugin-sdk/text-runtime";

/**
 * Build a regex pattern for keyword matching.
 * Handles patterns like:
 * - "scoob*" -> matches "scoob", "scoober", "scoooooob", "scooby"
 * - "*hound" -> matches "shithound", "dirthound", "hound"
 */
export function buildKeywordPattern(keyword: string): RegExp {
  // Escape special regex chars except * (wildcard)
  const escaped = keyword.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace escaped * with .* (match any suffix/prefix)
  const pattern = escaped.replace(/\\\*/g, '.*');
  return new RegExp(`(^|[^a-zA-Z0-9_])${pattern}($|[^a-zA-Z0-9_])`, 'i');
}

/**
 * Build keyword patterns for a list of keywords.
 */
export function buildKeywordPatterns(keywords: string[]): RegExp[] {
  return keywords.map(buildKeywordPattern);
}

/**
 * Check if any keyword pattern matches the text.
 */
export function matchesKeywords(params: {
  text: string;
  keywordPatterns: RegExp[];
}): boolean {
  if (!params.text || params.keywordPatterns.length === 0) {
    return false;
  }
  const normalized = normalizeLowercaseStringOrEmpty(params.text);
  return params.keywordPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Resolve effective keyword config for a room.
 * Combines global and room-specific keywords from configuration.
 * 
 * Configuration:
 * - Global keywords: channels.matrix.keywords.words (array of patterns)
 * - Room keywords: channels.matrix.rooms["!roomId"].keywords.words
 * - Room includeMentions: channels.matrix.rooms["!roomId"].keywords.includeMentions
 * 
 * Example config:
 * {
 *   "channels": {
 *     "matrix": {
 *       "keywords": { "words": ["scoob*", "*hound"] },
 *       "rooms": {
 *         "!roomid:server": {
 *           "keywords": { "words": ["custom-pattern"], "includeMentions": true }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export function resolveKeywordConfig(params: {
  roomId: string;
  roomAlias?: string;
  globalKeywords?: string[];
  roomKeywordsConfig?: { words?: string[]; includeMentions?: boolean };
}): {
  keywords: string[];
  includeMentions: boolean;
  keywordPatterns: RegExp[];
} {
  const keywords: string[] = [...(params.globalKeywords || [])];
  let includeMentions = true;

  // Check room-specific config
  if (params.roomKeywordsConfig) {
    if (params.roomKeywordsConfig.words) {
      keywords.push(...params.roomKeywordsConfig.words);
    }
    if (params.roomKeywordsConfig.includeMentions !== undefined) {
      includeMentions = params.roomKeywordsConfig.includeMentions;
    }
  }

  return {
    keywords,
    includeMentions,
    keywordPatterns: buildKeywordPatterns(keywords),
  };
}