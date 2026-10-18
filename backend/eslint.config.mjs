import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default defineConfig(
  { ignores: ['dist', 'node_modules', 'coverage', 'src/generated'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
);
