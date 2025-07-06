#!/bin/sh
# MCP Config Processor
# This script runs at container startup to merge MCP_CONFIG into .claude.json

# Determine the user's home directory
USER_HOME="${HOME:-/home/claude}"
CLAUDE_CONFIG_FILE="${USER_HOME}/.claude.json"

if [ -n "$MCP_CONFIG" ]; then
    echo "[MCP] Processing MCP configuration..."
    echo "[MCP] Using config file: ${CLAUDE_CONFIG_FILE}"

    # Decode and merge MCP config
    echo "$MCP_CONFIG" | base64 -d > /tmp/mcp_config.json

    # Use Python to merge the configs
    python3 -c "
import json
import os

config_file = '${CLAUDE_CONFIG_FILE}'

# Read existing config
try:
    with open(config_file, 'r') as f:
        config = json.load(f)
except:
    config = {'projects': {'/app': {'mcpServers': {}, 'allowedTools': []}}}

# Read MCP config
with open('/tmp/mcp_config.json', 'r') as f:
    mcp_config = json.load(f)

# Ensure structure exists
if 'projects' not in config:
    config['projects'] = {}
if '/app' not in config['projects']:
    config['projects']['/app'] = {}
if 'mcpServers' not in config['projects']['/app']:
    config['projects']['/app']['mcpServers'] = {}

# Initialize allowedTools array if not present (prevents 'not iterable' error)
if 'allowedTools' not in config['projects']['/app']:
    config['projects']['/app']['allowedTools'] = []

# Merge MCP servers
config['projects']['/app']['mcpServers'] = mcp_config.get('mcpServers', {})

# Write back
os.makedirs(os.path.dirname(config_file), exist_ok=True)
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print('[MCP] Configuration merged successfully')
"

    rm -f /tmp/mcp_config.json
fi

# Execute the original command
exec "$@"
