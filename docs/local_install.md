# Local Installation & Development Setup (Using `start.sh`)

This method is recommended for local development or when you need to run the server directly from a cloned repository. For a simpler setup, especially if this server is published to NPM, refer to the NPX-based installation method in the main `README.md`.

## Setup Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/steipete/claude-code-mcp.git # Or your fork
    cd claude-code-mcp
    ```
    Ensure you have `chmod +x start.sh` to make the script executable if it isn't already.

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure MCP for `start.sh`:**
    Ensure your `~/.codeium/windsurf/mcp_config.json` (or equivalent MCP configuration file) includes an entry for this server pointing to the local `start.sh` script.

    ```json
    {
      "mcpServers": {
        "claude_code": {
          "type": "stdio",
          "command": "/full/path/to/your/claude-code-mcp/start.sh", // <-- IMPORTANT: Use absolute path
          "args": []
        }
        // ... other MCP server configurations
      }
    }
    ```
    Replace `/full/path/to/your/claude-code-mcp/start.sh` with the absolute path to the `start.sh` script in your cloned repository.

4.  **Permissions for Claude CLI (First-Time Setup):**
    The `start.sh` script attempts to run the Claude CLI (e.g., `claude`) with the `--dangerously-skip-permissions` flag. For this to work the first time you run `claude` or if permissions haven't been granted, you might need to run the Claude CLI manually once from your terminal with this flag to accept any necessary permissions or setup steps it requires:
    ```bash
    claude --dangerously-skip-permissions query "What is the capital of France?"
    ```
    Alternatively, ensure the Claude CLI is configured to allow non-interactive execution with these permissions. Refer to your Claude CLI documentation for details.

5.  **Environment Variables (Optional):**
    You can customize the server behavior by setting environment variables before running `start.sh` or by editing the `start.sh` script itself:
    - `CLAUDE_CLI_PATH`: Set a custom absolute path to the Claude CLI executable.
    - `MCP_CLAUDE_DEBUG`: Set to `true` to enable verbose debug logging.
    Refer to the `start.sh` script for more details on how these are used.
