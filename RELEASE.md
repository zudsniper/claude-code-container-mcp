# Release Process

This document describes the release process for claude-code-container-mcp. The project uses automated CI/CD workflows for publishing to npm and Docker Hub.

## Pre-release Testing

1. **Local Testing**
   ```bash
   # Run the test release script
   ./scripts/test-release.sh
   ```
   This will:
   - Build the project
   - Run all tests
   - Set up local testing in Claude

2. **Test in Claude**
   - Restart Claude Desktop app
   - Use the `claude-code-local` tool
   - Verify version print on first use
   - Test various commands

3. **Restore Original Config**
   ```bash
   # When done testing
   ./scripts/restore-config.sh
   ```

## Publishing a Release

### Automated Release (Recommended)

Use the automated workflow by pushing to the `release` branch:

```bash
# Use the prepare script for guided release
./scripts/prepare-release.sh
```

Or manually:

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Update CHANGELOG.md
$EDITOR CHANGELOG.md

# 3. Commit changes
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: prepare release vX.Y.Z"

# 4. Push to release branch
git checkout -B release
git push origin release
```

The GitHub Actions workflow will automatically:
1. Verify the version is new
2. Run all tests
3. Publish to npm
4. Build and push Docker images (3 images)
5. Create GitHub release with changelog

### Manual Release (Emergency Only)

If automation fails, use the manual script:

```bash
./scripts/publish-release.sh
```

This will:
1. Ensure you're on main branch
2. Run tests
3. Build the project
4. Bump version (patch/minor/major)
5. Update changelog
6. Create git tag
7. Push to GitHub
8. Create GitHub release
9. Publish to npm

## CI/CD Setup

Before using automated releases, configure GitHub secrets:

1. **NPM_TOKEN**: Get from [npmjs.com](https://www.npmjs.com/) → Access Tokens
2. **DOCKERHUB_USERNAME**: Your Docker Hub username
3. **DOCKERHUB_TOKEN**: Get from [Docker Hub](https://hub.docker.com/) → Security → Access Tokens

See [docs/SETUP_DEPLOYMENT_WORKFLOWS.md](docs/SETUP_DEPLOYMENT_WORKFLOWS.md) for detailed setup instructions.

## Emergency Fixes

For critical fixes:
1. Fix the issue
2. Test locally with `./scripts/test-release.sh`
3. Once verified, use automated release via `./scripts/prepare-release.sh`
4. If automation fails, use manual `./scripts/publish-release.sh` with patch version

## Version Guidelines

- **Patch**: Bug fixes, documentation updates
- **Minor**: New features, non-breaking changes
- **Major**: Breaking changes, major refactors

## Testing Configurations

- **Production**: `/Library/Application Support/Claude/claude_desktop_config.json`
- **Local Test**: `/Library/Application Support/Claude/claude_desktop_config_local_test.json`

Always test with the local configuration before publishing!