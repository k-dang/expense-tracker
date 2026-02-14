import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DB_URL ?? "file:mydb.sqlite",
    authToken: process.env.DB_AUTH_TOKEN,
  },
});
