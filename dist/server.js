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
                    name: 'claude_code',
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
                    name: 'claude_file_edit',
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
                // Handle claude_code tool
                if (request.params.name === 'claude_code') {
                    const args = request.params.arguments;
                    if (!args.prompt) {
                        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: prompt');
                    }
                    // Build the command to run Claude Code
                    // Use --dangerously-skip-permissions to bypass all permission prompts
                    let command = `${this.claudeCliPath} --dangerously-skip-permissions -p "${args.prompt}"`;
                    // Add tools option if specified - by default, enable all tools
                    if (args.options?.tools && args.options.tools.length > 0) {
                        const toolsList = args.options.tools.join(' ');
                        command += ` --allowedTools ${toolsList}`;
                    }
                    else {
                        // If no specific tools are requested, enable all common tools
                        command += ` --allowedTools "Bash Read Write Edit MultiEdit Glob Grep LS Task Batch"`;
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
                // Handle claude_file_edit tool
                else if (request.params.name === 'claude_file_edit') {
                    const args = request.params.arguments;
                    if (!args.file_path) {
                        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: file_path');
                    }
                    if (!args.instruction) {
                        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: instruction');
                    }
                    // Build the command to run Claude Code with file edit instruction
                    const prompt = `Please edit the file at path "${args.file_path}" according to these instructions: ${args.instruction}`;
                    let command = `${this.claudeCliPath} --dangerously-skip-permissions -p "${prompt}"`;
                    // Always enable Edit tools for file editing
                    command += ` --allowedTools "Read Write Edit MultiEdit Glob Grep LS Bash"`;
                    console.error(`[Execute] File Edit command: ${command}`);
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
                // Unknown tool
                else {
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                console.error('[Error] Failed to execute tool:', error);
                if (error instanceof Error) {
                    throw new McpError(ErrorCode.InternalError, `Failed to execute tool: ${error.message}`);
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
