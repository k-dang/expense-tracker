import { drizzle } from "drizzle-orm/bun-sqlite";

function requireDbFileName() {
  const dbFileName = process.env.DB_FILE_NAME;
  if (!dbFileName) {
    throw new Error("DB_FILE_NAME is required");
  }
  return dbFileName;
}

export const db = drizzle(requireDbFileName());
