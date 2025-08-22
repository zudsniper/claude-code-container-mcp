# Claude Code Container MCP Server

> Transform Claude Code from a CLI tool into an orchestratable service through the Model Context Protocol

An MCP (Model Context Protocol) server that manages containerized Claude Code sessions, enabling AI assistants to create and control isolated Claude Code instances programmatically. Unlike simple containerization solutions, this provides a clean API for AI-to-AI workflows and enterprise integrations.

## ⚠️ Legal Notice

This is an unofficial containerization of Claude Code. Users are responsible for compliance with [Anthropic's Terms of Service](https://www.anthropic.com/legal/commercial-terms). By using this software, you acknowledge that you have read and agreed to Anthropic's terms.

## Features

- 🐳 **Docker-based Isolation**: Each Claude Code instance runs in its own container
- 🔄 **Session Management**: Create, execute, and destroy Claude Code sessions
- 📁 **Volume Mounting**: Persistent storage for project files
- 🔒 **Security**: Container isolation protects the host system
- 🚀 **Scalability**: Run multiple sessions simultaneously
- 🛠️ **Extended Tools**: File transfer, command execution, and log access
- ☁️ **AWS Bedrock Support**: Use Claude through AWS Bedrock for enterprise deployments
- 🔑 **Flexible Authentication**: Support for both Anthropic API keys and AWS credentials

## Real-World Use Cases

### 1. Parallel Development Workflows
```javascript
// Create sessions for different microservices
const frontend = await createSession({ projectPath: '/app/frontend' });
const backend = await createSession({ projectPath: '/app/backend' });

// Work on both simultaneously
await executeInSession({ 
  sessionId: frontend.id, 
  prompt: 'Update React components to use new design system' 
});
await executeInSession({ 
  sessionId: backend.id, 
  prompt: 'Implement new REST endpoints for user management' 
});
```

### 2. Automated Code Reviews
```javascript
// Pull request review workflow
const session = await createSession({ projectPath: '/tmp/pr-1234' });
const review = await executeInSession({
  sessionId: session.id,
  prompt: 'Review this code for security vulnerabilities and performance issues'
});
// Post review comments back to GitHub
```

### 3. Enterprise Batch Operations
```javascript
// Update multiple projects with new security policy
for (const project of projects) {
  const session = await createSession({ 
    projectPath: project.path,
    useBedrock: true,
    awsRegion: 'us-east-1'
  });
  await executeInSession({
    sessionId: session.id,
    prompt: 'Update dependencies and apply new security headers'
  });
}
```

### 4. CI/CD Integration
```yaml
# GitHub Actions example
- name: AI Code Review
  run: |
    npx claude-code-mcp create-session ./
    npx claude-code-mcp execute "Review code changes and suggest improvements"
```

## What's Different?

This is a fork of [steipete/claude-code-mcp](https://github.com/steipete/claude-code-mcp) that adds containerization capabilities. Instead of running Claude Code directly, this server manages Docker containers running Claude Code, providing:

- Better isolation between different projects
- Ability to run multiple Claude Code instances
- Protection of the host system
- Easy cleanup of resources
- Support for AWS Bedrock as an alternative to Anthropic API

## Why Choose This Over Other Solutions?

| Feature | claude-code-mcp<br>(This Project) | claudebox | claude-docker | Base claude-code |
|---------|-----------------------------------|-----------|---------------|------------------|
| **Containerization** | ✅ Full isolation | ✅ Full isolation | ✅ Full isolation | ✅ Basic |
| **MCP Interface** | ✅ **Full API** | ❌ CLI only | ❌ CLI only | ❌ None |
| **Multi-Session** | ✅ **Unlimited** | 🟡 Limited | ❌ Single | ❌ None |
| **AWS Bedrock** | ✅ **Native** | ❌ No | ❌ No | ❌ No |
| **Session API** | ✅ **Complete** | ❌ None | ❌ None | ❌ None |
| **AI Orchestration** | ✅ **Built-in** | ❌ Manual | ❌ Manual | ❌ None |

### Key Differentiator: MCP Orchestration

While other projects focus on running Claude Code in Docker, we provide **programmatic control** through MCP:

```javascript
// Other solutions: Manual Docker commands
docker run -it claude-code

// Our solution: Programmable API
await mcp.tool('create_session', { projectPath: '/app' });
await mcp.tool('execute_in_session', { prompt: 'refactor this code' });
```

This enables:
- **AI-to-AI workflows**: Claude can manage multiple Claude Code sessions
- **CI/CD integration**: Automated code reviews and testing
- **Enterprise automation**: Bulk operations across projects

## Installation

### Prerequisites

- Node.js v20 or later
- Docker installed and running
- Either:
  - Anthropic API key, OR
  - AWS credentials with Bedrock access

### Quick Install

#### Using npm (Recommended)

```bash
npm install -g @democratize-technology/claude-code-container-mcp
```

#### Using Docker

```bash
docker pull democratizetechnology/claude-code-container-mcp:latest
docker run -d \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e ANTHROPIC_API_KEY="your-api-key" \
  democratizetechnology/claude-code-container-mcp:latest
```

#### From Source

```bash
git clone https://github.com/democratize-technology/claude-code-container-mcp.git
cd claude-code-container-mcp
npm install
npm run build
npm start
```

### Building the Custom Claude Code Image

For reduced external dependencies, build the custom Docker image:

```bash
# Clone the repository (if not already done)
git clone https://github.com/democratize-technology/claude-code-container-mcp.git
cd claude-code-container-mcp

# Build the custom image
./scripts/build-custom-image.sh

# This creates: claude-code-custom:latest
```

## 🔒 Security Considerations

### Docker Daemon Access Required
This MCP server requires access to the Docker daemon, which has significant security implications:

- **Root-equivalent permissions**: Docker access can be used to gain root privileges
- **Container isolation**: While Claude Code runs isolated, the MCP server has Docker control
- **Network security**: Containers can access network resources based on Docker configuration

### Recommended Security Practices

1. **Run the MCP server in a container** (double isolation):
   ```bash
   docker run -v /var/run/docker.sock:/var/run/docker.sock democratizetechnology/claude-code-container-mcp
   ```

2. **Use Docker security options**:
   ```bash
   --security-opt=no-new-privileges
   --cap-drop=ALL
   ```

3. **Restrict network access** in production environments

4. **Monitor container activity** and implement audit logging

For maximum security, consider running this in a dedicated VM or container host.

## Configuration

### Quick Configuration for Claude Desktop

Add to your Claude Desktop configuration file:

#### macOS
`~/Library/Application Support/Claude/claude_desktop_config.json`

#### Windows
`%APPDATA%\Claude\claude_desktop_config.json`

#### Linux
`~/.config/Claude/claude_desktop_config.json`

### Configuration Examples

#### Standard Configuration (with Anthropic API)

```json
{
  "mcpServers": {
    "claude-code-container": {
      "command": "npx",
      "args": ["-y", "@democratize-technology/claude-code-container-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### AWS Bedrock Configuration

```json
{
  "mcpServers": {
    "claude-code-container": {
      "command": "npx",
      "args": ["-y", "@democratize-technology/claude-code-container-mcp"],
      "env": {
        "CLAUDE_CODE_USE_BEDROCK": "1",
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key",
        "ANTHROPIC_MODEL": "us.anthropic.claude-opus-4-20250514-v1:0",
        "ANTHROPIC_SMALL_FAST_MODEL": "us.anthropic.claude-3-5-haiku-20241022-v1:0"
      }
    }
  }
}
```

#### Local Development Configuration

If you're developing or have installed from source:

```json
{
  "mcpServers": {
    "claude-code-container": {
      "command": "node",
      "args": ["/path/to/claude-code-container-mcp/dist/container-server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key",
        "MCP_CLAUDE_DEBUG": "true"
      }
    }
  }
}
```

### For Other MCP Clients

See your client's documentation for MCP server configuration.

## Available Tools

### 1. `create_session`
Creates a new Claude Code container session.

**Arguments:**
- `projectPath` (string, required): Path to mount in the container
- `sessionName` (string, optional): Human-friendly session name
- `apiKey` (string, optional): Anthropic API key for this session
- `useBedrock` (boolean, optional): Use AWS Bedrock instead of Anthropic API
- `awsRegion` (string, optional): AWS region for Bedrock
- `awsAccessKeyId` (string, optional): AWS access key ID
- `awsSecretAccessKey` (string, optional): AWS secret access key
- `awsSessionToken` (string, optional): AWS session token (for temporary credentials)
- `bedrockModel` (string, optional): Bedrock model ID
- `bedrockSmallModel` (string, optional): Bedrock small/fast model ID
- `mcpMounts` (array, optional): MCP server directories to mount in the container
  - Each mount object contains:
    - `hostPath` (string, required): Path on Docker host to mount
    - `containerPath` (string, required): Path in container where to mount
    - `readOnly` (boolean, optional): Mount as read-only (default: true)
- `mcpConfig` (object, optional): MCP configuration passed to container as MCP_CONFIG environment variable
  - **⚠️ Note**: The Claude Code container does NOT automatically process this configuration
  - The MCP_CONFIG is set as a base64-encoded environment variable but requires manual processing
  - Contains:
    - `mcpServers` (object, required): MCP servers configuration

### 2. `execute_in_session`
Executes a Claude Code command in an existing session.

**Arguments:**
- `sessionId` (string, required): Session ID
- `prompt` (string, required): Prompt for Claude Code
- `tools` (array of strings, optional): Specific tools to enable

### 3. `list_sessions`
Lists all active sessions with their status.

### 4. `destroy_session`
Destroys a Claude Code session and removes the container.

**Arguments:**
- `sessionId` (string, required): Session ID to destroy

### 5. `transfer_files`
Transfers files between host and container.

**Arguments:**
- `sessionId` (string, required): Session ID
- `direction` (string, required): 'to_container' or 'from_container'
- `sourcePath` (string, required): Source path
- `destPath` (string, required): Destination path

### 6. `execute_command`
Executes an arbitrary command in the container.

**Arguments:**
- `sessionId` (string, required): Session ID
- `command` (string, required): Command to execute

### 7. `get_session_logs`
Retrieves container logs for debugging.

**Arguments:**
- `sessionId` (string, required): Session ID
- `tail` (number, optional): Number of lines to tail (default: 100)

## Usage Examples

### Creating a Session with Anthropic API
```
Create a new Claude Code session for the project at /home/user/my-project
```

### Creating a Session with AWS Bedrock
```
Create a new Claude Code session for /home/user/my-project using Bedrock with AWS region us-west-2
```

### Working with Code
```
In session abc123, refactor the main.py file to use async/await
```

### Managing Sessions
```
List all active sessions
Destroy session abc123
```

## MCP Configuration

### Using mcpMounts

The `mcpMounts` parameter allows you to mount MCP server directories into the container:

```json
{
  "tool": "create_session",
  "arguments": {
    "projectPath": "/home/user/my-project",
    "sessionName": "with-mcp-mounts",
    "mcpMounts": [
      {
        "hostPath": "/opt/mcp-servers",
        "containerPath": "/opt/mcp-servers",
        "readOnly": true
      }
    ]
  }
}
```

### Using mcpConfig

⚠️ **Important**: The `mcpConfig` parameter requires a custom Docker image. The default Claude Code container does not process the `MCP_CONFIG` environment variable.

#### Building the Custom Image

1. Build the custom image with MCP support:
   ```bash
   ./scripts/build-custom-image.sh
   ```

   The custom image includes:
   - MCP configuration processor (processes `MCP_CONFIG` environment variable)
   - `jq` for JSON processing
   - `uv` for Python-based MCP servers
   - `npx` (from base image) for JavaScript/TypeScript MCP servers

2. Configure your MCP server to use the custom image:
   ```json
   {
     "claude-code-container": {
       "env": {
         "DEFAULT_CLAUDE_IMAGE": "claude-code-mcp:latest"
       }
     }
   }
   ```

#### Using mcpConfig

Once the custom image is built and configured, you can pass MCP server configuration:

```json
{
  "tool": "create_session",
  "arguments": {
    "projectPath": "/home/user/my-project",
    "sessionName": "with-mcp-config",
    "mcpConfig": {
      "mcpServers": {
        "sequential-thinking": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
        }
      }
    }
  }
}
```

**⚠️ Important Limitation**: The Claude Code container does NOT automatically process the `MCP_CONFIG` environment variable. To use this configuration, you must manually merge it into `.claude.json` after creating the session:

```bash
# Inside the container, run:
echo $MCP_CONFIG | base64 -d | python3 -c "
import json, sys
config = json.load(open('/root/.claude.json'))
mcp = json.load(sys.stdin)
config['projects']['/app']['mcpServers'] = mcp['mcpServers']
json.dump(config, open('/root/.claude.json', 'w'), indent=2)
"
```

## AWS Bedrock Configuration

### Setting up AWS Credentials

The MCP server supports multiple ways to provide AWS credentials:

1. **Environment Variables** (Global default):
   ```bash
   export CLAUDE_CODE_USE_BEDROCK=1
   export AWS_REGION=us-east-1
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   ```

2. **Per-Session Credentials**:
   When creating a session, you can provide specific AWS credentials that will only be used for that session.

3. **IAM Roles** (if running on AWS):
   If the MCP server is running on an EC2 instance or ECS, it can use IAM roles.

### Required IAM Permissions

Your AWS credentials need the following Bedrock permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
      ]
    }
  ]
}
```

### Model Access

Ensure you have requested and been granted access to Claude models in AWS Bedrock:
1. Go to AWS Console > Bedrock > Model access
2. Request access to Anthropic Claude models
3. Wait for approval (usually automatic for Claude models)

## Development

### Local Setup

```bash
# Clone the repository
git clone https://github.com/democratize-technology/claude-code-mcp.git
cd claude-code-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start
```

### Using Docker Compose

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your API key or AWS credentials

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f mcp-server
```

## Environment Variables

### General
- `DEFAULT_CLAUDE_IMAGE`: Docker image to use (default: claude-code-custom:latest)
- `MCP_CLAUDE_DEBUG`: Enable debug logging (true/false)
- `DOCKER_HOST`: Docker daemon socket (default: unix:///var/run/docker.sock)

### Custom Docker Image

The default base image has hardcoded `/app` paths. We provide a custom image that properly uses `/workspace`:

```bash
# Build the custom image
./build-custom-image.sh

# This creates: claude-code-custom:latest
```

If you prefer the original image, set:
```bash
export DEFAULT_CLAUDE_IMAGE=ghcr.io/zeeno-atl/claude-code:latest
```

### Anthropic API
- `ANTHROPIC_API_KEY`: Your Anthropic API key

### AWS Bedrock
- `CLAUDE_CODE_USE_BEDROCK`: Set to "1" to use Bedrock by default
- `AWS_REGION`: AWS region where Bedrock is available
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_SESSION_TOKEN`: AWS session token (for temporary credentials)
- `ANTHROPIC_MODEL`: Bedrock model ID for primary model
- `ANTHROPIC_SMALL_FAST_MODEL`: Bedrock model ID for small/fast model

## Security Considerations

- This server requires access to the Docker daemon, which has security implications
- Each Claude Code instance runs in an isolated container
- Containers have limited access to the host system
- Always review the code Claude Code generates before executing
- Consider running the MCP server itself in a container for additional isolation
- When using AWS Bedrock, follow AWS security best practices for credential management

## Troubleshooting

### Container Creation Fails
- Ensure Docker is running: `docker ps`
- Check if the image is accessible: `docker pull ghcr.io/Zeeno-atl/claude-code:latest`
- Verify your user has Docker permissions

### Session Not Responding
- Check container logs: Use the `get_session_logs` tool
- Verify the container is running: Use `list_sessions`
- For Anthropic API: Ensure the API key is valid
- For AWS Bedrock: Check AWS credentials and model access

### AWS Bedrock Issues
- Verify AWS credentials: `aws sts get-caller-identity`
- Check Bedrock model access in AWS Console
- Ensure the AWS region supports Bedrock
- Check IAM permissions for Bedrock InvokeModel

### Permission Issues
- The container runs with your user ID to prevent permission problems
- Ensure the project path is accessible
- Check Docker socket permissions

## Development

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/democratize-technology/claude-code-container-mcp.git
cd claude-code-container-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start in development mode
npm run dev
```

### Release Process

This project uses automated CI/CD for releases. To create a new release:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Push to the `release` branch
4. GitHub Actions will automatically:
   - Publish to npm
   - Build and push Docker images
   - Create a GitHub release

For detailed deployment setup, see [docs/SETUP_DEPLOYMENT_WORKFLOWS.md](docs/SETUP_DEPLOYMENT_WORKFLOWS.md).

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

### Key areas for contribution:
- Additional cloud provider support (Google Vertex AI, Azure)
- Enhanced security features
- Performance optimizations
- Additional MCP tools
- Documentation improvements

## Roadmap

### v3.0 (Current Release)
- ✅ Complete containerization architecture
- ✅ Multi-session management
- ✅ AWS Bedrock support
- ✅ Custom Docker image support
- ✅ File transfer capabilities
- ✅ Session logging

### Future Releases
- [ ] Comprehensive test coverage
- [ ] Google Vertex AI support
- [ ] Advanced session orchestration
- [ ] Resource usage monitoring
- [ ] Session templates
- [ ] Kubernetes operator
- [ ] Web UI for session management
- [ ] Plugin system for custom tools

## License

MIT

## Acknowledgments

- Original [claude-code-mcp](https://github.com/steipete/claude-code-mcp) by Peter Steinberger - for the initial MCP implementation idea
- [Zeeno-atl/claude-code](https://github.com/Zeeno-atl/claude-code) - for demonstrating Claude Code containerization
- [Anthropic](https://www.anthropic.com) - for Claude and the Model Context Protocol
- [AWS](https://aws.amazon.com) - for Bedrock service
- Our contributors and the open source community

## Support

- 🐛 [Issue Tracker](https://github.com/democratize-technology/claude-code-container-mcp/issues)
- 📖 [README](https://github.com/democratize-technology/claude-code-container-mcp#readme)

---

Built with ❤️ by [Democratize Technology](https://github.com/democratize-technology)
