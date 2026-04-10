# Matrix Plugin Wiki

## Table of Contents

### Configuration
- [Keyword Mentions](./Keyword-Mentions.md) - Configure keyword-based message triggers
- [Room Configuration](./Room-Config.md) - Per-room settings
- [Global Configuration](./Global-Config.md) - Plugin-wide settings

### Development
- [AGENTS.md](../AGENTS.md) - Development workflow and best practices
- [Architecture](./Architecture.md) - Plugin architecture overview

## About

This plugin enables OpenClaw to interact with Matrix homeservers, supporting:
- Direct messages and group rooms
- Encrypted messaging (E2EE)
- Keyword-based triggers
- Thread support
- Rich media handling

## Quick Start

1. Configure in `openclaw.json`:
```json
{
  "channels": {
    "matrix": {
      "homeserver": "https://matrix.org",
      "userId": "@bot:matrix.org",
      "accessToken": { "$secret": "MATRIX_TOKEN" }
    }
  }
}
```

2. Optional: Configure keyword keywords:
```json
{
  "channels": {
    "matrix": {
      "rooms": {
        "!roomid:server": {
          "keywords": {
            "words": ["scoob*", "*hound"]
          }
        }
      }
    }
  }
}
```

Last updated: 2026-04-10