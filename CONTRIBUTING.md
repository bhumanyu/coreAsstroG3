# Contributing to CoreAstroEngine

## Testing

### Running Tests

- `npm test`: Run the full test suite using Vitest
- `npm run test:calculation-validation`: Run calculation validation tests
- `npm run test:temporal-validation`: Run temporal calculation validation tests
- `npm run test:pr8-acceptance`: Run PR-8 acceptance tests
- `npm run test:bundle`: Run bundle tests
- `npm run test:pba10`: Run PBA-10 focused test suite

### Test Configuration

The test suite is configured with:
- **Cache directory**: `node_modules/.vite` (to avoid Windows temp cleanup/antivirus interference)
- **Pool**: `forks` with `singleFork: true` (to avoid Windows fork timeout/EPERM issues)
- **Test timeout**: 120 seconds (increased from 20 seconds for integration tests)

### Windows-Specific Notes

When running tests on Windows:
1. Ensure no concurrent Vitest processes are running (no watch-mode instances) before starting a test run
2. The cache directory is configured to `node_modules/.vite` to avoid Windows temp cleanup/antivirus interference
3. Single-fork execution is enabled to avoid "Timeout terminating forks worker" or `EPERM` errors

### Continuous Integration

CI environments (Linux) use the same configuration (single-fork execution).

## Development Workflow

See [PLAYBOOK.md](./PLAYBOOK.md) for the comprehensive guide on planning and safely making changes, including layer responsibilities, non-negotiable invariants, and testing guardrails.
