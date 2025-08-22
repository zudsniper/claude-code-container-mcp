#!/bin/bash

# Prepare Release Script
# This script helps prepare for a new release

set -e

echo "🚀 Preparing for Release"
echo "========================"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: Not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes"
    echo "Please commit or stash them first"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull --ff-only

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📌 Current version: $CURRENT_VERSION"

# Ask for version bump type
echo ""
echo "What type of release is this?"
echo "1) Patch (bug fixes) - X.Y.Z+1"
echo "2) Minor (new features) - X.Y+1.0"
echo "3) Major (breaking changes) - X+1.0.0"
echo "4) Custom version"
read -p "Enter choice (1-4): " VERSION_TYPE

case $VERSION_TYPE in
    1) 
        npm version patch --no-git-tag-version
        ;;
    2) 
        npm version minor --no-git-tag-version
        ;;
    3) 
        npm version major --no-git-tag-version
        ;;
    4)
        read -p "Enter new version (without 'v' prefix): " NEW_VERSION
        npm version $NEW_VERSION --no-git-tag-version
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✨ New version: $NEW_VERSION"

# Update CHANGELOG.md
echo ""
echo "📝 Please update CHANGELOG.md with changes for v$NEW_VERSION"
echo "Opening CHANGELOG.md in your default editor..."
echo "Opening CHANGELOG.md in your default editor..."
# Record changelog modification time before editing
CHANGELOG_MTIME_BEFORE=$(stat -c %Y CHANGELOG.md)
${EDITOR:-nano} CHANGELOG.md
# Record changelog modification time after editing
CHANGELOG_MTIME_AFTER=$(stat -c %Y CHANGELOG.md)
if [ "$CHANGELOG_MTIME_AFTER" -le "$CHANGELOG_MTIME_BEFORE" ]; then
    echo "⚠️  CHANGELOG.md does not appear to have been modified."
    read -p "Proceed anyway? (y/N): " CHANGELOG_CONFIRM
    if [ "$CHANGELOG_CONFIRM" != "y" ]; then
        echo "Please update CHANGELOG.md before continuing."
        exit 1
    fi
fi

# Ask to confirm
echo ""
echo "Ready to create release commit?"
echo "This will:"
echo "  1. Commit the version bump and changelog"
echo "  2. Create/switch to 'release' branch"
echo "  3. Push to trigger the release workflow"
echo ""
read -p "Continue? (y/N): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Aborting release preparation"
    # Revert version change
    git checkout -- package.json package-lock.json
    exit 1
fi

# Commit changes
echo "📦 Committing release preparation..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: prepare release v$NEW_VERSION"

# Create or switch to release branch
echo "🌿 Switching to release branch..."
git checkout -B release

# Push to trigger workflow
echo "🚀 Pushing to release branch..."
git push origin release
PUSH_EXIT_CODE=$?
if [ $PUSH_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "⚠️  Regular push to 'release' branch failed."
    echo "This may be because the remote 'release' branch has changes that you do not have locally."
    read -p "Do you want to force push and potentially overwrite remote changes? (y/N): " FORCE_CONFIRM
    if [ "$FORCE_CONFIRM" = "y" ]; then
        git push origin release --force-with-lease
    else
        echo "Aborting release preparation. Please resolve remote changes and try again."
        exit 1
    fi
fi

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to: https://github.com/democratize-technology/claude-code-container-mcp/actions"
echo "2. Watch the 'Build and Release' workflow"
echo "3. Once successful, the release will be:"
echo "   - Published to npm as @democratize-technology/claude-code-container-mcp@$NEW_VERSION"
echo "   - Docker images tagged as $NEW_VERSION"
echo "   - GitHub release created with changelog"
echo ""
echo "After the release succeeds:"
echo "  git checkout main"
echo "  git merge release"
echo "  git push origin main"