import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DB_URL;
if (!dbUrl) throw new Error("DB_URL is required. Set it in .env");

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: process.env.DB_AUTH_TOKEN,
  },
});
