# Claude Code MCP Server

An MCP (Model Context Protocol) server that allows running Claude Code in one-shot mode with permissions bypassed automatically.

Did you notice that Cursor often struggles to apply smaller edits via edit_file, especially when linting? And then it tries multiple times till it eventually works? Yeah... no more. It LOVES magic_file.

<img src="screenshot.png" width="600" alt="Screenshot">

## Overview

This MCP server provides two tools that can be used by LLMs to interact with Claude Code. When integrated with Claude Desktop or other MCP clients, it allows LLMs to:

- Run Claude Code with all permissions bypassed (using `--dangerously-skip-permissions`)
- Execute Claude Code with any prompt without permission interruptions
- Access file editing capabilities directly
- Enable specific tools by default

## Prerequisites

- Node.js v16 or later
- TypeScript (for development)
- Claude CLI installed and working. Ensure Claude CLI is installed and accessible, preferably by running `/doctor`. This installs/updates the CLI to `~/.claude/local/claude`, which this server checks by default.

## Installation

1. Clone or download this repository:

```bash
git clone https://github.com/yourusername/claude-mcp-server.git
cd claude-mcp-server
```

2. Install dependencies (this will also install `tsx` for direct TypeScript execution):

```bash
npm install
```

3. Make the start script executable:

```bash
chmod +x start.sh
```

## Important First-Time Setup: Accepting Permissions

**Before the MCP server can successfully use the `code` or `magic_file` tools, you must first run the Claude CLI manually once with the `--dangerously-skip-permissions` flag and accept the terms.**

This is a one-time requirement by the Claude CLI. You can do this by running a simple command in your terminal, for example:

```bash
claude -p "hello" --dangerously-skip-permissions
```

Or, if `claude` is not in your PATH but you're using the default install location:

```bash
~/.claude/local/claude -p "hello" --dangerously-skip-permissions
```

Follow the prompts to accept. Once this is done, the MCP server will be able to use the flag non-interactively.

## Connecting to Cursor/Windsurf/Visual Studio Code

### macOS

1. Locate the MCP configuration file:
   ```
   ~/.cursor/mcp.json
   ```
   Create this file if it doesn't exist.

2. Add the server configuration to the file:

```json
{
  "mcpServers": {
    "claude_code": {
      "type": "stdio",
      "command": "/absolute/path/to/claude-mcp-server/start.sh",
      "args": []
    }
  }
}
```

Make sure to replace `/absolute/path/to/claude-mcp-server` with the actual path to where you installed this server.

### Windows

1. Locate the MCP configuration file:
   ```
   %APPDATA%\cursor\mcp.json
   ```
   Create this file if it doesn't exist.

2. Add the server configuration to the file, making sure to use Windows path format:

```json
{
  "mcpServers": {
    "claude_code": {
      "type": "stdio",
      "command": "C:\\path\\to\\claude-mcp-server\\start.bat",
      "args": []
    }
  }
}
```

For Windows, you should use the batch file (start.bat) instead of the shell script.

### Linux

1. Locate the MCP configuration file:
   ```
   ~/.config/cursor/mcp.json
   ```
   Create this file if it doesn't exist.

2. Add the server configuration to the file:

```json
{
  "mcpServers": {
    "claude_code": {
      "type": "stdio",
      "command": "/absolute/path/to/claude-mcp-server/start.sh",
      "args": []
    }
  }
}
```

3. After updating the configuration, restart your IDE to load the MCP server.

## Environment Variables

You can customize the server behavior with the following environment variables (edit them in `start.sh` or `start.bat`):

- `CLAUDE_CLI_PATH`: **Optional.** Set a custom absolute path to the Claude CLI executable. If set and the path points to an existing file, this path will be used directly.
- `MCP_CLAUDE_DEBUG`: Set to `true` to enable verbose debug logging from the server to stderr (e.g., `MCP_CLAUDE_DEBUG=true ./start.sh`).

**Claude CLI Discovery Order:**
1.  The path specified by the `CLAUDE_CLI_PATH` environment variable (if set and valid).
2.  The default installation path for Unix-like systems: `~/.claude/local/claude` (where `~` is the user's home directory). For Windows users, this automatic check may not apply; relying on `CLAUDE_CLI_PATH` or ensuring `claude` is in the system PATH is recommended.
3.  Defaults to simply `claude`, relying on the system's PATH for resolution (a warning will be logged if this fallback is used).

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
    "claude_code": {
      "command": "/absolute/path/to/claude-mcp-server/start.sh",
      "args": [],
      "disabled": false
    }
  }
}
```

## Usage

Once installed and connected to an MCP client, you can invoke the tools using the following formats:

### Claude Code Tool (renamed to `code`)

```json
{
  "tool_name": "code",
  "params": {
    "prompt": "Your prompt to Claude Code here",
    "options": {
      "tools": ["Bash", "Read", "Write"]
    }
  }
}
```

If no tools are specified, the server enables common tools by default.

#### Example: Complex Multi-step Task

The `code` tool can handle surprisingly complex, multi-step instructions. For instance, the following prompt was used successfully to identify screenshots on the desktop, copy them to the project, update this README with the new images and captions, and then stage, commit, and push all related changes (including a `package.json` update) to GitHub, all in one go:

```text
Your work folder is /Users/steipete/Projects/claude-mcp/mcp-server/

Here's a multi-step task:
1.  Identify two screenshot image files on the user's desktop located at /Users/steipete/Desktop/. One is an existing screenshot, likely named something like 'cursor-screenshot.png' or related to Cursor IDE. The other is a newer screenshot depicting an AI tool (like Cascade) using another tool for git operations.
2.  Copy these two identified screenshot files into the current project directory (/Users/steipete/Projects/claude-mcp/mcp-server/). Ensure the one related to Cursor is named `cursor-screenshot.png`. Name the new screenshot (showing the AI tool and git operations) as `claude_tool_git_example.png`.
3.  Modify the `README.md` file in the project directory. In the '## Example Screenshots' section:
    a.  Ensure there's an entry for `cursor-screenshot.png` (e.g., `<img src="cursor-screenshot.png" width="600" alt="Cursor Screenshot">`).
    b.  Add a new entry for `claude_tool_git_example.png`. It should be an image tag like `<img src="claude_tool_git_example.png" width="600" alt="Screenshot of AI assistant using mcp1_code tool for git operations">` followed by the caption on a new line: "Tools seem to prefer it even for git operations as it runs faster and in one shot."
4.  Stage the following files for a git commit: `README.md`, `cursor-screenshot.png`, `claude_tool_git_example.png`, and `package.json`.
5.  Commit the staged changes with the message: "docs: add example screenshots and update dependencies".
6.  Push the commit to the default remote repository (origin) and the current branch (likely main).
```

### Magic File Edit Tool (`magic_file`)

```json
{
  "tool_name": "magic_file",
  "params": {
    "file_path": "/path/to/your/file.js",
    "instruction": "Refactor the processData function to use async/await instead of promises."
  }
}
```

## Tool Descriptions

The server provides two tools:

1. **Tool name**: `code`
   - **Description**: "**Highly Versatile & Powerful:** Executes a given prompt directly with the Claude Code CLI, bypassing ALL permission checks (`--dangerously-skip-permissions`). This tool is **not limited to simple commands; it can orchestrate complex, multi-step workflows** based on a single, detailed natural language prompt. This includes, but is not limited to:
    - Advanced code generation, analysis, and refactoring.
    - Performing web searches and summarizing content.
    - Executing arbitrary terminal commands (e.g., opening applications, URLs, or files).
    - **Sophisticated file system operations:** such as identifying, copying, and moving files (even from outside the immediate project workspace, like the user's Desktop, if precise paths are provided or can be reasonably inferred from the prompt).
    - **Comprehensive Git workflows:** including staging specific files, committing with detailed messages, and pushing to remote repositories.
    - **Automated file modifications:** like updating READMEs, configuration files, or source code based on instructions.
Essentially, if you can describe a sequence of operations clearly, this tool can attempt to execute it. **Do not hesitate to use this tool for ambitious, multi-step tasks, even if they seem complex.** Best results are achieved with well-structured, detailed prompts. The server **does NOT automatically inject 'Your work folder is...'** context. If the `prompt` requires specific CWD context (for file operations, relative paths, git commands, etc.), the **`prompt` itself MUST explicitly start with 'Your work folder is /path/to/your/project_root'.** Claude executes within the server's CWD, so relative paths in prompts without explicit CWD context will resolve against the server's CWD. Using absolute paths in prompts is often safest if not providing explicit CWD context. Refer to the 'Example: Complex Multi-step Task' below for a concrete demonstration of its capabilities. `options.tools` can be used to specify internal Claude tools (e.g., `Bash`, `Read`, `Write`); common tools are enabled by default if this is omitted."
   - **Parameters**:
     - `prompt` (required): The prompt to send to Claude Code
     - `options.tools` (optional): Array of specific tools to enable
   - **Implementation**: Uses `claude --dangerously-skip-permissions` (invoked via `child_process.spawn`) to bypass all permission checks. The server locates the Claude CLI by first checking the `CLAUDE_CLI_PATH` environment variable, then looking in `~/.claude/local/claude`, and finally falling back to `claude` in the system PATH.

2. **Tool name**: `magic_file`
   - **Description**: "Edits a specified file based on natural language instructions, leveraging the Claude Code CLI with all editing permissions bypassed (`--dangerously-skip-permissions`). Best for complex or semantic file modifications where describing the desired change in plain language is more effective than precise line-by-line edits. Requires a `file_path` and a descriptive `instruction`. The server **does NOT automatically inject 'Your work folder is...'** context. The `file_path` argument can be relative (resolved by server against its CWD) or absolute. If the edit described in the `instruction` relies on a specific project structure or uses relative paths for other files, the **`instruction` itself MUST explicitly start with 'Your work folder is /path/to/your/project_root'.** An absolute `file_path` is recommended if no CWD context is provided in the `instruction`. Also a great alternative if a general-purpose `edit_file` tool is struggling with complex edits or specific file types. Example instruction: 'Refactor the processData function to use async/await instead of promises.'"
   - **Parameters**:
     - `file_path` (required): The absolute path to the file to edit
     - `instruction` (required): Free text description of the edits to make to the file
   - **Implementation**: Uses `claude --dangerously-skip-permissions -p "Edit file \"${absoluteFilePath}\": ${args.instruction}"` to perform file edits. Path resolution and CLI discovery are the same as the `code` tool.

## Example Screenshots

<img src="cursor-screenshot.png" width="600" alt="Cursor Screenshot">

<img src="claude_tool_git_example.png" width="600" alt="Screenshot of AI assistant using mcp1_code tool for git operations">
Tools seem to prefer it even for git operations as it runs faster and in one shot.

<img src="additional_claude_screenshot.png" width="600" alt="Additional example screenshot provided by the user">
This screenshot showcases another aspect of the project.

## Troubleshooting

- **Tool not showing up**: Check the Claude logs for errors when starting the MCP server. Ensure `start.sh` or `start.bat` is executable and `tsx` is installed and runnable (usually via `npx`).
- **Command not found / "Error: spawn claude ENOENT" / "[Warning] Claude CLI not found... Falling back to \"claude\" in PATH..."**: This means the server could not find the `claude` executable via the `CLAUDE_CLI_PATH` environment variable (if set), at the default Unix-like location (`~/.claude/local/claude`), or in the system PATH (if it fell back to just `'claude'`).
    - Ensure the Claude CLI is installed correctly. For Unix-like systems, this is often at `~/.claude/local/claude` (verify by running `/doctor` in a Claude context). For Windows, ensure it's in your system PATH or set `CLAUDE_CLI_PATH`.
    - Explicitly set the `CLAUDE_CLI_PATH` environment variable in `start.sh` or `start.bat` to the correct absolute path of your `claude` executable.
- **Permission errors**: Ensure the `start.sh` script is executable and that Node.js has permission to execute `tsx` and the Claude CLI (whether found via `CLAUDE_CLI_PATH`, the default path, or the system PATH).

## License

MIT

Server test complete.

<a href="https://glama.ai/mcp/servers/@steipete/claude-code-mcp">
<img width="380" height="200" src="https://glama.ai/mcp/servers/@steipete/claude-code-mcp/badge" alt="Claude Code Server MCP server" />
</a>