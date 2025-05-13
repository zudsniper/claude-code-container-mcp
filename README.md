# Claude Code MCP Server

An MCP (Model Context Protocol) server that allows running Claude Code in one-shot mode with permissions bypassed automatically.

## Overview

This MCP server provides a tool called `claudecode` that can be used by LLMs to call Claude Code directly. When integrated with Claude Desktop or other MCP clients, it allows LLMs to:

- Run Claude Code with all permissions pre-approved
- Execute Claude Code with any prompt
- Enable specific tools by default

## Prerequisites

- Node.js v16 or later
- TypeScript (for development)
- Claude CLI installed and working

## Installation

1. Clone or download this repository:

```bash
git clone https://github.com/yourusername/claude-mcp-server.git
cd claude-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Build the TypeScript code:

```bash
npm run build
```

4. Make the start script executable:

```bash
chmod +x start.sh
```

## Connecting to Claude Desktop

To connect the MCP server with Claude Desktop:

### macOS

1. Locate the Claude Desktop configuration file:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```
   Create this file if it doesn't exist.

2. Add the server configuration to the file:

```json
{
  "mcpServers": {
    "claudecode": {
      "type": "stdio",
      "command": "/absolute/path/to/claude-mcp-server/start.sh",
      "args": []
    }
  }
}
```

Make sure to replace `/absolute/path/to/claude-mcp-server` with the actual path to where you installed this server.

### Windows

1. Locate the Claude Desktop configuration file:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```
   Create this file if it doesn't exist.

2. Add the server configuration to the file, making sure to use Windows path format:

```json
{
  "mcpServers": {
    "claudecode": {
      "type": "stdio",
      "command": "C:\\path\\to\\claude-mcp-server\\start.sh",
      "args": []
    }
  }
}
```

For Windows, you might need to use a batch file (start.bat) instead of the shell script.

### Linux

1. Locate the Claude Desktop configuration file:
   ```
   ~/.config/Claude/claude_desktop_config.json
   ```
   Create this file if it doesn't exist.

2. Add the server configuration to the file:

```json
{
  "mcpServers": {
    "claudecode": {
      "type": "stdio",
      "command": "/absolute/path/to/claude-mcp-server/start.sh",
      "args": []
    }
  }
}
```

3. After updating the configuration, restart Claude Desktop to load the MCP server.

## Environment Variables

You can customize the server behavior with the following environment variables (edit them in start.sh):

- `CLAUDE_CLI_PATH`: Set a custom path to the Claude CLI executable

If not specified, the server will attempt to find the Claude CLI in common locations:
- `~/.claude/local/claude`
- `~/.local/bin/claude`
- `~/bin/claude`
- `/usr/local/bin/claude`
- `/usr/bin/claude`
- `claude` (in PATH)

## Connecting to VSCode Claude

To use this MCP server with Claude in VSCode:

1. Install the Claude extension in VSCode

2. Create or edit the MCP settings file:
   ```
   ~/.vscode/extensions/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   ```

3. Add the server configuration:

```json
{
  "mcpServers": {
    "claudecode": {
      "command": "/absolute/path/to/claude-mcp-server/start.sh",
      "args": [],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Usage

Once installed and connected to an MCP client like Claude Desktop, you can invoke the tool using the following format:

```json
{
  "prompt": "Your prompt to Claude Code here",
  "options": {
    "tools": ["Bash", "Read", "Write"]
  }
}
```

If no tools are specified, the server enables common tools by default.

## Tool Description

The server provides a single tool:

- **Tool name**: `claudecode`
- **Description**: "Call when you want to edit a file in free text or answer any question or modify code. Claude can do basically anything as it is an AI."
- **Parameters**:
  - `prompt` (required): The prompt to send to Claude Code
  - `options.tools` (optional): Array of specific tools to enable

## Troubleshooting

- **Tool not showing up**: Check the Claude logs for errors when starting the MCP server.
- **Command not found**: Ensure Claude CLI is installed and available in one of the search paths.
- **Permission errors**: Ensure the start.sh script is executable.

## License

MIT