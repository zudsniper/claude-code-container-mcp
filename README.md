# Claude Code MCP Server

An MCP (Model Context Protocol) server that allows running Claude Code in one-shot mode with permissions bypassed automatically.

Did you notice that Cursor often struggles to apply smaller edits via edit_file, especially when linting? And then it tries multiple times till it eventually works? Yeah... no more. It LOVES magic_file.

<img src="docs/screenshot.png" width="600" alt="Screenshot">

## Overview

This MCP server provides one tool that can be used by LLMs to interact with Claude Code. When integrated with Claude Desktop or other MCP clients, it allows LLMs to:

- Run Claude Code with all permissions bypassed (using `--dangerously-skip-permissions`)
- Execute Claude Code with any prompt without permission interruptions
- Access file editing capabilities directly
- Enable specific tools by default

## Prerequisites

- Node.js v16 or later
- TypeScript (for development)
- Claude CLI installed and working. Ensure Claude CLI is installed and accessible, preferably by running `/doctor`. This installs/updates the CLI to `~/.claude/local/claude`, which this server checks by default.

## Setup

This MCP server is designed to be easily run via `npx` if published to NPM, which simplifies setup by not requiring you to clone the repository.

### Recommended Setup: Using NPX (If Published)

If this server is published to NPM (e.g., as `@your-npm-username/claude-mcp-server`), you can configure it in your `~/.codeium/windsurf/mcp_config.json` (or equivalent MCP configuration file) like this:

```json
{
  "mcpServers": {
    "claude_code": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@steipete/claude-code-mcp@latest"
      ]
      // Ensure any required API keys or environment variables are set up
      // as per the package's documentation if it needs them.
    }
    // ... other MCP server configurations
  }
}
```
This `npx` approach handles fetching and running the package. Always use the specific package name once it's published.

**Note on Claude CLI Permissions for NPX Setup:**
Even when run via NPX, the underlying Claude CLI will require its initial permissions to be accepted. If you encounter issues, try running the Claude CLI manually once with the `--dangerously-skip-permissions` flag (e.g., `claude --dangerously-skip-permissions query "Test"`).

### Alternative: Local Installation & Development Setup

For local development, contributing to this server, or if you prefer to run directly from a cloned repository using `start.sh`, please refer to the detailed instructions in:

➡️ **[Local Installation & Development Setup Guide (docs/local_install.md)](docs/local_install.md)**

## Connecting to Windsurf/Codeium

To connect this MCP server to your Windsurf/Codeium client (like Windsurf Editor or a Windsurf-enabled VS Code), you need to add its configuration to your MCP JSON file.

**MCP Configuration File Path:**
The standard path for the MCP configuration file is:
*   `~/.codeium/windsurf/mcp_config.json`

This path is generally used across macOS, Linux (where `~` is your home directory), and Windows (where `~` typically expands to `%USERPROFILE%`).

**Configuration Steps:**

1.  Locate or create your `~/.codeium/windsurf/mcp_config.json` file.
2.  Add the server configuration to this file.
    *   If using the **NPX setup** (recommended), refer to the JSON example in the main `## Setup` section above.
    *   If using the **Local Installation & Development Setup**, refer to the JSON example in the [Local Installation & Development Setup Guide (docs/local_install.md)](docs/local_install.md).
    Ensure you use the correct `command` and `args` as detailed for your chosen setup method.
3.  Restart your client application (Windsurf, VS Code) after modifying the MCP configuration file for changes to take effect.

## Usage

Once installed and connected to an MCP client, you can invoke the tools using the following formats:

### Claude Code Tool (renamed to `code`)

```json
{
  "tool_name": "code",
  "params": {
    "prompt": "Your prompt to Claude Code here"
  }
}
```

#### Prompting Best Practices
The more detailed, clear, and well-structured your prompt, the better Claude can understand and execute your intent. For complex tasks, breaking them down into numbered steps within the prompt is highly effective.

#### Advanced Usage Tip: Handling Large Text Inputs
For prompts that require embedding very large blocks of text (e.g., entire files to be processed, extensive code snippets to be analyzed), directly including them in the JSON payload for the `code` tool can sometimes lead to formatting or escaping issues within the prompt string itself. A robust workaround is to:
1.  Have Claude (or another process) write the large text block to a temporary file within its accessible working directory.
2.  Instruct Claude in your `code` tool prompt to read the content from this temporary file.
3.  Proceed with the rest of your prompt, referencing the content read from the file for subsequent operations.
4.  Optionally, instruct Claude to delete the temporary file after use to clean up.

Example prompt snippet demonstrating this:
```
"Your work folder is /path/to/project

1. Read the full content of './large_input_data.txt' into a variable named DATA.
2. Analyze DATA to find all email addresses.
3. Create a new file 'emails.txt' and write the found email addresses to it.
4. Delete './large_input_data.txt'."
```

This multi-step approach ensures the integrity and accurate transmission of large text inputs.

#### Common Use Cases & Examples:

Remember to always start your prompt with `Your work folder is /path/to/your/project` to set the correct context for Claude.

1.  **Editing Files:**
    *   Change a variable:
        *   `"Your work folder is /Users/steipete/my-project\n\nIn 'src/components/Button.js', change the default button color from 'blue' to 'green'."`
    *   Add a new function:
        *   `"Your work folder is /Users/steipete/my-project\n\nAdd a new JavaScript function to 'utils/helpers.js' that takes two numbers and returns their product. Name the function 'multiplyNumbers'."`

2.  **Running Shell Commands:**
    *   Install a package:
        *   `"Your work folder is /Users/steipete/my-project\n\nRun the command 'npm install react-router-dom'."`
    *   Check git status:
        *   `"Your work folder is /Users/steipete/my-project\n\nExecute 'git status' and tell me the output."`

3.  **Generating New Files:**
    *   Create a new Python file with a class:
        *   `"Your work folder is /Users/steipete/my-project\n\nCreate a new Python file named 'data_processor.py'. Add a class 'Processor' with an empty '__init__' method."`

4.  **Code Refactoring & Analysis:**
    *   Refactor to async/await:
        *   `"Your work folder is /Users/steipete/my-project\n\nRefactor the function 'getUserData' in 'api/user.js' to use async/await instead of Promises."`
    *   Request a security analysis:
        *   `"Your work folder is /Users/steipete/my-project\n\nAnalyze 'services/auth.js' for potential security vulnerabilities and suggest improvements."`

5.  **Multi-step Tasks (Combining Operations):**
    *   Read config, update a file, add a comment, lint, and explain:
        ```text
        Your work folder is /Users/steipete/my-project

        1. Read the content of 'config/settings.json'.
        2. In 'src/app.js', find the line that initializes 'API_ENDPOINT' and update its value to the 'api_url' found in 'config/settings.json'.
        3. Add a comment above this line explaining where the API endpoint value comes from.
        4. Run 'npm run lint -- --fix' to format the changes.
        5. Explain the changes you made.
        ```

6.  **Interacting with Version Control (Git):**
    *   Stage and commit changes:
        *   `"Your work folder is /Users/steipete/my-project\n\nStage all changes in 'src/' and commit them with the message 'Feat: Implement user profile page'."`

7.  **Interacting with GitHub (e.g., Checking PR CI Status):**
    *   Check CI status for a PR:
        ```text
        Your work folder is /Users/steipete/my_project

        1. Check CI status for PR #123 in the repository 'steipete/claude-code-mcp'.
        2. Report back if it's green or red.
        ```

**Prompting Best Practices:**
*   **Be Specific:** The more detailed and clear your prompt, the better.
*   **Context is Key:** Always provide the `Your work folder is ...` line.
*   **Numbered Steps:** For complex tasks, break them down into numbered steps within the prompt. This helps Claude understand and execute your intent effectively.

`options.tools` can be used to specify internal Claude tools (e.g., `Bash`, `Read`, `Write`); common tools are enabled by default if this is omitted.

## Tool Descriptions

The server provides one tool:

1. **Tool name**: `code`
   - **Description**: "Executes a complex **prompt** directly using the Claude Code CLI, bypassing its internal permission checks (`--dangerously-skip-permissions`). This leverages Claude's ability to understand the prompt, reason about the task, and utilize its **internal tools** (like web search, file reading/writing, and bash execution) to achieve the goal. Ideal for complex code generation, analysis, refactoring, running build/test/lint commands (e.g., `npm test`, `pytest`), managing version control (e.g., `git status`, `git commit`), executing multi-step workflows (e.g., '''search for library updates and apply them'''), or performing other tasks requiring integrated reasoning and execution based on a single natural language instruction. Essentially, if you can describe a sequence of operations clearly, this tool can attempt to execute it. **Do not hesitate to use this tool for ambitious, multi-step tasks, even if they seem complex.** Best results are achieved with well-structured, detailed prompts. The server **does NOT automatically inject 'Your work folder is...'** context. If the `prompt` requires specific CWD context (for file operations, relative paths, git commands, etc.), the **`prompt` itself MUST explicitly start with 'Your work folder is /path/to/your/project_root'.** Claude executes within the server's CWD, so relative paths in prompts without explicit CWD context will resolve against the server's CWD. Using absolute paths in prompts is often safest if not providing explicit CWD context. Refer to the 'Example: Complex Multi-step Task' below for a concrete demonstration of its capabilities."
   - **Parameters**:
     - `prompt` (required): The prompt to send to Claude Code
   - **Implementation**: Uses `claude --dangerously-skip-permissions` (invoked via `child_process.spawn`) to bypass all permission checks. The server locates the Claude CLI by first checking the `CLAUDE_CLI_PATH` environment variable, then looking in `~/.claude/local/claude`, and finally falling back to `claude` in the system PATH.

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