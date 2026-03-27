# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅        |
| Older   | ❌        |

We only provide security fixes for the latest release.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability, please report it privately:

1. Go to the [Security Advisories](https://github.com/will-17173/opencode-go/security/advisories/new) page
2. Click "Report a vulnerability"
3. Fill in the details

Alternatively, email the maintainer directly (see GitHub profile).

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgement**: within 48 hours
- **Initial assessment**: within 7 days
- **Fix timeline**: depends on severity

## Security Considerations

OpenCode Go operates as a **LAN proxy** that exposes your local OpenCode backend. Key security notes:

- The 6-digit pairing code is the only authentication mechanism for remote access
- The proxy server binds to all network interfaces (`0.0.0.0`) when LAN access is enabled
- Non-localhost requests require `X-Pairing-Code` header
- Do not expose the proxy port to untrusted networks (e.g., public Wi-Fi without a VPN)
