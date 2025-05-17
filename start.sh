#!/bin/bash

# Set environment variables if needed
# export CLAUDE_CLI_PATH="/custom/path/to/claude"
export MCP_CLAUDE_DEBUG="false" # Disable debug logging for default

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Run the compiled JavaScript file
node dist/server.js