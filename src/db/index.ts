import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

function getDbUrl() {
  return process.env.DB_URL ?? "file:mydb.sqlite";
}

function getDbAuthToken(dbUrl: string) {
  const dbAuthToken = process.env.DB_AUTH_TOKEN;
  if (dbUrl.startsWith("libsql://") && !dbAuthToken) {
    throw new Error("DB_AUTH_TOKEN is required when DB_URL uses libsql://");
  }
  return dbAuthToken;
}

const dbUrl = getDbUrl();
const dbAuthToken = getDbAuthToken(dbUrl);
const client = createClient(
  dbAuthToken ? { url: dbUrl, authToken: dbAuthToken } : { url: dbUrl },
);

export const db = drizzle(client);
