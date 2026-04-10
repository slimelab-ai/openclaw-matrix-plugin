# Matrix Plugin Wiki

## Table of Contents

### Getting Started
- [Configuration](./Configuration.md) - Complete configuration reference
- [Keyword Mentions](./Keyword-Mentions.md) - Keyword-based triggers
- [Encryption](./Encryption.md) - E2EE setup and verification

### Architecture
- [Architecture](./Architecture.md) - Plugin architecture overview
- [Message Flow](./Message-Flow.md) - How messages are processed
- [Client SDK](./Client-SDK.md) - Matrix SDK wrapper

### Development
- [AGENTS.md](../AGENTS.md) - Development workflow and best practices
- [Testing](./Testing.md) - Running tests
- [Contributing](./Contributing.md) - How to contribute

### Reference
- [Configuration Schema](./Config-Schema.md) - All configuration options
- [CLI Commands](./CLI-Commands.md) - Matrix CLI reference

## About

This plugin enables OpenClaw to interact with Matrix homeservers, supporting:

- **Messaging**: Direct messages and group rooms
- **Encryption**: E2EE with cross-signing verification  
- **Keywords**: Trigger responses without @mention
- **Threading**: Reply threads for conversations
- **Bots**: First-class bot support

## Quick Start

1. Install OpenClaw with Matrix plugin
2. Configure in `openclaw.json`:
```json
{
  "channels": {
    "matrix": {
      "homeserver": "https://matrix.org",
      "userId": "@bot:server.org",
      "accessToken": { "$secret": "MATRIX_TOKEN" }
    }
  }
}
```

3. Optional: Configure keywords:
```json
{
  "channels": {
    "matrix": {
      "keywords": { "words": ["botname*", "*bot"] },
      "rooms": {
        "!room:server": {
          "requireMention": true,
          "keywords": { "words": ["trigger"] }
        }
      }
    }
  }
}
```

## Features

### Keyword Mentions

Configure keywords that bypass mention requirements:

| Pattern | Matches |
|---------|---------|
| `scoob*` | "scoob", "scoober", "scooby" |
| `*hound` | "hound", "greyhound", "shorthound" |
| `word` | Exact word match |

See [Keyword Mentions](./Keyword-Mentions.md) for details.

### Encryption

E2EE support with:
- Device verification
- Cross-signing
- Key backup
- Recovery from backup

See [Encryption](./Encryption.md) for setup.

### Room Configuration

Per-room settings for:
- Mention requirements
- Keyword triggers  
- Bot handling
- Tool policies

See [Configuration](./Configuration.md) for details.

## Version

Current version: 2026.4.9

---

*Last updated: 2026-04-10*