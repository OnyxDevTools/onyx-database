import { defineConfig } from 'vitest/config';

const [nodeMajorVersion] = process.versions.node.split('.').map(Number);

const coverageProvider = nodeMajorVersion >= 20 ? 'v8' : 'istanbul';

const coverageThresholds =
  coverageProvider === 'v8'
    ? { statements: 100, branches: 100, functions: 100, lines: 100 }
    : { statements: 99.5, branches: 99.5, functions: 99.5, lines: 99.5 };

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      enabled: true,
      provider: coverageProvider,
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**'],
      exclude: [
        'src/config/chain.ts',
        'src/config/chain-edge.ts',
        'src/config/types.ts',
        'src/core/stream.ts',
        'src/helpers/schema-diff.ts',
        'src/impl/**',
        'src/types/**',
      ],
      thresholds: coverageThresholds,
    },
  },
});
