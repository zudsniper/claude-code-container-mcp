#!/bin/bash

# Set environment variables if needed
# export CLAUDE_CLI_PATH="/custom/path/to/claude"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start the server with the correct path
node "$SCRIPT_DIR/dist/server.js"