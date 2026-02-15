import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

function getDbUrl() {
  const url = process.env.DB_URL;
  if (!url) throw new Error("DB_URL is required. Set it in .env");
  return url;
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
