#!/bin/bash

# Restore Original Claude Configuration

set -e

CONFIG_DIR="$HOME/Library/Application Support/Claude"
ORIGINAL_CONFIG="$CONFIG_DIR/claude_desktop_config.json"
BACKUP_CONFIG="$CONFIG_DIR/claude_desktop_config.backup.json"

if [ -f "$BACKUP_CONFIG" ]; then
    echo "🔄 Restoring original Claude configuration..."
    cp "$BACKUP_CONFIG" "$ORIGINAL_CONFIG"
    echo "✅ Original configuration restored!"
    echo "♻️  Removing backup file..."
    rm "$BACKUP_CONFIG"
else
    echo "⚠️  No backup configuration found!"
fi

echo ""
echo "📋 Next steps:"
echo "1. Restart Claude desktop app to apply changes"