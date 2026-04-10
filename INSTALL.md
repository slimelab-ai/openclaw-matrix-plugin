# OpenClaw Matrix Plugin - Installation Guide

This guide explains how to install and configure the custom Matrix plugin with keyword support.

## Prerequisites

- OpenClaw v2026.4.9 or compatible version
- pnpm (or npm/yarn)
- SSH access to target machine (if deploying remotely)

## Installation Methods

### Method 1: Install Script (Recommended)

Run the install script from the plugin repository:

```bash
cd /path/to/openclaw-matrix-plugin
./install.sh donghouse  # or target hostname
```

### Method 2: Manual Installation

1. **Deploy plugin source:**
   
   ```bash
   # Copy plugin to OpenClaw extensions directory
   rsync -avz --exclude='node_modules' --exclude='.git' \
     /path/to/openclaw-matrix-plugin/ \
     user@donghouse:~/.openclaw/extensions/matrix/
   ```

2. **Install dependencies:**
   
   ```bash
   cd ~/.openclaw/extensions/matrix
   pnpm install @sinclair/typebox @matrix-org/matrix-sdk-crypto-nodejs matrix-js-sdk markdown-it music-metadata fake-indexeddb --ignore-scripts
   ```

3. **Configure OpenClaw to load the plugin first:**
   
   Edit `~/.openclaw/openclaw.json` and add:
   
   ```json
   {
     "plugins": {
       "load": {
         "paths": ["/home/user/.openclaw/extensions/matrix/index.ts"]
       }
     },
     "channels": {
       "matrix": {
         "keywords": {
           "words": ["scoob*", "*hound"]
         }
       }
     }
   }
   ```

4. **Restart the gateway:**
   
   ```bash
   systemctl --user restart openclaw-gateway
   ```

## Configuration

### Global Keywords

Keywords that apply to enabled Matrix rooms:

```json
{
  "channels": {
    "matrix": {
      "keywords": {
        "words": ["/scoo+b[a-zA-Z]*/", "/[a-zA-Z]*hound/"]
      },
      "rooms": {
        "!roomid:server": {
          "requireMention": true,
          "keywordsEnabled": true
        }
      }
    }
  }
}
```

Note: `keywordsEnabled` defaults to `false`. You must explicitly set it to `true` for keywords to work in a room.

#### Keyword Pattern Syntax

| Pattern | Type | Matches | Example |
|---------|------|---------|---------|
| `word` | Exact | Word with boundaries | `bot` matches "bot" but not "bottle" |
| `bot*` | Wildcard | Prefix + anything | `bot*` matches: bot, bots, botname |
| `*bot` | Wildcard | Anything + suffix | `*bot` matches: bot, chatbot, testbot |
| `/regex/` | Raw regex | Full regex support | `/sco+b.*/` matches: scoob, scoooobert (one or more o's) but NOT scosdfbert |

**Note:** `keywordsEnabled` defaults to `false`. You must explicitly set it to `true` for keywords to work in a room.

## Verification

Check plugin status:

```bash
openclaw plugins list | grep matrix
```

Expected output:
```
│ matrix       │          │ openclaw │ loaded   │ ~/.openclaw/extensions/matrix/index.ts                    │          │
│ @openclaw/   │ matrix   │ openclaw │ disabled │ stock:matrix/index.js                                     │ 2026.4.9 │
```

The custom `matrix` plugin should be `loaded`, and the bundled `@openclaw/matrix` should be `disabled`.

Check config is valid:

```bash
openclaw doctor
```

Should show no errors related to `channels.matrix`.

## Troubleshooting

### Plugin fails to load

**Missing dependencies:**
```bash
cd ~/.openclaw/extensions/matrix
pnpm install @sinclair/typebox @matrix-org/matrix-sdk-crypto-nodejs matrix-js-sdk markdown-it music-metadata fake-indexeddb --ignore-scripts
```

**Plugin ID mismatch:**
The `openclaw.plugin.json` ID must match the TypeScript export ID. Both should be `"matrix"`.

### Config validation fails

**`channels.matrix: invalid config: must NOT have additional properties`**

This means the bundled plugin is being used instead of the custom one. Verify:
1. `plugins.load.paths` is configured correctly
2. The plugin path points to `index.ts` (not a directory)
3. The bundled `@openclaw/matrix` shows as `disabled`

### Duplicate plugin warning

The warning `duplicate plugin id detected; bundled plugin will be overridden by config plugin` is **expected and correct**. It means the custom plugin takes priority.

## How It Works

OpenClaw's plugin discovery order:
1. `plugins.load.paths` (explicit paths)
2. Workspace extensions
3. Global extensions (`~/.openclaw/extensions/`)
4. Bundled plugins (`stock:`)

By setting `plugins.load.paths`, we force OpenClaw to load the custom plugin first. Since both plugins have the same ID (`matrix`), OpenClaw uses the first one loaded and disables the bundled one.

## Upgrading

When upgrading OpenClaw:

1. Ensure the plugin version matches the OpenClaw version
2. Re-sync the plugin source:
   ```bash
   ./install.sh donghouse
   ```
3. Restart gateway

Tag this repository with matching OpenClaw versions (e.g., `v2026.4.9`).

## Files

| File | Purpose |
|------|---------|
| `src/matrix/monitor/keywords.ts` | Keyword pattern matching |
| `src/matrix/monitor/handler.ts` | Message handler with keyword check |
| `src/config-schema.ts` | Zod schemas for config validation |
| `openclaw.plugin.json` | Plugin manifest with channel config schema |
| `install.sh` | Automated installation script |