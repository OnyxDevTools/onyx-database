import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    dts: true,
    clean: true,
    format: ['esm', 'cjs'],
    target: 'es2022',
    sourcemap: true,
    minify: false,
    platform: 'neutral',
    outDir: 'dist',
    treeshake: true,
    splitting: false
  },
  {
    entry: { 'gen/cli/generate': 'gen/cli/generate.ts' },
    dts: false,
    clean: false, // don't wipe dist produced by the lib build
    format: ['cjs'], // bin points to .cjs; avoid dual format for the CLI
    target: 'node18',
    sourcemap: true,
    minify: false,
    platform: 'node',
    outDir: 'dist',
    treeshake: true,
    splitting: false
  }
]);
