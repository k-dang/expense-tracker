import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const dbUrl = process.env.DB_URL;
if (!dbUrl) throw new Error("DB_URL is required. Set it in .env");

const dbAuthToken = process.env.DB_AUTH_TOKEN;
if (dbUrl.startsWith("libsql://") && !dbAuthToken) {
  throw new Error("DB_AUTH_TOKEN is required when DB_URL uses libsql://");
}

const client = createClient(
  dbAuthToken ? { url: dbUrl, authToken: dbAuthToken } : { url: dbUrl },
);

export const db = drizzle(client);
