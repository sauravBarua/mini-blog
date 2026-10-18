import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL, assertTestDatabase } from './tests/test-env.js';

assertTestDatabase(TEST_DATABASE_URL);

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    // All files share one database, so they run one after another.
    fileParallelism: false,
    testTimeout: 15_000,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
    },
  },
});
