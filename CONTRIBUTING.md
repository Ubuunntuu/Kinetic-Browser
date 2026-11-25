# Contributing to Kinetic Browser

We follow strict engineering standards to ensure Kinetic Browser remains fast, secure, and maintainable.

## Engineering Rules

1. **No Fake UI Controls:** Every toggle, slider, button, and input in the UI must be wired to a real, persistent backend implementation with validation and a reset option.
2. **No Placeholder Code:** All submitted PRs must compile cleanly with zero TypeScript errors and pass all verification tests.
3. **Honest Metrics:** Performance benchmarks and privacy counters must reflect actual measured system and network activity—never fabricated estimates.
4. **Commit Convention:** Use Conventional Commits:
   - `feat:` New browser capability or subsystem
   - `fix:` Bug fix or stability patch
   - `perf:` Measurable performance or memory optimization
   - `security:` Hardening, dependency patch, or permission control
   - `docs:` Architecture, benchmark, or user documentation
