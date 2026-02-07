import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";

export function createTestDb() {
  const db = drizzle(":memory:");
  migrate(db, { migrationsFolder: "drizzle" });
  return db;
}
