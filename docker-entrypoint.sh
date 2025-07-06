#!/bin/bash
set -e

# Update Claude Code to latest version on startup
echo "Checking for Claude Code updates..."
npm update -g @anthropic-ai/claude-code || true

# Set up API key if provided
if [ -n "$ANTHROPIC_API_KEY" ]; then
    export ANTHROPIC_API_KEY
fi

# Set up AWS credentials if using Bedrock
if [ "$CLAUDE_CODE_USE_BEDROCK" = "1" ] || [ "$CLAUDE_CODE_USE_BEDROCK" = "true" ]; then
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        [ -n "$AWS_SESSION_TOKEN" ] && export AWS_SESSION_TOKEN
        [ -n "$AWS_REGION" ] && export AWS_REGION
    fi
fi

# Execute command
exec "$@"
