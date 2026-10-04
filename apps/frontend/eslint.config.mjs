import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const tsFiles = ['src/**/*.{ts,tsx}', 'vite.config.ts'];
const tsRecommended = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: tsFiles,
}));

export default [
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['public/glass-kc/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        KEY: 'readonly',
        validate: 'readonly',
        render: 'readonly',
        setFields: 'readonly',
        art: 'readonly',
        notify: 'readonly',
        closePaneEditor: 'readonly',
        journal: 'writable',
        configured: 'writable',
        loadFailed: 'writable',
      },
    },
  },
  {
    files: ['public/glass-kc/bosses/*-art.js'],
    languageOptions: {
      globals: { GLASS_RENDERERS: 'readonly', createGlassWindow: 'readonly' },
    },
  },
  {
    files: ['public/glass-kc/account.js'],
    languageOptions: {
      globals: { GLASS_BOSSES: 'readonly', LEGACY_BOSS_ID: 'readonly' },
    },
  },
  {
    files: ['public/glass-kc/window-workshop.js'],
    languageOptions: {
      globals: { GLASS_WINDOW_SHAPES: 'readonly', GLASS_WINDOW_FRAMES: 'readonly' },
    },
  },
  {
    files: ['public/glass-kc/gallery.js'],
    languageOptions: {
      globals: {
        GLASS_BOSSES: 'readonly',
        GLASS_RENDERERS: 'readonly',
        GLASS_APPEARANCE: 'readonly',
        createGlassWorkshop: 'readonly',
      },
    },
  },
  ...tsRecommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'vite.config.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: tsFiles,
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'vite.config.ts'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-async-promise-executor': 'warn',
      'no-empty': 'warn',
      'no-useless-assignment': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/setupTests.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
        ...globals.node,
      },
    },
  },
  prettier,
];
