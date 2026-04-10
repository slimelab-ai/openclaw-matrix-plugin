# OpenClaw Matrix Plugin - Development Guide

This plugin provides Matrix channel support for OpenClaw agents.

## Architecture

- `src/` - Main plugin source
- `src/matrix/` - Matrix-specific implementations
- `src/matrix/monitor/` - Message handling and routing
  - `handler.ts` - Main message handler
  - `keywords.ts` - Keyword detection logic
  - `config.ts` - Configuration resolution

## Configuration

### Keyword Mentions

The plugin supports keyword-based message triggers, allowing the agent to respond to messages containing specific patterns without requiring an explicit @mention.

#### Global Keywords

Set default keywords for all rooms:

```json
{
  "channels": {
    "matrix": {
      "keywords": {
        "words": ["bot*", "assistant*"]
      }
    }
  }
}
```

#### Per-Room Keywords

Configure keywords for specific rooms:

```json
{
  "channels": {
    "matrix": {
      "rooms": {
        "!roomid:server": {
          "keywords": {
            "words": ["bot*", "helper"],
            "includeMentions": true
          }
        }
      }
    }
  }
}
```

#### Keyword Patterns

Patterns support wildcards:
- `bot*` - Matches: `bot`, `bots`, `botname`, `bottest`
- `*bot` - Matches: `bot`, `chatbot`, `testbot`
- `word` - Exact match (with word boundaries)

## Development Workflow

1. **Create feature branch** from main
2. **Edit TypeScript source** in `src/`
3. **Run tests**: `pnpm test`
4. **Build**: `pnpm build`
5. **Update documentation** in `wiki/`
6. **Commit with conventional commits**
7. **Push and create PR**

## Key Files

### `handler.ts` - Message Handler

Processes incoming Matrix messages:
- Resolves room configuration
- Checks mentions and keywords
- Bypasses mention requirement when keywords match

### `keywords.ts` - Keyword Detection

Pattern matching utilities:
- `buildKeywordPattern(keyword)` - Creates regex from pattern
- `matchesKeywords(params)` - Checks if text matches patterns
- `resolveKeywordConfig(params)` - Merges global and room keywords

### `config-schema.ts` - Configuration Schema

Zod schemas for configuration validation:
- `MatrixConfigSchema` - Top-level config
- `matrixRoomSchema` - Per-room config

## Git Hygiene

- Never commit secrets or API keys
- Never hardcode room IDs or user IDs
- All behavior must be configurable
- Use conventional commit messages:
  - `feat(matrix): add feature`
  - `fix(matrix): fix bug`
  - `docs: update documentation`

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- handler.test.ts

# Run with coverage
pnpm test --coverage
```

## Build

```bash
# Build plugin
pnpm build

# Output is in dist/
```

## Version Compatibility

This plugin must match the OpenClaw version it runs with. Check `package.json` for peer dependencies.