import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'standalone.html'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // A component file that exports both a component and non-component
      // values breaks Fast Refresh; the error boundary and page modules are the
      // only places this is tolerated by design.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Mirrors `noUnusedLocals` in tsconfig. `_`-prefixed args are the escape
      // hatch for intentionally-unused callback parameters.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],

      // ECC coding style: no debug logging in shipped code. `warn`/`error` are
      // the sanctioned channels, and the ErrorBoundary deliberately surfaces
      // faults through UI rather than the console.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // `any` erases the validation work the boundary layer does.
      '@typescript-eslint/no-explicit-any': 'error',

      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    // Tests may reach for `any` in mocks and log freely.
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  }
);
