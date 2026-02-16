import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categoryRulesTable } from "@/db/schema";

export async function upsertCategoryRule(
  descriptionPattern: string,
  category: string,
) {
  const normalized = descriptionPattern.toLowerCase();

  const existing = await db
    .select({ id: categoryRulesTable.id })
    .from(categoryRulesTable)
    .where(eq(categoryRulesTable.descriptionPattern, normalized))
    .limit(1);

  if (existing[0]) {
    await db
      .update(categoryRulesTable)
      .set({ category })
      .where(eq(categoryRulesTable.id, existing[0].id));
  } else {
    await db.insert(categoryRulesTable).values({
      id: randomUUID(),
      descriptionPattern: normalized,
      category,
    });
  }
}

export async function findCategoryRule(
  description: string,
): Promise<string | null> {
  "use cache";
  cacheLife("max");
  cacheTag("category-rules");

  const normalized = description.toLowerCase();
  const rows = await db
    .select({ category: categoryRulesTable.category })
    .from(categoryRulesTable)
    .where(eq(categoryRulesTable.descriptionPattern, normalized))
    .limit(1);

  return rows[0]?.category ?? null;
}
