#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
const execAsync = promisify(exec);
/**
 * Find the Claude CLI executable path
 * Tries multiple common locations
 */
function findClaudeCli() {
    // Check environment variable first
    if (process.env.CLAUDE_CLI_PATH && existsSync(process.env.CLAUDE_CLI_PATH)) {
        return process.env.CLAUDE_CLI_PATH;
    }
    // Common Claude CLI locations
    const possiblePaths = [
        join(homedir(), '.claude', 'local', 'claude'),
        join(homedir(), '.local', 'bin', 'claude'),
        join(homedir(), 'bin', 'claude'),
        '/usr/local/bin/claude',
        '/usr/bin/claude',
        'claude', // Fallback to PATH
    ];
    for (const path of possiblePaths) {
        if (existsSync(path)) {
            return path;
        }
    }
    // Default to PATH if not found
    return 'claude';
}
/**
 * MCP Server for Claude Code
 * Provides a simple MCP tool to run Claude CLI in one-shot mode
 */
class ClaudeCodeServer {
    server;
    claudeCliPath;
    constructor() {
        console.error('[Setup] Initializing Claude Code MCP server...');
        // Find Claude CLI path
        this.claudeCliPath = findClaudeCli();
        console.error(`[Setup] Using Claude CLI at: ${this.claudeCliPath}`);
        this.server = new Server({
            name: 'mcp__claudecode',
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
                    name: 'claudecode',
                    description: 'Call when you want to edit a file in free text or answer any question or modify code. Claude can do basically anything as it is an AI.',
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
                }
            ],
        }));
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                if (request.params.name !== 'claudecode') {
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
                const args = request.params.arguments;
                if (!args.prompt) {
                    throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: prompt');
                }
                // Build the command to run Claude Code
                // Use --yes to bypass all permission prompts
                let command = `${this.claudeCliPath} --dangerously-skip-permissions -p "${args.prompt}"`;
                // Add tools option if specified - by default, enable all tools
                if (args.options?.tools && args.options.tools.length > 0) {
                    const toolsList = args.options.tools.join(',');
                    command += ` --allow=${toolsList}`;
                }
                else {
                    // If no specific tools are requested, enable all common tools
                    command += ` --allow=Bash,Read,Write,Edit,MultiEdit,Glob,Grep,LS,Task,Batch`;
                }
                console.error(`[Execute] Running command: ${command}`);
                const { stdout, stderr } = await execAsync(command);
                if (stderr) {
                    console.error(`[Warning] Command stderr: ${stderr}`);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout,
                        },
                    ],
                };
            }
            catch (error) {
                console.error('[Error] Failed to execute Claude Code:', error);
                if (error instanceof Error) {
                    throw new McpError(ErrorCode.InternalError, `Failed to execute Claude Code: ${error.message}`);
                }
                throw error;
            }
        });
    }
    /**
     * Start the MCP server
     */
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Claude Code MCP server running on stdio');
    }
}
// Create and run the server
const server = new ClaudeCodeServer();
server.run().catch(console.error);
