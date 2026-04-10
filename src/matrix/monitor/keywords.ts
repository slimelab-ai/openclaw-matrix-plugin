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
 * 
 * Two modes:
 * 1. Global keywords + room keywordsEnabled flag:
 *    - Set global keywords at channels.matrix.keywords.words
 *    - Set keywordsEnabled: true in room config to enable
 * 
 * 2. Per-room keywords (legacy):
 *    - Set keywords.words directly in room config
 * 
 * Configuration:
 * - Global keywords: channels.matrix.keywords.words (array of patterns)
 * - Room enable: channels.matrix.rooms["!roomId"].keywordsEnabled = true
 * - Room keywords: channels.matrix.rooms["!roomId"].keywords.words
 * 
 * Example config:
 * {
 *   "channels": {
 *     "matrix": {
 *       "keywords": { "words": ["scoob*", "*hound"] },
 *       "rooms": {
 *         "!roomId:server": { "keywordsEnabled": true }
 *       }
 *     }
 *   }
 * }
 */
export function resolveKeywordConfig(params: {
  roomId: string;
  roomAlias?: string;
  globalKeywords?: string[];
  roomKeywordsEnabled?: boolean; // defaults to false - must be explicitly set to true;
  roomKeywordsConfig?: { words?: string[]; includeMentions?: boolean };
}): {
  keywords: string[];
  includeMentions: boolean;
  keywordPatterns: RegExp[];
} {
  let keywords: string[] = [];
  let includeMentions = true;

  // If room has keywordsEnabled flag, use global keywords
  if (params.roomKeywordsEnabled && params.globalKeywords) {
    keywords = [...params.globalKeywords];
  }

  // Also allow per-room keywords (merged)
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
