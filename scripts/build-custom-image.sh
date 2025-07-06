#!/bin/bash
# Build custom Claude Code image to reduce external dependencies

set -e

IMAGE_NAME="claude-code-custom"
IMAGE_TAG="latest"

echo "Building custom Claude Code image..."
echo "This replaces the dependency on ghcr.io/zeeno-atl/claude-code"

# Build the custom image
docker build -f Dockerfile.custom -t ${IMAGE_NAME}:${IMAGE_TAG} .

echo "✅ Custom image built successfully: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "To use this image, set the environment variable:"
echo "export DEFAULT_CLAUDE_IMAGE=${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "Or add to your MCP configuration:"
echo '"env": {'
echo '  "DEFAULT_CLAUDE_IMAGE": "'${IMAGE_NAME}:${IMAGE_TAG}'"'
echo '}'
