// filename: tsup.config.ts
import { defineConfig } from 'tsup';

/**
 * Build the library and the CLI in two separate configs so we can
 * emit type declarations only for the library (src/index.ts) and
 * avoid DTS generation errors for files outside src/ (the /gen tree).
 */
export default defineConfig([
  // Library bundle (+ .d.ts)
  {
    entry: { index: 'src/index.ts' }, // -> dist/index.js|.cjs|.d.ts
    dts: true,
    clean: true,
    format: ['esm', 'cjs'],
    target: 'es2022',
    sourcemap: true,
    minify: false,
  },
  // CLI bundle (no .d.ts)
  {
    entry: { 'gen/cli/generate': 'gen/cli/generate.ts' }, // -> dist/gen/cli/generate.js|.cjs
    dts: false,
    clean: false, // don't wipe dist produced by the lib build
    format: ['esm', 'cjs'],
    target: 'es2022',
    sourcemap: true,
    minify: false,
  },
]);
