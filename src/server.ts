#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type ServerResult,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve as pathResolve } from 'node:path';

// Define debugMode globally using const
const debugMode = process.env.MCP_CLAUDE_DEBUG === 'true';

/**
 * Determine the Claude CLI command/path.
 * 1. Checks CLAUDE_CLI_PATH environment variable.
 * 2. Checks for Claude CLI at ~/.claude/local/claude.
 * 3. Defaults to 'claude' if not found, relying on spawn() to perform PATH lookup.
 */
function findClaudeCli(debugMode: boolean): string {
  // 1. Check environment variable first
  if (debugMode) console.error('[Debug] Checking for CLAUDE_CLI_PATH environment variable...');
  const envPath = process.env.CLAUDE_CLI_PATH;

  if (envPath) {
    if (debugMode) console.error(`[Debug] CLAUDE_CLI_PATH is set to: "${envPath}".`);
    if (existsSync(envPath)) {
      if (debugMode) console.error(`[Debug] Found Claude CLI via CLAUDE_CLI_PATH: "${envPath}". Using this path.`);
      return envPath;
    }
    // If existsSync(envPath) was false, we reach here.
    if (debugMode) console.error(`[Debug] CLAUDE_CLI_PATH "${envPath}" was set, but the file does not exist. Checking default user path next.`);
  } else {
    if (debugMode) console.error('[Debug] CLAUDE_CLI_PATH environment variable is not set. Checking default user path next.');
  }

  // 2. Check default user path: ~/.claude/local/claude
  if (debugMode) console.error('[Debug] Checking for Claude CLI at default user path (~/.claude/local/claude)...');
  try {
    const userPath = join(homedir(), '.claude', 'local', 'claude');
    if (existsSync(userPath)) {
      if (debugMode) console.error(`[Debug] Found Claude CLI at default user path: ${userPath}`);
      return userPath;
    }
    // If not returned, it means userPath does not exist, so log it.
    if (debugMode) console.error(`[Debug] Claude CLI not found at default user path: ${userPath}.`);
  } catch (err) {
    if (debugMode) console.error(`[Debug] Error checking default user path: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  // 3. Default to 'claude' command name
  if (debugMode) console.error('[Debug] CLAUDE_CLI_PATH not set or invalid, and not found at default user path. Defaulting to "claude" command name, relying on spawn/PATH lookup.');
  console.warn('[Warning] Claude CLI not found via CLAUDE_CLI_PATH or at ~/.claude/local/claude. Falling back to "claude" in PATH. Ensure it is installed and accessible.');
  return 'claude'; // Return base command name
}

/**
 * Interface for Claude Code tool arguments
 */
interface ClaudeCodeArgs {
  prompt: string;
  options?: {
    tools?: string[];
  };
}

interface ClaudeFileEditArgs {
  file_path: string;
  instruction: string;
}

// Ensure spawnAsync is defined correctly *before* the class
async function spawnAsync(command: string, args: string[], options?: { timeout?: number, cwd?: string }): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    if (debugMode) {
      console.error(`[Spawn] Running command: ${command} ${args.join(' ')}`);
    }
    const process = spawn(command, args, {
      shell: false, // Keep shell false
      timeout: options?.timeout,
      cwd: options?.cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => { stdout += data.toString(); });
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      if (debugMode) { console.error(`[Spawn Stderr Chunk] ${data.toString()}`); }
    });

    process.on('error', (error) => {
      if (debugMode) { console.error(`[Spawn Error Event] ${error.message}`); }
      reject(new Error(`Spawn error: ${error.message}\nStderr: ${stderr.trim()}`));
    });

    process.on('close', (code) => {
      if (debugMode) {
        console.error(`[Spawn Close] Exit code: ${code}`);
        console.error(`[Spawn Stderr Full] ${stderr.trim()}`);
        console.error(`[Spawn Stdout Full] ${stdout.trim()}`);
      }
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}\nStderr: ${stderr.trim()}\nStdout: ${stdout.trim()}`));
      }
    });
  });
}

/**
 * MCP Server for Claude Code
 * Provides a simple MCP tool to run Claude CLI in one-shot mode
 */
class ClaudeCodeServer {
  private server: Server;
  private claudeCliPath: string; // This now holds either a full path or just 'claude'

  constructor() {
    // Use the simplified findClaudeCli function
    this.claudeCliPath = findClaudeCli(debugMode);
    console.error(`[Setup] Using Claude CLI command/path: ${this.claudeCliPath}`);

    this.server = new Server(
      {
        name: 'claude_code',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up the MCP tool handlers
   */
  private setupToolHandlers(): void {
    // Define available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'code',
          description: "**Highly Versatile & Powerful:** Executes a given prompt directly with the Claude Code CLI, bypassing ALL permission checks (`--dangerously-skip-permissions`). This tool is **not limited to simple commands; it can orchestrate complex, multi-step workflows** based on a single, detailed natural language prompt. This includes, but is not limited to:\n    - Advanced code generation, analysis, and refactoring.\n    - Performing web searches and summarizing content.\n    - Executing arbitrary terminal commands (e.g., opening applications, URLs, or files).\n    - **Sophisticated file system operations:** such as identifying, copying, and moving files (even from outside the immediate project workspace, like the user's Desktop, if precise paths are provided or can be reasonably inferred from the prompt).\n    - **Comprehensive Git workflows:** including staging specific files, committing with detailed messages, and pushing to remote repositories.\n    - **Automated file modifications:** like updating READMEs, configuration files, or source code based on instructions.\nEssentially, if you can describe a sequence of operations clearly, this tool can attempt to execute it. **Do not hesitate to use this tool for ambitious, multi-step tasks, even if they seem complex.** Best results are achieved with well-structured, detailed prompts. The server automatically includes its current working directory in the context provided to Claude. While you don't need to manually add 'Your work folder is...', ensuring your prompt is clear about file paths and project context remains beneficial, especially for complex tasks. `options.tools` can further specify which internal Claude tools are allowed (e.g., `Bash`, `Read`, `Write`); common tools are enabled by default if this is omitted.",
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The prompt to send to Claude Code',
              },
              options: {
                type: 'object',
                properties: {
                  tools: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    description: 'Optional tools to enable',
                  }
                },
                description: 'Additional options for Claude Code execution',
              },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'magic_file',
          description: "Edits a specified file based on **natural language instructions**, leveraging the Claude Code CLI with its internal editing permissions bypassed (`--dangerously-skip-permissions`). Accepts both relative (resolved from workspace root) and absolute paths. Best for complex or semantic file modifications where describing the desired **intent** is easier than specifying exact line changes, such as: renaming variables/functions throughout the file, applying standard code patterns or formatting, converting syntax (e.g., Promises to async/await), or creating new files with standard boilerplate (e.g., \'\'\'Create a basic Express route file\'\'\'). Requires a `file_path` and a descriptive `instruction`. Acts as a powerful and robust alternative when standard diff-based editing tools struggle with ambiguity or large-scale changes.",
          inputSchema: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: 'The absolute path to the file to edit',
              },
              instruction: {
                type: 'string',
                description: 'Free text description of the edits to make to the file',
              }
            },
            required: ['file_path', 'instruction'],
          },
        }
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<ServerResult> => {
      try {
        let claudePrompt: string;
        // Initialize with common args, specific args like -p will be added later
        const baseCommandArgs: string[] = ['--dangerously-skip-permissions'];
        let finalCommandArgs: string[];

        const toolNameForLogging = request.params.name; // For clearer debug logs

        // Validate and construct the prompt based on the tool
        if (request.params.name === 'code') {
          const args = request.params.arguments as unknown as ClaudeCodeArgs;
          if (!args.prompt) throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: prompt');
          const workDir = process.cwd(); // Get current working directory
          claudePrompt = `Your work folder is ${workDir}\n\n${args.prompt}`; // Prepend workDir to the prompt
          
          finalCommandArgs = [...baseCommandArgs];
          if (args.options?.tools) {
            finalCommandArgs.push('--tools', args.options.tools.join(','));
          }
          finalCommandArgs.push('-p', claudePrompt); // Add prompt with -p flag

        } else if (request.params.name === 'magic_file') {
          const args = request.params.arguments as unknown as ClaudeFileEditArgs;
          if (!args.file_path) throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: file_path');
          if (!args.instruction) throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: instruction');
          
          // Construct a single natural language prompt for file editing.
          // args.file_path is expected to be an absolute path (resolved by client or pre-resolved if needed).
          // The current description for 'magic_file' inputSchema states 'file_path' is 'The absolute path to the file to edit'.
          // If relative paths are possible from the client, path.resolve would be needed here.
          // For now, trusting the schema description.
          const absoluteFilePath = pathResolve(args.file_path); // Ensure absolute path
          claudePrompt = `Edit file "${absoluteFilePath}": ${args.instruction}`;
          
          finalCommandArgs = [...baseCommandArgs, '-p', claudePrompt]; // Add prompt with -p flag
          // No options.tools for magic_file according to its schema.

        } else {
          // Unknown tool
          throw new McpError(ErrorCode.MethodNotFound, `Tool ${request.params.name} not found`);
        }

        // Unified execution logic
        try {
          // Use finalCommandArgs which now includes '-p' and the prompt
          const { stdout } = await spawnAsync(this.claudeCliPath, finalCommandArgs);
          // Use toolNameForLogging for more specific debug messages
          if(debugMode) console.debug(`Claude CLI stdout (${toolNameForLogging}, plain text):`, stdout);
          return { content: [{ type: 'text', text: stdout }] };
        } catch (error) {
          let errorMessage = `Unknown error during Claude CLI execution for tool ${toolNameForLogging}`;
          if (error instanceof Error) {
              errorMessage = error.message;
          }
          console.error(`[Error] Tool execution failed (${toolNameForLogging}): ${errorMessage}`);
          if (error instanceof McpError) {
            throw error; // Re-throw existing McpError
          }
          // Wrap other errors as InternalError
          throw new McpError(ErrorCode.InternalError, `Tool execution failed (${toolNameForLogging}): ${errorMessage}`);
        }

      } catch (error) { // Catch errors from prompt construction or if an McpError was thrown above
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        // Ensure toolNameForLogging is available or use a generic message
        const toolContext = request.params.name ? `for tool ${request.params.name}` : '';
        console.error(`[Error] Tool request processing failed ${toolContext}: ${errorMessage}`);
        if (error instanceof McpError) {
          throw error; // Re-throw existing McpError
        }
        // Wrap other errors as InternalError
        throw new McpError(ErrorCode.InternalError, `Tool request processing failed ${toolContext}: ${errorMessage}`);
      }
    });
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
     // Revert to original server start logic if listen caused errors
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Claude Code MCP server running on stdio');
  }
}

// Create and run the server
const server = new ClaudeCodeServer();
server.run().catch(console.error);
