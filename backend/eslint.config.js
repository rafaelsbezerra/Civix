import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.specs', 'prisma/migrations']),
  {
    files: ['src/**/*.ts', 'tests/**/*.{ts,mjs}', 'scripts/**/*.{ts,mjs}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.node,
    },
    rules: {
      ...prettierConfig.rules,
      curly: ['error', 'all'],
    },
  },
]);
