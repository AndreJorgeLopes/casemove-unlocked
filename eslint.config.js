const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = defineConfig([
  {
    ignores: [
      '**/logs/**',
      '**/*.log',
      '**/pids/**',
      '**/*.pid',
      '**/*.seed',
      '**/coverage/**',
      '**/.eslintcache',
      '**/node_modules/**',
      '**/.DS_Store',
      'release/app/dist/**',
      'release/build/**',
      '.erb/dll/**',
      '**/.idea/**',
      '**/npm-debug.log.*',
      '**/*.css.d.ts',
      '**/*.sass.d.ts',
      '**/*.scss.d.ts',
      '**/.*'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.electron,
  importPlugin.flatConfigs.typescript,
  {
    rules: {
      // Keep migration practical for legacy TS/JS code while we improve typing gradually.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      'prefer-const': 'off',
      'no-case-declarations': 'off',
      'no-irregular-whitespace': 'off',
      'no-async-promise-executor': 'off',
      'import/namespace': 'off',
      'import/no-named-as-default': 'off',
      'import/export': 'off'
    }
  },
  {
    files: ['**/*.js'],
    rules: {
      'no-redeclare': 'off',
      'no-case-declarations': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-undef': 'off',
      'no-prototype-builtins': 'off',
      'no-async-promise-executor': 'off',
      'no-unused-expressions': 'off'
    }
  }
]);
