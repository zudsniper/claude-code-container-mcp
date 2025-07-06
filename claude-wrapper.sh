#!/usr/bin/env bash
#
# Unofficial Claude Code CLI Wrapper
# Installs and runs the Claude Code CLI as the current user
# This is not an official Anthropic product
#

# Exit on errors
set -e
set -o pipefail

# Log function for better visibility
log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

# Configure npm to use user-specific directory
export npm_config_prefix="/home/claude/.npm-global"
export PATH="/home/claude/.npm-global/bin:$PATH"

# Maximum number of install attempts
MAX_ATTEMPTS=3
ATTEMPT=1

# Install with retry logic
install_claude_cli() {
  while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    log "Installing Claude Code CLI as user (attempt $ATTEMPT of $MAX_ATTEMPTS)..."

    if npm install -g @anthropic-ai/claude-code; then
      log "Successfully installed Claude Code CLI as user"
      return 0
    else
      if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        log "Installation failed, retrying in 5 seconds..."
        sleep 5
        ATTEMPT=$((ATTEMPT+1))
      else
        log "ERROR: Failed to install Claude Code CLI after $MAX_ATTEMPTS attempts"
        log "Try setting ANTHROPIC_API_KEY environment variable if authentication is failing"
        log "Or check your internet connection and try again"
        return 1
      fi
    fi
  done
}

# Check if Claude is already installed in the user's space
if [ ! -f "/home/claude/.npm-global/bin/claude" ]; then
  install_claude_cli || exit 1
fi

# Pass all arguments to Claude CLI
exec /home/claude/.npm-global/bin/claude "$@"
