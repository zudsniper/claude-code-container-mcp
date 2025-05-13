# Changelog

## [1.0.0] - 2025-05-13

### Added
- Initial version of the Claude Code MCP server.
- `code` tool: Executes arbitrary prompts with the Claude CLI, enabling code generation, web search, and running terminal commands (like opening apps/URLs).
- `magic_file` tool: Edits files based on natural language instructions using the Claude CLI. Handles relative and absolute paths.
- Dynamic Claude CLI path finding: Checks `CLAUDE_CLI_PATH` env var, then `~/.claude/local/claude`, then falls back to `claude` in PATH.