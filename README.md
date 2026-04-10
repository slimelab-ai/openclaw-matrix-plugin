# OpenClaw Matrix Plugin

Extended Matrix channel plugin for OpenClaw with:

- **Keyword notifications**: React to messages containing specific words (not just @mentions)
- **Room whitelisting/blacklisting**: Control which rooms the bot responds in

## Installation

Add to your OpenClaw workspace:

```bash
pnpm add github:slimelab-ai/openclaw-matrix-plugin
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "openclaw-matrix-plugin": "github:slimelab-ai/openclaw-matrix-plugin"
  }
}
```

## Configuration

Add to `~/.openclaw/openclaw.json`:

```json
{
  "channels": {
    "matrix": {
      "keywords": {
        "mode": "whitelist",
        "global": ["scoob", "dongfathers", "dongometer"],
        "rooms": {
          "!geeks:server": {
            "keywords": ["urgent", "deploy", "down"],
            "enabled": true
          },
          "!bottoy:server": {
            "enabled": false
          }
        }
      }
    }
  }
}
```

### Modes

- `whitelist`: Only respond in rooms explicitly `enabled: true`
- `blacklist`: Respond in all rooms except those with `enabled: false`

### Keywords

- `global`: Keywords that trigger bot responses in all enabled rooms
- `rooms[].keywords`: Room-specific keywords

## Development

```bash
pnpm install
pnpm build
```

## License

MIT