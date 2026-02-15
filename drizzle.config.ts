import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local (Next.js convention) then .env
config({ path: ".env.local" });
config({ path: ".env" });

const dbUrl = process.env.DB_URL;
if (!dbUrl) throw new Error("DB_URL is required. Set it in .env or .env.local");

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: process.env.DB_AUTH_TOKEN,
  },
});
