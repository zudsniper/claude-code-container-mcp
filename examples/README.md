# Claude Code MCP Examples

This directory contains practical examples of using the Claude Code Container MCP Server.

## Available Examples

### 1. Multi-Session Development (`multi-session.js`)
Shows how to work on multiple components simultaneously using parallel Claude Code sessions.

**Use case**: Refactoring frontend while implementing backend features.

### 2. Enterprise AWS Bedrock (`enterprise-bedrock.js`)
Demonstrates using AWS Bedrock for enterprise compliance requirements.

**Use case**: SOC2 compliance updates with audit logging.

### 3. CI/CD Integration (`github-actions.yml`)
GitHub Actions workflow for automated AI code reviews on pull requests.

**Use case**: Automated security and quality checks.

## Running the Examples

### Prerequisites
1. Build and start the MCP server
2. Set required environment variables (API keys, AWS credentials)
3. Install dependencies: `npm install @modelcontextprotocol/sdk`

### Basic Usage
```bash
# Run an example
node multi-session.js

# With AWS Bedrock
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
node enterprise-bedrock.js
```

## Creating Your Own Examples

Feel free to contribute additional examples! Good examples should:
- Demonstrate a real-world use case
- Include error handling
- Have clear comments
- Show best practices

Submit a PR with your example and we'll review it for inclusion.
