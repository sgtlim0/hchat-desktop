# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities through private channels. Do not create public issues for security problems.

## Security Measures

### 1. Backend Rate Limiting

All API endpoints are protected with rate limiting:

| Endpoint | Rate Limit | Window |
|----------|------------|---------|
| `/api/chat` | 30 req/min | 60s |
| `/api/search` | 20 req/min | 60s |
| `/api/extract-memory` | 10 req/min | 60s |
| `/api/swarm/execute` | 5 req/min | 60s |
| All others | 60 req/min | 60s |

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `Retry-After`: Seconds until rate limit reset (on 429 responses)

**Rate Limit Response (429):**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 2. Dependency Security

#### Automated Audits

- **Weekly Scans:** Every Monday at 00:00 UTC
- **On-Change Scans:** Triggered on package.json/package-lock.json changes
- **Manual Scans:** `npm run audit` or `npm run audit:check`

#### GitHub Actions Workflow

The `.github/workflows/security.yml` workflow:
1. Runs npm audit for production dependencies
2. Fails on high/critical vulnerabilities
3. Generates detailed audit reports
4. Reviews dependencies on pull requests

#### Local Security Checks

```bash
# Quick audit (production only)
npm run audit

# Detailed security check with report
npm run audit:check

# Fix vulnerabilities automatically
npm audit fix

# Force fixes (use with caution)
npm audit fix --force
```

### 3. Security Best Practices

#### API Security
- ✅ CORS configured for allowed origins only
- ✅ Rate limiting on all endpoints
- ✅ Input validation on all user inputs
- ✅ No sensitive data in responses
- ✅ Secure headers (via middleware)

#### Frontend Security
- ✅ DOMPurify for HTML sanitization
- ✅ No eval() or dangerous DOM operations
- ✅ Content Security Policy (CSP) headers
- ✅ Secure credential storage (never in code)
- ✅ HTTPS-only in production

#### Dependency Management
- ✅ Regular dependency updates
- ✅ Automated vulnerability scanning
- ✅ Production vs development dependency separation
- ✅ Lock file committed for reproducible builds

### 4. Pre-commit Hooks

If Husky is installed, security checks run automatically before commits:
- Package changes trigger `npm audit`
- High/critical vulnerabilities block commits
- Manual override possible with `--no-verify` (not recommended)

### 5. Monitoring

#### Rate Limit Monitoring
- Monitor 429 response rates
- Adjust limits based on legitimate usage patterns
- Consider IP allowlisting for trusted services

#### Vulnerability Tracking
- Review GitHub Security tab regularly
- Subscribe to security advisories
- Keep audit reports for compliance

### 6. Incident Response

If a security issue is discovered:

1. **Assess Severity**
   - Critical: Immediate production impact
   - High: Potential for exploitation
   - Medium/Low: Schedule for next release

2. **Immediate Actions**
   - Apply temporary mitigations
   - Notify affected users if needed
   - Document the issue privately

3. **Resolution**
   - Develop and test fix
   - Deploy with minimal disclosure
   - Update dependencies if needed

4. **Post-Incident**
   - Document lessons learned
   - Update security measures
   - Consider responsible disclosure timeline

## Security Checklist

Before each release:

- [ ] Run `npm audit` - no high/critical vulnerabilities
- [ ] Review dependency updates
- [ ] Test rate limiting functionality
- [ ] Verify CORS configuration
- [ ] Check for hardcoded secrets
- [ ] Review recent security advisories
- [ ] Update security documentation if needed

## Contact

For security concerns, contact the maintainers privately through appropriate channels.