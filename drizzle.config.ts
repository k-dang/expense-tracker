import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  throw new Error("DB_URL is required. Set it in .env.local or .env.");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: process.env.DB_AUTH_TOKEN,
  },
});
