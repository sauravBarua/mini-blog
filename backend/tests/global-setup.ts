import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL, assertTestDatabase } from './test-env.js';

export default function setup(): void {
  assertTestDatabase(TEST_DATABASE_URL);

  // Applies the committed migrations to the test database before any test runs.
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
