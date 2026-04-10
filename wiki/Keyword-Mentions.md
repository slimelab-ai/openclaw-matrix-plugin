# Keyword Mentions

## Overview

The Matrix plugin supports keyword-based message triggers, allowing the agent to respond to messages containing specific patterns without requiring an explicit @mention.

## Usage

### Global Keywords

Set default keywords for all rooms:

```json
{
  "channels": {
    "matrix": {
      "keywords": {
        "words": ["bot*", "assistant*", "help"]
      }
    }
  }
}
```

### Per-Room Keywords

Configure keywords for specific rooms:

```json
{
  "channels": {
    "matrix": {
      "rooms": {
        "!roomid:server": {
          "requireMention": true,
          "keywords": {
            "words": ["bot*", "assistant"],
            "includeMentions": true
          }
        }
      }
    }
  }
}
```

## Pattern Syntax

Patterns support wildcards using `*`:

| Pattern | Matches |
|---------|---------|
| `bot*` | "bot", "bots", "botname", "bottest" |
| `*bot` | "bot", "chatbot", "testbot" |
| `word` | Exact match with word boundaries |
| `multi*word` | "multiword", "multi-word" |

## Options

### `words` (array of strings)

List of keyword patterns to match. Each pattern is converted to a regex with word boundaries.

### `includeMentions` (boolean, default: true)

When true, keyword matches also include messages that @mention the agent.

## How It Works

1. When a message is received in a configured room
2. The message text is checked against all keyword patterns
3. If a pattern matches, the mention requirement is bypassed
4. The agent processes the message and responds

## Example Configuration

```json
{
  "channels": {
    "matrix": {
      "keywords": {
        "words": ["assistant*", "help*"]
      },
      "rooms": {
        "!admin:server": {
          "requireMention": false
        },
        "!public:server": {
          "requireMention": true,
          "keywords": {
            "words": ["botname*", "*bot"],
            "includeMentions": true
          }
        }
      }
    }
  }
}
```

In this configuration:
- All rooms respond to "assistant*" and "help*"
- `!admin:server` responds to all messages (no mention required)
- `!public:server` requires @mention OR keyword match

## Security Considerations

- Use specific keyword patterns to avoid false triggers in noisy rooms
- Combine with `requireMention: true` in public rooms
- Review patterns before deploying to production

## Related

- [Configuration](./Configuration.md)
- [AGENTS.md](../AGENTS.md) - Development guide