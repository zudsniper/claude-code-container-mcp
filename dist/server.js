#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import which from 'which';
// Define debugMode globally using const
const debugMode = process.env.MCP_CLAUDE_DEBUG === 'true';
/**
 * Find the Claude CLI executable path
 * Tries multiple common locations
 */
function findClaudeCli(debugMode) {
    // Check environment variable first
    if (debugMode)
        console.error('[Debug] Checking for CLAUDE_CLI_PATH environment variable...');
    if (process.env.CLAUDE_CLI_PATH && existsSync(process.env.CLAUDE_CLI_PATH)) {
        if (debugMode)
            console.error(`[Debug] Found Claude CLI via environment variable: ${process.env.CLAUDE_CLI_PATH}`);
        return process.env.CLAUDE_CLI_PATH;
    }
    // Try finding with the 'which' package
    try {
        const claudePathFromWhich = which.sync('claude');
        if (debugMode)
            console.error(`[Debug] Found Claude CLI via which package: ${claudePathFromWhich}`);
        return claudePathFromWhich;
    }
    catch (e) {
        if (debugMode)
            console.error(`[Debug] 'which' package could not find claude in PATH: ${e}`);
    }
    // Common Claude CLI locations
    if (debugMode)
        console.error('[Debug] Checking common Claude CLI locations...');
    const possiblePaths = [
        join(homedir(), '.claude', 'local', 'claude'),
        join(homedir(), '.local', 'bin', 'claude'),
        join(homedir(), 'bin', 'claude'),
        '/usr/local/bin/claude',
        '/usr/bin/claude',
        'claude', // Fallback to PATH
    ];
    for (const path of possiblePaths) {
        const exists = existsSync(path);
        if (debugMode)
            console.error(`[Debug] Checking path: ${path}, Exists: ${exists}`);
        if (exists) {
            if (debugMode)
                console.error(`[Debug] Found Claude CLI at: ${path}`);
            return path;
        }
    }
    // Default to PATH if not found
    if (debugMode)
        console.error('[Debug] Claude CLI not found in common locations. Falling back to "claude" in PATH.');
    return 'claude';
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
    claudeCliPath;
    constructor() {
        this.claudeCliPath = findClaudeCli(debugMode); // Use global debugMode
        console.error(`[Setup] Using Claude CLI at: ${this.claudeCliPath}`); // Log to stderr (may be hidden)
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
                    description: 'Claude Code is an AI that has system tools to edit files, search the web and access mcp tools can do basically anything as it is an AI. It can modify files, fix bugs, and refactor code across your entire project.',
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
                    description: 'Edit any file with a free text description. Is your edit_file tool not working again? Tell me what file and the contents and I\'ll figure it out!',
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
                        throw new McpError(ErrorCode.InvalidParams, 'prompt');
                    const command = this.claudeCliPath;
                    const commandArgs = ['--dangerously-skip-permissions', '-p', args.prompt];
                    if (args.options?.tools?.length) {
                        commandArgs.push('--allowedTools', args.options.tools.join(' '));
                    }
                    else {
                        commandArgs.push('--allowedTools', "Bash Read Write Edit MultiEdit Glob Grep LS Task Batch");
                    }
                    const { stdout, stderr } = await spawnAsync(command, commandArgs);
                    if (stderr && debugMode)
                        console.error(`[Warning] Command stderr (full): ${stderr}`);
                    const diagnosticPrefix = `[Debug Info] Used CLI: ${this.claudeCliPath}\n---\n`;
                    return { content: [{ type: 'text', text: diagnosticPrefix + stdout }] };
                }
                // Handle magic_file tool
                if (request.params.name === 'magic_file') {
                    const args = request.params.arguments;
                    if (!args.file_path)
                        throw new McpError(ErrorCode.InvalidParams, 'file_path');
                    if (!args.instruction)
                        throw new McpError(ErrorCode.InvalidParams, 'instruction');
                    const prompt = `Edit file "${args.file_path}": ${args.instruction}`;
                    const command = this.claudeCliPath;
                    const commandArgs = ['--dangerously-skip-permissions', '-p', prompt];
                    commandArgs.push('--allowedTools', "Read Write Edit MultiEdit Glob Grep LS Bash");
                    const { stdout, stderr } = await spawnAsync(command, commandArgs, { timeout: 60000 });
                    if (stderr && debugMode)
                        console.error(`[Warning] Command stderr (full): ${stderr}`);
                    const diagnosticPrefix = `[Debug Info] Used CLI: ${this.claudeCliPath}\n---\n`;
                    return { content: [{ type: 'text', text: diagnosticPrefix + stdout }] };
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
