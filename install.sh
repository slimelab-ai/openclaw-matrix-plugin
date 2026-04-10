#!/bin/bash
# OpenClaw Matrix Plugin Installation Script
# Usage: ./install.sh [hostname] [username]
#
# Arguments:
#   hostname  - Target hostname (default: localhost)
#   username  - SSH username (default: current user)
#
# Examples:
#   ./install.sh donghouse
#   ./install.sh donghouse scoob
#   ./install.sh localhost

set -e

# Configuration
PLUGIN_NAME="matrix"
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPENDENCIES="@sinclair/typebox @matrix-org/matrix-sdk-crypto-nodejs matrix-js-sdk markdown-it music-metadata fake-indexeddb"

# Parse arguments
HOSTNAME="${1:-localhost}"
USERNAME="${2:-$(whoami)}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're installing locally or remotely
if [ "$HOSTNAME" = "localhost" ]; then
    SSH_CMD=""
    TARGET_DIR="$HOME/.openclaw/extensions/$PLUGIN_NAME"
else
    SSH_CMD="ssh $USERNAME@$HOSTNAME"
    TARGET_DIR=".openclaw/extensions/$PLUGIN_NAME"
    REMOTE_HOME=$($SSH_CMD "echo \$HOME")
fi

log_info "Installing OpenClaw Matrix Plugin to $HOSTNAME"

# Step 1: Create extensions directory
log_info "Creating extensions directory..."
if [ -n "$SSH_CMD" ]; then
    $SSH_CMD "mkdir -p ~/.openclaw/extensions/$PLUGIN_NAME"
else
    mkdir -p "$TARGET_DIR"
fi

# Step 2: Sync plugin source
log_info "Syncing plugin source..."
if [ -n "$SSH_CMD" ]; then
    rsync -avz --exclude='node_modules' --exclude='.git' --exclude='*.log' \
        "$PLUGIN_DIR/" \
        "$USERNAME@$HOSTNAME:.openclaw/extensions/$PLUGIN_NAME/"
else
    # Local install - copy files
    mkdir -p "$TARGET_DIR"
    cp -r "$PLUGIN_DIR/src" "$TARGET_DIR/"
    cp "$PLUGIN_DIR/openclaw.plugin.json" "$TARGET_DIR/"
    cp "$PLUGIN_DIR/package.json" "$TARGET_DIR/" 2>/dev/null || true
fi

# Step 3: Install dependencies
log_info "Installing dependencies..."
if [ -n "$SSH_CMD" ]; then
    $SSH_CMD "cd ~/.openclaw/extensions/$PLUGIN_NAME && pnpm install $DEPENDENCIES --ignore-scripts"
else
    cd "$TARGET_DIR"
    pnpm install $DEPENDENCIES --ignore-scripts
fi

# Step 4: Check OpenClaw config
log_info "Checking OpenClaw configuration..."

if [ -n "$SSH_CMD" ]; then
    # Check if plugins.load.paths exists
    if $SSH_CMD "grep -q 'plugins.load.paths' ~/.openclaw/openclaw.json 2>/dev/null"; then
        log_warn "plugins.load.paths already configured - verify it includes this plugin"
    else
        log_info "Adding plugins.load.paths to config..."
        $SSH_CMD "cat > /tmp/patch_config.py << 'PYEOF'
import json
import os

config_path = os.path.expanduser('~/.openclaw/openclaw.json')
with open(config_path, 'r') as f:
    config = json.load(f)

# Add plugins.load.paths
if 'plugins' not in config:
    config['plugins'] = {}
if 'load' not in config['plugins']:
    config['plugins']['load'] = {}
if 'paths' not in config['plugins']['load']:
    config['plugins']['load']['paths'] = []

plugin_path = os.path.expanduser('~/.openclaw/extensions/matrix/index.ts')
if plugin_path not in config['plugins']['load']['paths']:
    config['plugins']['load']['paths'].insert(0, plugin_path)

# Add keywords config if not present
if 'channels' not in config:
    config['channels'] = {}
if 'matrix' not in config['channels']:
    config['channels']['matrix'] = {}
if 'keywords' not in config['channels']['matrix']:
    config['channels']['matrix']['keywords'] = {'words': ['scoob*', '*hound']}

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print('Config updated successfully')
PYEOF
python3 /tmp/patch_config.py"
    fi
else
    # Local config check
    CONFIG_PATH="$HOME/.openclaw/openclaw.json"
    if [ -f "$CONFIG_PATH" ]; then
        if grep -q 'plugins.load.paths' "$CONFIG_PATH" 2>/dev/null; then
            log_warn "plugins.load.paths already configured - verify it includes this plugin"
        else
            log_info "Run: python3 to add config (script included)"
        fi
    fi
fi

# Step 5: Restart gateway for preflight
log_info "Restarting gateway for validation..."
if [ -n "$SSH_CMD" ]; then
    $SSH_CMD "systemctl --user restart openclaw-gateway"
    sleep 15
fi

# Step 6: Preflight validation
log_info "Running preflight validation..."

PREFLIGHT_FAILED=0

if [ -n "$SSH_CMD" ]; then
    # Check for startup errors
    ERRORS=$($SSH_CMD "journalctl --user -u openclaw-gateway --since '20 seconds ago' --no-pager 2>&1 | grep -E 'channel exited|Cannot find module' || true")
    if [ -n "$ERRORS" ]; then
        log_error "Plugin startup failed with errors:"
        echo "$ERRORS"
        PREFLIGHT_FAILED=1
    fi
    
    # Check plugin loaded correctly
    PLUGIN_STATUS=$($SSH_CMD "node ~/.npm-global/bin/openclaw plugins list 2>&1 | grep -E '^│ matrix.*loaded.*extensions/matrix' || echo 'NOT_LOADED'")
    if echo "$PLUGIN_STATUS" | grep -q "loaded"; then
        log_success "Plugin loaded correctly"
    else
        log_error "Plugin not loaded correctly"
        $SSH_CMD "node ~/.npm-global/bin/openclaw plugins list 2>&1 | grep -E 'matrix|error' | head -10"
        PREFLIGHT_FAILED=1
    fi
    
    # Check matrix channel started without errors
    CHANNEL_STATUS=$($SSH_CMD "journalctl --user -u openclaw-gateway --since '30 seconds ago' --no-pager 2>&1 | grep -E '\[matrix\].*starting provider' || echo 'NOT_STARTED'")
    if echo "$CHANNEL_STATUS" | grep -q "starting provider"; then
        log_success "Matrix channel started successfully"
    else
        log_error "Matrix channel failed to start"
        PREFLIGHT_FAILED=1
    fi
fi

if [ $PREFLIGHT_FAILED -eq 1 ]; then
    log_error "Preflight validation FAILED - plugin not working correctly"
    log_info "Check logs: journalctl --user -u openclaw-gateway --since '1 minute ago'"
    exit 1
fi

log_success "Installation complete and validated!"
echo ""
echo "Summary:"
echo "  - Plugin loaded from ~/.openclaw/extensions/matrix/index.ts"
echo "  - Bundled @openclaw/matrix disabled"
echo "  - Matrix channel running"
echo "  - Keywords configured: ['scoob*', '*hound']"
echo ""
echo "Next steps:"
echo "  1. Edit ~/.openclaw/openclaw.json to customize keywords"
echo "  2. Test by sending a message with 'scoob' or 'hound' in #scoob-admin"
echo ""
echo "Config example:"
echo '{'
echo '  "plugins": {'
echo '    "load": { "paths": ["~/.openclaw/extensions/matrix/index.ts"] }'
echo '  },'
echo '  "channels": {'
echo '    "matrix": {'
echo '      "keywords": { "words": ["scoob*", "*hound"] }'
echo '    }'
echo '  }'
echo '}'