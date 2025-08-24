// filename: eslint.config.js
// Flat ESLint config for ESLint v9+ with strict TypeScript rules.
// Goal: zero lint errors across the repo (no blanket ignores), while allowing
//       `any` only where it is intentionally code-generated (gen/emit.ts)
//       and in example-generated types (examples/onyx/types.ts).

import js from '@eslint/js';
import * as tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Global ignores (not error suppression of real code paths)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/.DS_Store',
      // Generated example types file (created by onyx-gen within examples)
      'examples/onyx/types.ts',
      'examples/generated/**',
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // Lint this config file as ESM and allow Node globals
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node-ish globals in config runtime
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      // Keep the config clean, but avoid noisy rules here
      'no-undef': 'off',
    },
  },

  // TypeScript rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: __dirname, // robust & platform-safe
      },
      globals: {
        // Modern platform globals used by the SDK at runtime
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        // Node
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Prefer TS-aware rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Strictness
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error', // overridden for codegen file below
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': 'allow-with-description' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // General cleanliness
      'eqeqeq': ['error', 'smart'],
      'no-duplicate-imports': 'error',
      'no-implicit-coercion': ['error', { allow: ['!!'] }],
      'no-console': 'error', // keep SDK surface clean; log only in examples/tests
    },
  },

  // Allow `any` in the code generator emitter by design (it prints user schema)
  {
    files: ['gen/emit.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off', // emitters may log diagnostics if needed
    },
  },

  // Examples: allow console output (these are teaching/demo code)
  {
    files: ['examples/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
