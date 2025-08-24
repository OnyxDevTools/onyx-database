# Test Coverage Checklist

- [ ] Measure current coverage via `npm test -- --coverage`
- [ ] Identify modules with coverage below 100%
- [ ] Add unit tests for uncovered lines and branches
- [ ] Enforce 100% thresholds in `vitest.config.ts`
- [ ] Update CI to fail when coverage drops
- [ ] Review coverage report before releases
