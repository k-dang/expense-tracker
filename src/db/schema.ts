import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const importsTable = sqliteTable("imports", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  uploadedAt: integer("uploaded_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  rowCountTotal: integer("row_count_total").notNull(),
  rowCountInserted: integer("row_count_inserted").notNull(),
  rowCountDuplicates: integer("row_count_duplicates").notNull(),
  status: text("status", { enum: ["succeeded", "failed"] }).notNull(),
  errorMessage: text("error_message"),
});

export const transactionsTable = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  txnDate: text("txn_date").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  category: text("category").notNull(),
  currency: text("currency").notNull().default("CAD"),
  fingerprint: text("fingerprint").notNull().unique(),
  importId: text("import_id")
    .notNull()
    .references(() => importsTable.id),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export type ImportRow = typeof importsTable.$inferSelect;
export type NewImportRow = typeof importsTable.$inferInsert;

export const importDuplicatesTable = sqliteTable("import_duplicates", {
  id: text("id").primaryKey(),
  importId: text("import_id")
    .notNull()
    .references(() => importsTable.id),
  txnDate: text("txn_date").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  category: text("category").notNull(),
  currency: text("currency").notNull().default("CAD"),
  fingerprint: text("fingerprint").notNull(),
  reason: text("reason", { enum: ["cross_import", "within_file"] }).notNull(),
});

export type TransactionRow = typeof transactionsTable.$inferSelect;
export type NewTransactionRow = typeof transactionsTable.$inferInsert;

export type ImportDuplicateRow = typeof importDuplicatesTable.$inferSelect;
export type NewImportDuplicateRow = typeof importDuplicatesTable.$inferInsert;

export type ImportStatus = ImportRow["status"];
