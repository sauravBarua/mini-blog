export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://blog:blog@localhost:5432/blog_test';

// The suite truncates tables, so it must never run against a non-test database.
export function assertTestDatabase(url: string): void {
  const databaseName = new URL(url).pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against "${databaseName}": the database name must end with "_test".`,
    );
  }
}
