#!/bin/bash

# Test Release Script
# This script helps test the MCP server locally before publishing

set -e

echo "🧪 Testing MCP Server Release Process"
echo "====================================="

# Build the project
echo "📦 Building project..."
npm run build

# Run basic tests
echo "🧪 Running tests..."
npm test

# Create a backup of the current Claude config
CONFIG_DIR="$HOME/Library/Application Support/Claude"
ORIGINAL_CONFIG="$CONFIG_DIR/claude_desktop_config.json"
BACKUP_CONFIG="$CONFIG_DIR/claude_desktop_config.backup.json"
TEST_CONFIG="$CONFIG_DIR/claude_desktop_config_local_test.json"

echo "💾 Backing up current Claude configuration..."
cp "$ORIGINAL_CONFIG" "$BACKUP_CONFIG"

echo "🔄 Switching to local test configuration..."
cp "$TEST_CONFIG" "$ORIGINAL_CONFIG"

echo "✅ Local test configuration activated!"
echo ""
echo "📋 Next steps:"
echo "1. Restart Claude desktop app"
echo "2. Test the claude-code-local MCP server"
echo "3. Verify the version print feature works"
echo "4. Run various commands to ensure stability"
echo ""
echo "⚠️  To restore original configuration, run:"
echo "   ./scripts/restore-config.sh"
echo ""
echo "📝 Once testing is complete, run:"
echo "   ./scripts/publish-release.sh"