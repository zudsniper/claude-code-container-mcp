# Setting Up Deployment Workflows

This guide will walk you through setting up the automated deployment workflows for the Claude Code Container MCP Server. These workflows will automatically publish to npm and Docker Hub when you push to the `release` branch.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Required Secrets](#required-secrets)
  - [NPM Token Setup](#npm-token-setup)
  - [Docker Hub Token Setup](#docker-hub-token-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Workflow Overview](#workflow-overview)
- [Release Process](#release-process)
- [Docker Image Tags](#docker-image-tags)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the workflows, ensure you have:

1. **npm account** with publishing rights to `@democratize-technology` scope (or your own scope)
2. **Docker Hub account** with repository creation permissions
3. **GitHub repository** with Actions enabled
4. **Admin access** to your GitHub repository (to add secrets)

## Required Secrets

The workflows require three secrets to be configured in your GitHub repository:

| Secret Name | Description | Required For |
|------------|-------------|--------------|
| `NPM_TOKEN` | npm authentication token | Publishing packages to npm |
| `DOCKERHUB_USERNAME` | Docker Hub username | Pushing Docker images |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Pushing Docker images |

### NPM Token Setup

1. **Log in to npmjs.com**
   - Go to [https://www.npmjs.com/](https://www.npmjs.com/)
   - Sign in to your account

2. **Generate an Access Token**
   - Click on your profile avatar (top right)
   - Select **Access Tokens**
   - Click **Generate New Token**
   - Select **Classic Token**
   - Choose token type: **Automation** (recommended for CI/CD)
   - Give it a descriptive name like `github-actions-claude-code-mcp`
   - Click **Generate Token**
   - **Copy the token immediately** (you won't see it again!)

3. **Token Permissions**
   - The Automation token automatically has the right permissions for publishing
   - If using a Granular Access Token instead:
     - Set **Packages and scopes**: Read and Write
     - Set **Organizations**: Select your org if publishing to a scope

### Docker Hub Token Setup

1. **Log in to Docker Hub**
   - Go to [https://hub.docker.com/](https://hub.docker.com/)
   - Sign in to your account

2. **Create an Access Token**
   - Click on your username (top right)
   - Select **Account Settings**
   - Go to **Security** tab
   - Click **New Access Token**
   - Provide a description like `github-actions-claude-code-mcp`
   - Select permissions:
     - **Public Repo Read** ✅
     - **Public Repo Write** ✅ (required for pushing)
   - Click **Generate**
   - **Copy the token immediately** (you won't see it again!)

3. **Create Docker Hub Repositories** (if they don't exist)
   - Go to [https://hub.docker.com/repositories](https://hub.docker.com/repositories)
   - Click **Create Repository** for each:
     - `democratizetechnology/claude-code-container-mcp`
     - `democratizetechnology/claude-code-custom`
     - `democratizetechnology/claude-code-mcp`
   - Set them all as **Public** repositories

## GitHub Secrets Configuration

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click **Settings** tab
   - In the left sidebar, expand **Secrets and variables**
   - Click **Actions**

2. **Add Repository Secrets**
   - Click **New repository secret** for each:

   **NPM_TOKEN:**
   - Name: `NPM_TOKEN`
   - Secret: Paste your npm token
   - Click **Add secret**

   **DOCKERHUB_USERNAME:**
   - Name: `DOCKERHUB_USERNAME`
   - Secret: Your Docker Hub username (not email)
   - Click **Add secret**

   **DOCKERHUB_TOKEN:**
   - Name: `DOCKERHUB_TOKEN`
   - Secret: Paste your Docker Hub access token
   - Click **Add secret**

3. **Verify Secrets**
   - You should see all three secrets listed
   - They will show as `***` (hidden)
   - Last updated timestamp will be shown

## Workflow Overview

### Release Workflow (`release.yml`)

Triggered when you push to the `release` branch. It performs:

1. **Version Check**: Ensures the version in package.json is new
2. **Testing**: Runs the test suite
3. **NPM Publishing**: Publishes to npm registry
4. **Docker Builds**: Builds and pushes three Docker images:
   - `claude-code-container-mcp`: The MCP server
   - `claude-code-custom`: Custom Claude Code base image
   - `claude-code-mcp`: MCP-enabled Claude Code
5. **GitHub Release**: Creates a release with auto-generated changelog

### Docker Update Workflow (`docker-update.yml`)

Triggered when Docker-related files change on `main` branch:
- Rebuilds and pushes Docker images with `dev` tag
- Useful for Docker-specific fixes without version bumps

## Release Process

### Step 1: Prepare Your Release

1. **Update Version in package.json**
   ```bash
   # For a patch release (bug fixes)
   npm version patch
   
   # For a minor release (new features)
   npm version minor
   
   # For a major release (breaking changes)
   npm version major
   ```

2. **Update CHANGELOG.md**
   - Add a new section for your version
   - List all changes, fixes, and features
   - Follow the [Keep a Changelog](https://keepachangelog.com/) format

3. **Commit Your Changes**
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore: bump version to X.Y.Z"
   ```

### Step 2: Create and Push to Release Branch

```bash
# Create or switch to release branch
git checkout -b release

# Push to trigger the workflow
git push origin release
```

### Step 3: Monitor the Release

1. Go to the **Actions** tab in your GitHub repository
2. Watch the "Build and Release" workflow progress
3. Check each job for successful completion

### Step 4: Verify the Release

After successful completion, verify:

1. **NPM Package**: 
   ```bash
   npm view @democratize-technology/claude-code-container-mcp
   ```

2. **Docker Images**:
   ```bash
   docker pull democratizetechnology/claude-code-container-mcp:latest
   docker pull democratizetechnology/claude-code-custom:latest
   docker pull democratizetechnology/claude-code-mcp:latest
   ```

3. **GitHub Release**: Check the Releases page for the new version

### Step 5: Merge Back to Main

After successful release:

```bash
# Switch to main branch
git checkout main

# Merge release branch
git merge release

# Push to main
git push origin main

# Optionally, delete the release branch
git branch -d release
git push origin --delete release
```

## Docker Image Tags

Each Docker image is tagged with:

- `latest`: Always points to the most recent release
- `X.Y.Z`: Specific version tags (e.g., `3.0.1`)
- `dev`: Latest development build (from docker-update workflow)
- `dev-{sha}`: Specific development build tied to commit

## Troubleshooting

### Version Already Exists Error

**Problem**: Workflow fails with "Version already exists on npm"

**Solution**: 
- Bump the version in package.json to a new version
- Ensure you're not trying to republish an existing version

### NPM Authentication Failed

**Problem**: NPM publish fails with 401 or 403 error

**Solutions**:
- Verify your NPM_TOKEN secret is correctly set
- Check token hasn't expired
- Ensure token has publish permissions
- For scoped packages, ensure you have access to the scope

### Docker Push Failed

**Problem**: Docker push fails with authentication error

**Solutions**:
- Verify DOCKERHUB_USERNAME is your username, not email
- Check DOCKERHUB_TOKEN is valid and not expired
- Ensure Docker Hub repositories exist
- Verify you have push permissions to the repositories

### Build Failures

**Problem**: TypeScript build or tests fail

**Solutions**:
- Run `npm run build` locally to check for errors
- Run `npm test` locally to ensure tests pass
- Check Node.js version compatibility

### Workflow Not Triggering

**Problem**: Pushing to release branch doesn't trigger workflow

**Solutions**:
- Ensure the branch name is exactly `release`
- Check if Actions are enabled in repository settings
- Verify the workflow file is in `.github/workflows/`
- Check for syntax errors in YAML

## Environment Variables

The workflows use these environment variables (defined in workflow files):

| Variable | Value | Description |
|----------|-------|-------------|
| `DOCKER_ORG` | `democratizetechnology` | Docker Hub organization |
| `NPM_PACKAGE` | `@democratize-technology/claude-code-container-mcp` | Full npm package name |

To use your own organization/package:
1. Fork the repository
2. Update these values in the workflow files
3. Update package.json with your scope/name

## Manual Workflow Dispatch

Both workflows support manual triggering:

1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**
4. For docker-update, you can specify a custom tag

## Security Best Practices

1. **Rotate Tokens Regularly**: Change your tokens every 90 days
2. **Use Minimal Permissions**: Only grant necessary permissions
3. **Monitor Usage**: Check npm and Docker Hub for unexpected publishes
4. **Protect Branches**: Set up branch protection rules for `main` and `release`
5. **Review Workflow Changes**: Require PR reviews for workflow modifications

## Getting Help

If you encounter issues:

1. Check the [GitHub Actions logs](https://github.com/democratize-technology/claude-code-container-mcp/actions)
2. Review [common CI/CD issues](https://docs.github.com/en/actions/troubleshooting)
3. Open an [issue](https://github.com/democratize-technology/claude-code-container-mcp/issues)
4. Check [npm documentation](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow)
5. Review [Docker Hub documentation](https://docs.docker.com/docker-hub/access-tokens/)

## Next Steps

After setting up the workflows:

1. Test with a pre-release version (e.g., `3.0.1-beta.1`)
2. Monitor the first few releases closely
3. Set up additional notifications (Slack, email) for workflow status
4. Consider adding more comprehensive tests
5. Document your release schedule and versioning strategy