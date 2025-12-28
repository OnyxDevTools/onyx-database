import { defineConfig } from 'vitest/config';

const [nodeMajorVersion] = process.versions.node.split('.').map(Number);

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      enabled: true,
      provider: nodeMajorVersion >= 20 ? 'v8' : 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**'],
      exclude: ['src/config/chain.ts', 'src/core/stream.ts', 'src/impl/**', 'src/types/**'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
