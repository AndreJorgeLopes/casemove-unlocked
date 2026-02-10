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
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
]);
