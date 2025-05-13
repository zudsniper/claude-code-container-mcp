#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
// Define debugMode globally using const
const debugMode = process.env.MCP_CLAUDE_DEBUG === 'true';
/**
 * Determine the Claude CLI command/path.
 * 1. Checks CLAUDE_CLI_PATH environment variable.
 * 2. Checks for Claude CLI at ~/.claude/local/claude.
 * 3. Defaults to 'claude' if not found, relying on spawn() to perform PATH lookup.
 */
function findClaudeCli(debugMode) {
    // 1. Check environment variable first
    if (debugMode)
        console.error('[Debug] Checking for CLAUDE_CLI_PATH environment variable...');
    const envPath = process.env.CLAUDE_CLI_PATH;
    if (envPath && existsSync(envPath)) {
        if (debugMode)
            console.error(`[Debug] Using Claude CLI from environment variable: ${envPath}`);
        return envPath;
    }
    if (envPath) {
        if (debugMode)
            console.error(`[Debug] CLAUDE_CLI_PATH (${envPath}) was set but file does not exist. Checking default user path.`);
    }
    // 2. Check default user path: ~/.claude/local/claude
    if (debugMode)
        console.error('[Debug] Checking for Claude CLI at default user path (~/.claude/local/claude)...');
    try {
        const userPath = join(homedir(), '.claude', 'local', 'claude');
        if (existsSync(userPath)) {
            if (debugMode)
                console.error(`[Debug] Found Claude CLI at default user path: ${userPath}`);
            return userPath;
        }
        // If not returned, it means userPath does not exist, so log it.
        if (debugMode)
            console.error(`[Debug] Claude CLI not found at default user path: ${userPath}.`);
    }
    catch (err) {
        if (debugMode)
            console.error(`[Debug] Error checking default user path: ${err instanceof Error ? err.message : String(err)}`);
    }
    // 3. Default to 'claude' command name
    if (debugMode)
        console.error('[Debug] CLAUDE_CLI_PATH not set or invalid, and not found at default user path. Defaulting to "claude" command name, relying on spawn/PATH lookup.');
    console.warn('[Warning] Claude CLI not found via CLAUDE_CLI_PATH or at ~/.claude/local/claude. Falling back to "claude" in PATH. Ensure it is installed and accessible.');
    return 'claude'; // Return base command name
}
// Ensure spawnAsync is defined correctly *before* the class
async function spawnAsync(command, args, options) {
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
            if (debugMode) {
                console.error(`[Spawn Stderr Chunk] ${data.toString()}`);
            }
        });
        process.on('error', (error) => {
            if (debugMode) {
                console.error(`[Spawn Error Event] ${error.message}`);
            }
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
            }
            else {
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
    server;
    claudeCliPath; // This now holds either a full path or just 'claude'
    constructor() {
        // Use the simplified findClaudeCli function
        this.claudeCliPath = findClaudeCli(debugMode);
        console.error(`[Setup] Using Claude CLI command/path: ${this.claudeCliPath}`);
        this.server = new Server({
            name: 'claude_code',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
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
    setupToolHandlers() {
        // Define available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'code',
                    description: "Executes a given prompt directly with the Claude Code CLI, bypassing all permission checks (`--dangerously-skip-permissions`). Ideal for a wide range of tasks including: complex code generation, analysis, and refactoring; performing web searches and summarizing content; running arbitrary terminal commands (e.g., `open .` to open Finder, `open -a Calculator` to open apps, or `open https://example.com` to open a URL in a web browser). For example, you could open a GitHub PR page once all tests are green. Handles general tasks requiring the Claude CLI's broad capabilities without interactive prompts. `options.tools` can be used to specify internal Claude tools (e.g., `Bash`, `Read`, `Write`); common tools are enabled by default if this is omitted.",
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
                    description: "Edits a specified file based on natural language instructions, leveraging the Claude Code CLI with all editing permissions bypassed (`--dangerously-skip-permissions`). Best for complex or semantic file modifications where describing the desired change in plain language is more effective than precise line-by-line edits. Requires an absolute `file_path` and a descriptive `instruction`. Also a great alternative if a general-purpose `edit_file` tool is struggling with complex edits or specific file types. Example instructions: '''Refactor the processData function to use async/await instead of promises.''', '''Delete the unused calculateTotal function.''', '''Create a new file named utils.js and move the helper functions into it.''', '''Add a comment explaining the purpose of the fetchData method.'''",
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
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                // Handle code tool
                if (request.params.name === 'code') {
                    const args = request.params.arguments;
                    if (!args.prompt)
                        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: prompt');
                    const claudeCLI = findClaudeCli(debugMode);
                    if (!claudeCLI) {
                        throw new McpError(ErrorCode.InternalError, 'Claude CLI not found.');
                    }
                    const commandArgs = [
                        '--dangerously-skip-permissions',
                        args.prompt,
                    ];
                    if (args.options?.tools) {
                        commandArgs.push('--tools', args.options.tools.join(','));
                    }
                    try {
                        const { stdout } = await spawnAsync(claudeCLI, commandArgs);
                        // Output is now plain text
                        console.debug('Claude CLI stdout (code, plain text):', stdout);
                        return { content: [{ type: 'text', text: stdout }] };
                    }
                    catch (error) {
                        let errorMessage = 'Unknown error during Claude CLI execution';
                        if (error instanceof Error) {
                            errorMessage = error.message;
                        }
                        console.error(`[Error] Tool execution failed: ${errorMessage}`);
                        if (error instanceof McpError) {
                            throw error; // Re-throw existing McpError
                        }
                        // Wrap other errors as InternalError
                        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
                    }
                }
                // Handle magic_file tool
                if (request.params.name === 'magic_file') {
                    const args = request.params.arguments;
                    if (!args.file_path)
                        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: file_path');
                    if (!args.instruction)
                        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: instruction');
                    const claudeCLI = findClaudeCli(debugMode);
                    if (!claudeCLI) {
                        throw new McpError(ErrorCode.InternalError, 'Claude CLI not found.');
                    }
                    const commandArgs = [
                        '--dangerously-skip-permissions',
                        'magic-file',
                        '--file-path',
                        args.file_path,
                        args.instruction,
                    ];
                    try {
                        const { stdout } = await spawnAsync(claudeCLI, commandArgs);
                        // Output is now plain text
                        console.debug('Claude CLI stdout (magic-file, plain text):', stdout);
                        return { content: [{ type: 'text', text: stdout }] };
                    }
                    catch (error) {
                        let errorMessage = 'Unknown error during Claude CLI magic-file execution';
                        if (error instanceof Error) {
                            errorMessage = error.message;
                        }
                        console.error(`[Error] Tool execution failed: ${errorMessage}`);
                        if (error instanceof McpError) {
                            throw error; // Re-throw existing McpError
                        }
                        // Wrap other errors as InternalError
                        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
                    }
                }
                // Unknown tool - Use MethodNotFound if ToolNotFound is incorrect
                throw new McpError(ErrorCode.MethodNotFound, `Tool ${request.params.name} not found`);
            }
            catch (error) { // Use generic 'error' type for catch
                let errorMessage = 'Unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                console.error(`[Error] Tool execution failed: ${errorMessage}`);
                if (error instanceof McpError) {
                    throw error; // Re-throw existing McpError
                }
                // Wrap other errors as InternalError
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
            }
        });
    }
    /**
     * Start the MCP server
     */
    async run() {
        // Revert to original server start logic if listen caused errors
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Claude Code MCP server running on stdio');
    }
}
// Create and run the server
const server = new ClaudeCodeServer();
server.run().catch(console.error);
