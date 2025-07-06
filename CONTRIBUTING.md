# Contributing to Claude Code Container MCP Server

First off, thank you for considering contributing to this project! 🎉

## Code of Conduct

By participating in this project, you agree to abide by our principles:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**To report a bug:**

1. Use the issue template
2. Include a clear title and description
3. Provide steps to reproduce
4. Include relevant logs and error messages
5. Specify your environment (OS, Docker version, Node version)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

1. Check if the enhancement has already been suggested
2. Create a detailed proposal explaining:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions considered
   - Potential impact on existing users

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding style**:
   - TypeScript with strict mode
   - ESLint configuration provided
   - Meaningful variable and function names
   - Comments for complex logic

3. **Write tests** for new functionality:
   ```bash
   npm test                 # Run all tests
   npm run test:unit       # Unit tests only
   npm run test:e2e        # End-to-end tests
   ```

4. **Update documentation**:
   - README.md for user-facing changes
   - Code comments for implementation details
   - API documentation for new tools

5. **Commit message format**:
   ```
   feat: add new feature
   fix: resolve specific issue
   docs: update documentation
   test: add missing tests
   refactor: code improvement
   chore: maintenance tasks
   ```

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-code-mcp.git
cd claude-code-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Run tests
npm test
```

## Project Structure

```
claude-code-mcp/
├── src/
│   ├── container-server.ts    # Main MCP server
│   ├── docker/               # Docker management
│   ├── handlers/             # MCP tool handlers
│   ├── services/             # Business logic
│   └── types/                # TypeScript types
├── scripts/                  # Build and utility scripts
├── examples/                 # Usage examples
└── __tests__/               # Test files
```

## Testing Guidelines

### Unit Tests
- Test individual functions and classes
- Mock external dependencies
- Focus on edge cases

### Integration Tests
- Test Docker interactions
- Verify MCP protocol compliance
- Ensure proper error handling

### E2E Tests
- Test complete workflows
- Verify multi-session scenarios
- Test AWS Bedrock integration

## Docker Image Guidelines

When modifying the Docker setup:

1. Minimize image size
2. Use multi-stage builds
3. Pin dependency versions
4. Follow security best practices
5. Document any new environment variables

## Security Considerations

Given the sensitive nature of Docker access:

1. Never bypass security checks
2. Validate all inputs thoroughly
3. Follow principle of least privilege
4. Document security implications
5. Consider attack vectors in code reviews

## Getting Help

- Check the [documentation](README.md)
- Look through [existing issues](https://github.com/democratize-technology/claude-code-mcp/issues)
- Join our [discussions](https://github.com/democratize-technology/claude-code-mcp/discussions)
- Ask questions in issues (use the question label)

## Recognition

Contributors will be recognized in:
- The README.md acknowledgments section
- Release notes for significant contributions
- Our Contributors page (coming soon)

## Release Process

1. PRs are merged to `main`
2. Releases are tagged semantically (v1.2.3)
3. Changelog is updated
4. npm package is published
5. Docker images are built and pushed

Thank you for helping make AI-to-AI workflows more accessible! 🚀
