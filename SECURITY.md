# Security Policy

## Security Philosophy

Kinetic Browser adheres to strict non-negotiable security invariants:
1. **Mandatory Sandboxing:** All web content `WebContentsView` instances execute with `sandbox: true`, `contextIsolation: true`, and `nodeIntegration: false`. Browser sandboxing is never disabled for performance.
2. **Strict Certificate Validation:** TLS/SSL certificate errors are never bypassed silently. Invalid certificates trigger an explicit, high-visibility interstitial block page.
3. **Zero Credential Telemetry:** Passwords, cookies, session tokens, and VPN WireGuard private keys are encrypted locally using Windows DPAPI (`safeStorage`) and never transmitted to external servers.
4. **Principle of Least Privilege IPC:** The UI Shell communicates with the Main Process exclusively through a typed, schema-validated `contextBridge` API. Arbitrary Node.js execution from renderers is prohibited.

## Reporting a Vulnerability

If you discover a security vulnerability in Kinetic Browser:
1. **Do not** open a public GitHub issue containing exploit details.
2. Submit a private report via GitHub Security Advisories on `https://github.com/Ubuunntuu/Kinetic-Browser/security/advisories`.
3. Include reproduction steps, affected component (`main`, `preload`, `renderer`, `extensions`, or `vpn`), and potential impact.
