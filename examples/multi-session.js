// Multi-Session Development Example
// This example shows how to work on multiple components simultaneously

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function parallelDevelopment() {
  // Initialize MCP client
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/container-server.js']
  });
  
  const client = new Client({
    name: 'parallel-dev-example',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  await client.connect(transport);
  
  // Create sessions for different components
  console.log('Creating frontend session...');
  const frontendSession = await client.callTool('create_session', {
    projectPath: '/projects/app/frontend',
    sessionName: 'frontend-refactor'
  });
  
  console.log('Creating backend session...');
  const backendSession = await client.callTool('create_session', {
    projectPath: '/projects/app/backend',
    sessionName: 'backend-api'
  });
  
  // Work on both simultaneously
  console.log('Refactoring frontend components...');
  const frontendResult = await client.callTool('execute_in_session', {
    sessionId: frontendSession.sessionId,
    prompt: 'Update all React components to use TypeScript and add proper type definitions'
  });
  
  console.log('Implementing new API endpoints...');
  const backendResult = await client.callTool('execute_in_session', {
    sessionId: backendSession.sessionId,
    prompt: 'Create REST endpoints for user authentication with JWT tokens'
  });
  
  // Check results
  console.log('Frontend changes:', frontendResult);
  console.log('Backend changes:', backendResult);
  
  // Clean up
  await client.callTool('destroy_session', { sessionId: frontendSession.sessionId });
  await client.callTool('destroy_session', { sessionId: backendSession.sessionId });
  
  await client.close();
}

// Run the example
parallelDevelopment().catch(console.error);
