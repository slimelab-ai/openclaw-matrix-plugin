import { normalizeLowercaseStringOrEmpty } from "openclaw/plugin-sdk/text-runtime";

/**
 * Build a regex pattern for keyword matching.
 * 
 * Supports:
 * - Wildcards: "bot*" → "bot.*" (bot followed by anything)
 * - Regex patterns: "/sco+b.*/" (raw regex, matches one or more o's)
 * - Exact match: "word" (with word boundaries)
 */
export function buildKeywordPattern(keyword: string): RegExp {
  // Check if it's a regex pattern (wrapped in /.../)
  if (keyword.startsWith("/") && keyword.endsWith("/")) {
    const regexBody = keyword.slice(1, -1);
    try {
      return new RegExp(`(^|[^a-zA-Z0-9_])(${regexBody})($|[^a-zA-Z0-9_])`, "i");
    } catch {
      // Invalid regex, fall back to wildcard treatment
    }
  }
  
  // Escape special regex chars except * (wildcard)
  const escaped = keyword.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  // Replace escaped * with .* (match any characters)
  const pattern = escaped.replace(/\\\*/g, ".*");
  return new RegExp(`(^|[^a-zA-Z0-9_])${pattern}($|[^a-zA-Z0-9_])`, "i");
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
 */
export function resolveKeywordConfig(params: {
  roomId: string;
  roomAlias?: string;
  globalKeywords?: string[];
  roomKeywordsEnabled?: boolean;
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
