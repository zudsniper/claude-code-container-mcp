// Enterprise AWS Bedrock Example
// Shows how to use Claude Code with AWS Bedrock for compliance

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function enterpriseWorkflow() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/container-server.js']
  });
  
  const client = new Client({
    name: 'enterprise-example',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  await client.connect(transport);
  
  // Create session with AWS Bedrock configuration
  console.log('Creating enterprise session with AWS Bedrock...');
  const session = await client.callTool('create_session', {
    projectPath: '/secure/enterprise-app',
    sessionName: 'compliance-update',
    useBedrock: true,
    awsRegion: 'us-east-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bedrockModel: 'anthropic.claude-3-sonnet-20240229-v1:0'
  });
  
  // Perform compliance updates
  console.log('Updating code for SOC2 compliance...');
  const result = await client.callTool('execute_in_session', {
    sessionId: session.sessionId,
    prompt: `Update the application to meet SOC2 compliance:
    1. Add audit logging for all data access
    2. Implement encryption at rest for sensitive data
    3. Add session timeout after 15 minutes of inactivity
    4. Create compliance report generator`
  });
  
  // Transfer compliance report
  await client.callTool('transfer_files', {
    sessionId: session.sessionId,
    direction: 'from_container',
    sourcePath: '/workspace/compliance-report.md',
    destPath: './reports/soc2-compliance.md'
  });
  
  // Get execution logs for audit
  const logs = await client.callTool('get_session_logs', {
    sessionId: session.sessionId,
    tail: 1000
  });
  
  console.log('Compliance updates completed');
  console.log('Audit logs saved');
  
  // Cleanup
  await client.callTool('destroy_session', { 
    sessionId: session.sessionId 
  });
  
  await client.close();
}

enterpriseWorkflow().catch(console.error);
