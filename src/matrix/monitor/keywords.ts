import { normalizeLowercaseStringOrEmpty } from "openclaw/plugin-sdk/text-runtime";

export function buildKeywordPattern(keyword: string): RegExp {
  // Regex pattern wrapped in /.../
  if (keyword.startsWith("/") && keyword.endsWith("/")) {
    const regexBody = keyword.slice(1, -1);
    try {
      return new RegExp(`(^|[^a-zA-Z0-9_])(${regexBody})($|[^a-zA-Z0-9_])`, "i");
    } catch {
      // Invalid regex, fall back to wildcard
    }
  }
  
  // Wildcard pattern: * becomes .*
  const escaped = keyword.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/\\\*/g, ".*");
  return new RegExp(`(^|[^a-zA-Z0-9_])${pattern}($|[^a-zA-Z0-9_])`, "i");
}

export function buildKeywordPatterns(keywords: string[]): RegExp[] {
  return keywords.map(buildKeywordPattern);
}

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

  if (params.roomKeywordsEnabled && params.globalKeywords) {
    keywords = [...params.globalKeywords];
  }

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