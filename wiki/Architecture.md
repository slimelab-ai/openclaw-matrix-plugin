# OpenClaw Matrix Plugin - Architecture

## Overview

This plugin provides Matrix protocol support for OpenClaw, enabling:
- End-to-end encrypted messaging (E2EE)
- Direct messages and group rooms
- Keyword-based message triggers
- Thread support
- Account management

## Directory Structure

```
openclaw-matrix-plugin/
├── index.ts                    # Plugin entry point
├── api.ts                      # Public API exports
├── channel-plugin-api.ts       # Channel plugin interface
├── runtime-api.ts              # Runtime API
├── secret-contract-api.ts      # Secret management
├── src/
│   ├── channel.ts              # Channel plugin implementation
│   ├── config-schema.ts        # Configuration schema
│   ├── cli.ts                  # CLI commands
│   ├── onboarding.ts           # User onboarding
│   ├── actions.ts              # Matrix actions
│   ├── tool-actions.ts         # Tool integrations
│   ├── exec-approvals.ts        # Execution approvals
│   ├── matrix/
│   │   ├── monitor/
│   │   │   ├── handler.ts      # Message handler
│   │   │   ├── keywords.ts     # Keyword detection
│   │   │   ├── config.ts       # Config resolution
│   │   │   ├── events.ts       # Event processing
│   │   │   └── ...
│   │   ├── sdk.ts              # Matrix SDK wrapper
│   │   ├── client.ts           # Client management
│   │   ├── send.ts             # Outbound messages
│   │   └── ...
│   └── ...
└── wiki/                       # Documentation
```

## Core Components

### Message Handler (`handler.ts`)

Processes incoming Matrix messages:
1. Receives event from Matrix SDK
2. Resolves room configuration
3. Checks mentions and keywords
4. Routes to appropriate agent session
5. Handles replies and thread bindings

### Keywords (`keywords.ts`)

Keyword detection utilities:
- Pattern matching with wildcards
- Configurable per-room and global
- Bypasses mention requirement when matched

### Configuration (`config-schema.ts`)

Zod schema for configuration validation:
- `MatrixConfigSchema` - Top-level config
- `matrixRoomSchema` - Per-room settings
- Supports encryption, bots, mentions, keywords

### Client SDK (`sdk.ts`)

Matrix SDK wrapper providing:
- Client initialization
- Sync management
- E2EE support
- Event handling

## Configuration

### Global Configuration

```json
{
  "channels": {
    "matrix": {
      "homeserver": "https://matrix.org",
      "userId": "@bot:server.org",
      "accessToken": { "$secret": "MATRIX_TOKEN" },
      "encryption": true,
      "groupPolicy": "open",
      "keywords": { "words": ["pattern*"] }
    }
  }
}
```

### Room Configuration

```json
{
  "channels": {
    "matrix": {
      "rooms": {
        "!roomid:server": {
          "requireMention": true,
          "keywords": { "words": ["bot*"], "includeMentions": true }
        }
      }
    }
  }
}
```

## Message Flow

1. Matrix SDK receives event
2. `monitor/index.ts` routes to handler
3. `monitor/handler.ts` processes:
   - Deduplication
   - Mention resolution
   - Keyword matching
   - Room config lookup
   - Bypass decisions
4. Agent session receives message
5. Response sent via `send.ts`

## Keyword Detection Flow

```
Message Received
       ↓
Resolve Room Config
       ↓
Check Global Keywords ──────┐
       ↓                    │
Check Room Keywords ←───────┘
       ↓
Pattern Match?
    Yes → Bypass mention requirement
    No  → Require @mention
```

## Encryption Support

- Uses `matrix-js-sdk` with crypto
- Supports cross-signing verification
- Handles key backup/restore
- Manages device verification

## Thread Bindings

- Creates threads per conversation
- Configurable idle timeout
- Max age settings
- Session key tracking

## Related Files

- See [Keyword Mentions](./Keyword-Mentions.md) for keyword configuration
- See [AGENTS.md](../AGENTS.md) for development workflow