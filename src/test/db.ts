import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

export async function createTestDb() {
  const filePath = join(
    tmpdir(),
    `expense-tracker-test-${randomUUID()}.sqlite`,
  );
  const db = drizzle(pathToFileURL(filePath).toString());
  await migrate(db, { migrationsFolder: "drizzle" });
  return db;
}
