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
 * Global keyword configuration.
 */
export const DEFAULT_KEYWORDS: string[] = [];

/**
 * Room-specific keyword configuration for Scoob.
 * Respond to keywords only in specified rooms, require mentions elsewhere.
 */
export const KEYWORD_WHITELIST_ROOMS: Record<string, { keywords: string[]; includeMentions: boolean }> = {
  // #scoob-admin - respond to keywords here
  // Room ID will be resolved from alias at runtime
  "#scoob-admin:cclub.cs.wmich.edu": {
    keywords: ["scoob*", "*hound"],
    includeMentions: true,
  },
  // #the-doghouse - respond to keywords here  
  "#the-doghouse:cclub.cs.wmich.edu": {
    keywords: ["scoob*", "*hound"],
    includeMentions: true,
  },
};

/**
 * Resolve effective keyword config for a room.
 * Combines global and room-specific keywords.
 */
export function resolveKeywordConfig(params: {
  roomId: string;
  roomAlias?: string;
  globalKeywords?: string[];
  roomKeywordsConfig?: { keywords?: string[]; includeMentions?: boolean };
}): {
  keywords: string[];
  includeMentions: boolean;
  keywordPatterns: RegExp[];
} {
  const keywords: string[] = [...(params.globalKeywords || [])];
  let includeMentions = true;

  // Check room-specific config
  if (params.roomKeywordsConfig) {
    if (params.roomKeywordsConfig.keywords) {
      keywords.push(...params.roomKeywordsConfig.keywords);
    }
    if (params.roomKeywordsConfig.includeMentions !== undefined) {
      includeMentions = params.roomKeywordsConfig.includeMentions;
    }
  }

  // Legacy: Check KEYWORD_WHITELIST_ROOMS by alias
  if (params.roomAlias && KEYWORD_WHITELIST_ROOMS[params.roomAlias]) {
    const roomConfig = KEYWORD_WHITELIST_ROOMS[params.roomAlias];
    keywords.push(...roomConfig.keywords);
    includeMentions = roomConfig.includeMentions;
  }

  return {
    keywords,
    includeMentions,
    keywordPatterns: buildKeywordPatterns(keywords),
  };
}