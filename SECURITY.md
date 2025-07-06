# Security Guide

## Overview

The Claude Code Container MCP Server requires elevated privileges to manage Docker containers. This guide covers security best practices and risk mitigation strategies.

## Threat Model

### 1. Docker Daemon Access
**Risk**: High - Docker daemon access is equivalent to root access on the host system.

**Mitigations**:
- Run the MCP server in a container with limited capabilities
- Use Docker's rootless mode where possible
- Implement audit logging for all Docker operations
- Restrict network access from containers

### 2. Container Escape
**Risk**: Medium - Malicious code could attempt to escape the container.

**Mitigations**:
- Use security profiles (AppArmor/SELinux)
- Drop unnecessary capabilities
- Use read-only root filesystem where possible
- Regular security updates

### 3. Resource Exhaustion
**Risk**: Medium - Runaway containers could consume system resources.

**Mitigations**:
- Set resource limits (CPU, memory, disk)
- Implement session timeouts
- Monitor resource usage
- Automatic cleanup of orphaned containers

## Secure Configuration

### 1. Docker Security Options

```json
{
  "tool": "create_session",
  "arguments": {
    "projectPath": "/app",
    "dockerOpts": {
      "SecurityOpt": ["no-new-privileges"],
      "CapDrop": ["ALL"],
      "ReadonlyRootfs": true,
      "Memory": "2g",
      "CpuQuota": 50000
    }
  }
}
```

### 2. Network Isolation

```yaml
# docker-compose.yml for isolated network
version: '3.8'
services:
  mcp-server:
    image: claude-code-mcp
    networks:
      - isolated
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

networks:
  isolated:
    driver: bridge
    internal: true
```

### 3. Audit Logging

Enable comprehensive logging:

```bash
# Set environment variable
export MCP_AUDIT_LOG=/var/log/claude-code-mcp/audit.log

# Log format includes:
# - Timestamp
# - Session ID
# - Action performed
# - User/API key hash
# - Result
```

## Best Practices

### For Development

1. Use dedicated development machines
2. Regularly clean up unused containers
3. Limit concurrent sessions
4. Use version control for all code

### For Production

1. **Isolation Layers**:
   - Run on dedicated VM/container host
   - Use Kubernetes with proper RBAC
   - Implement network policies

2. **Authentication**:
   - Rotate API keys regularly
   - Use AWS IAM for Bedrock
   - Implement rate limiting

3. **Monitoring**:
   - Set up alerts for suspicious activity
   - Monitor container creation/deletion
   - Track resource usage trends

## Security Checklist

Before deploying to production:

- [ ] Docker daemon is not exposed to network
- [ ] Resource limits are configured
- [ ] Audit logging is enabled
- [ ] Network isolation is implemented
- [ ] Security scanning is set up
- [ ] Incident response plan exists
- [ ] Regular security updates scheduled
- [ ] Access controls are in place

## Vulnerability Reporting

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. Email: security@democratize.technology
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours and provide regular updates on the fix.

## Container Security Scanning

Regularly scan the custom image:

```bash
# Using Trivy
trivy image claude-code-custom:latest

# Using Docker Scout
docker scout quickview claude-code-custom:latest

# Using Snyk
snyk container test claude-code-custom:latest
```

## Compliance Considerations

### SOC2
- Enable audit logging
- Implement access controls
- Regular security reviews
- Incident response procedures

### HIPAA
- Ensure BAA with Anthropic if using PHI
- Implement encryption at rest
- Access logging and monitoring
- Regular risk assessments

### GDPR
- Data minimization
- Right to deletion implementation
- Data processing agreements
- Privacy by design

## Updates and Patches

Stay informed about security updates:

1. Watch the GitHub repository
2. Subscribe to security advisories
3. Regular dependency updates
4. Test updates in staging first

Remember: Security is a shared responsibility. While we provide tools and guidelines, you must implement appropriate controls for your use case.
