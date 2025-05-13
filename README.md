# Claude Code MCP Server

An MCP (Model Context Protocol) server that allows running Claude Code in one-shot mode with permissions bypassed automatically.

Did you notice that Cursor sometimes struggles with complex, multi-step edits or operations? This server, with its powerful unified `code` tool, aims to make Claude a more direct and capable agent for your coding tasks.

<img src="screenshot.png" width="600" alt="Screenshot">

## Overview

This MCP server provides one tool that can be used by LLMs to interact with Claude Code. When integrated with Claude Desktop or other MCP clients, it allows LLMs to:

- Run Claude Code with all permissions bypassed (using `--dangerously-skip-permissions`)
- Execute Claude Code with any prompt without permission interruptions
- Access file editing capabilities directly
- Enable specific tools by default

## Prerequisites

- Node.js v20 or later (due to ES Module features like JSON import attributes being used).
- Claude CLI installed and working. Ensure Claude CLI is installed and accessible, preferably by running `claude/doctor`. This installs/updates the CLI to `~/.claude/local/claude`, which this server checks by default.

## Installation & Usage

The recommended way to use this server is by installing it globally via NPM or by using `npx`.

**1. Global Installation (Recommended)**

Install the package globally using NPM:
```bash
npm install -g @steipete/claude-code-mcp
```
This makes the `claude-code-mcp` command available system-wide.

**2. Using with `npx` (No Global Install Needed)**

You can run the server directly using `npx` without a global installation:
```bash
npx @steipete/claude-code-mcp
```
This is convenient for one-off uses or to ensure you're always running the latest version of the server. The server will be downloaded and run without polluting your global namespace.

**For Developers: Local Setup & Contribution**

If you want to develop or contribute to this server, or run it from a cloned repository for testing, please see our [Local Installation & Development Setup Guide](./docs/local_install.md).

## Important First-Time Setup: Accepting Permissions

**Before the MCP server can successfully use the `code` tool, you must first run the Claude CLI manually once with the `--dangerously-skip-permissions` flag and accept the terms.**

This is a one-time requirement by the Claude CLI. You can do this by running a simple command in your terminal, for example:
```bash
claude -p "hello" --dangerously-skip-permissions
```
Or, if `claude` is not in your PATH but you're using the default install location:
```bash
~/.claude/local/claude -p "hello" --dangerously-skip-permissions
```
Follow the prompts to accept. Once this is done, the MCP server will be able to use the flag non-interactively.

## Connecting to Your MCP Client

After setting up the server, you need to configure your MCP client (like Cursor or others that use `mcp.json` or `mcp_config.json`).

### MCP Configuration File

The configuration is typically done in a JSON file. The name and location can vary depending on your client.

#### For Cursor Users

Cursor typically uses `mcp.json`. Common locations:
- **macOS:** `~/.cursor/mcp.json`
- **Windows:** `%APPDATA%\\Cursor\\mcp.json`
- **Linux:** `~/.config/cursor/mcp.json`

#### For Windsurf (and some VS Code setups)

Clients like Windsurf or certain VS Code integrations might use `mcp_config.json` (or sometimes `mcp.json` in a Codeium-related directory). Common locations:
- **macOS:** `~/.codeium/windsurf/mcp_config.json` (or `~/.cursor/mcp.json` if Cursor is also used as a generic client)
- **Windows:** `%APPDATA%\\Codeium\\windsurf\\mcp_config.json` (or `%APPDATA%\\Cursor\\mcp.json`)
- **Linux:** `~/.config/.codeium/windsurf/mcp_config.json` (or `~/.config/cursor/mcp.json`)

Create this file if it doesn't exist. Add or update the configuration for `claude_code`:

**Example for Global Install (`claude-code-mcp`):**
```json
{
  "mcpServers": {
    "claude_code": {
      "type": "stdio",
      "command": ["claude-code-mcp"],
      "env": {
        "MCP_CLAUDE_DEBUG": "false"
      }
    }
  }
}
```

**Example for `npx` usage:**
```json
{
  "mcpServers": {
    "claude_code": {
      "type": "stdio",
      "command": ["npx", "@steipete/claude-code-mcp"],
      "env": {
        "MCP_CLAUDE_DEBUG": "false"
      }
    }
  }
}
```
Choose the `command` array that matches how you intend to run the server. Ensure only one `claude_code` entry exists if you're modifying an existing file.

## Tools Provided

This server exposes one primary tool:

### `code`

Executes a prompt directly using the Claude Code CLI with `--dangerously-skip-permissions`.

**Arguments:**
- `prompt` (string, required): The prompt to send to Claude Code.
- `options` (object, optional):
  - `tools` (array of strings, optional): Specific Claude tools to enable (e.g., `Bash`, `Read`, `Write`). Common tools are enabled by default.

**Example MCP Request:**
```json
{
  "toolName": "claude_code:code",
  "arguments": {
    "prompt": "Refactor the function foo in main.py to be async."
  }
}
```

## Configuration via Environment Variables

The server's behavior can be customized using these environment variables:

- `CLAUDE_CLI_PATH`: Absolute path to the Claude CLI executable.
  - Default: Checks `~/.claude/local/claude`, then falls back to `claude` (expecting it in PATH).
- `MCP_CLAUDE_DEBUG`: Set to `true` for verbose debug logging from this MCP server. Default: `false`.
- `CLAUDE_CLI_TOOLS_DEFAULT`: A comma-separated string of Claude tools to enable by default if not specified in the request (e.g., "Bash,Read,Write").
  - Default: `Bash,Read,Write,DiffPreview,DiffApply,FileTree,FileSearch,CodeSearch`
- `CLAUDE_CLI_TOOLS_DANGEROUS`: A comma-separated string of Claude tools to always enable, regardless of request options.
  - Default: `DiffApply` (as it's crucial for applying changes).

These can be set in your shell environment or within the `env` block of your `mcp.json` server configuration.

## Troubleshooting

- **"Command not found" (claude-code-mcp):** If installed globally, ensure the npm global bin directory is in your system's PATH. If using `npx`, ensure `npx` itself is working.
- **"Command not found" (claude or ~/.claude/local/claude):** Ensure the Claude CLI is installed correctly. Run `claude/doctor` or check its documentation.
- **Permissions Issues:** Make sure you've run the "Important First-Time Setup" step.
- **JSON Errors from Server:** If `MCP_CLAUDE_DEBUG` is `true`, error messages or logs might interfere with MCP's JSON parsing. Set to `false` for normal operation.
- **ESM/Import Errors:** Ensure you are using Node.js v20 or later.

## Contributing

Contributions are welcome! Please refer to the [Local Installation & Development Setup Guide](./docs/local_install.md) for details on setting up your environment.

Submit issues and pull requests to the [GitHub repository](https://github.com/steipete/claude-code-mcp).

## License

MIT