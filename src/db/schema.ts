import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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
  type: text("type", { enum: ["expense", "income"] })
    .notNull()
    .default("expense"),
});

export const expensesTable = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  txnDate: text("txn_date").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  category: text("category").notNull(),
  currency: text("currency").notNull().default("CAD"),
  fingerprint: text("fingerprint").notNull().unique(),
  importId: text("import_id").references(() => importsTable.id),
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
  type: text("type", { enum: ["expense", "income"] })
    .notNull()
    .default("expense"),
});

export type ExpenseRow = typeof expensesTable.$inferSelect;
export type NewExpenseRow = typeof expensesTable.$inferInsert;

export type ImportDuplicateRow = typeof importDuplicatesTable.$inferSelect;
export type NewImportDuplicateRow = typeof importDuplicatesTable.$inferInsert;

export type ImportStatus = ImportRow["status"];

export const categoryRulesTable = sqliteTable("category_rules", {
  id: text("id").primaryKey(),
  descriptionPattern: text("description_pattern").notNull().unique(),
  category: text("category").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export type CategoryRuleRow = typeof categoryRulesTable.$inferSelect;
export type NewCategoryRuleRow = typeof categoryRulesTable.$inferInsert;

export const incomesTable = sqliteTable("incomes", {
  id: text("id").primaryKey(),
  incomeDate: text("income_date").notNull(),
  amountCents: integer("amount_cents").notNull(),
  source: text("source").notNull().default("Other"),
  currency: text("currency").notNull().default("CAD"),
  fingerprint: text("fingerprint").notNull().unique(),
  importId: text("import_id").references(() => importsTable.id),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export type IncomeRow = typeof incomesTable.$inferSelect;
export type NewIncomeRow = typeof incomesTable.$inferInsert;

export const portfoliosTable = sqliteTable("portfolios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  baseCurrency: text("base_currency").notNull().default("CAD"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const securitiesTable = sqliteTable("securities", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  companyName: text("company_name").notNull(),
  exchange: text("exchange"),
  currency: text("currency").notNull().default("USD"),
  logoUrl: text("logo_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const portfolioSnapshotsTable = sqliteTable(
  "portfolio_snapshots",
  {
    id: text("id").primaryKey(),
    portfolioId: text("portfolio_id")
      .notNull()
      .references(() => portfoliosTable.id),
    asOfDate: text("as_of_date").notNull(),
    totalMarketValueCents: integer("total_market_value_cents").notNull(),
    source: text("source", { enum: ["manual", "import"] })
      .notNull()
      .default("manual"),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    portfolioIdAsOfDateIdx: index("portfolio_snapshots_portfolio_as_of_idx").on(
      table.portfolioId,
      table.asOfDate,
    ),
  }),
);

export const portfolioSnapshotPositionsTable = sqliteTable(
  "portfolio_snapshot_positions",
  {
    id: text("id").primaryKey(),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => portfolioSnapshotsTable.id),
    securityId: text("security_id")
      .notNull()
      .references(() => securitiesTable.id),
    sharesMicros: integer("shares_micros").notNull(),
    marketValueCents: integer("market_value_cents").notNull(),
    weightBps: integer("weight_bps").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    snapshotSecurityUnique: uniqueIndex(
      "portfolio_snapshot_positions_snapshot_security_unique",
    ).on(table.snapshotId, table.securityId),
    snapshotWeightIdx: index(
      "portfolio_snapshot_positions_snapshot_weight_idx",
    ).on(table.snapshotId, table.weightBps),
  }),
);

export const portfolioImportFilesTable = sqliteTable(
  "portfolio_import_files",
  {
    id: text("id").primaryKey(),
    portfolioId: text("portfolio_id")
      .notNull()
      .references(() => portfoliosTable.id),
    asOfDate: text("as_of_date").notNull(),
    filename: text("filename").notNull(),
    rowCount: integer("row_count").notNull().default(0),
    status: text("status", {
      enum: ["processing", "succeeded", "failed"],
    })
      .notNull()
      .default("processing"),
    errorMessage: text("error_message"),
    uploadedAt: integer("uploaded_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    portfolioDateFilenameUnique: uniqueIndex(
      "portfolio_import_files_portfolio_date_filename_unique",
    ).on(table.portfolioId, table.asOfDate, table.filename),
    portfolioDateIdx: index("portfolio_import_files_portfolio_date_idx").on(
      table.portfolioId,
      table.asOfDate,
    ),
  }),
);

export type PortfolioRow = typeof portfoliosTable.$inferSelect;
export type NewPortfolioRow = typeof portfoliosTable.$inferInsert;

export type SecurityRow = typeof securitiesTable.$inferSelect;
export type NewSecurityRow = typeof securitiesTable.$inferInsert;

export type PortfolioSnapshotRow = typeof portfolioSnapshotsTable.$inferSelect;
export type NewPortfolioSnapshotRow =
  typeof portfolioSnapshotsTable.$inferInsert;

export type PortfolioSnapshotPositionRow =
  typeof portfolioSnapshotPositionsTable.$inferSelect;
export type NewPortfolioSnapshotPositionRow =
  typeof portfolioSnapshotPositionsTable.$inferInsert;

export type PortfolioImportFileRow =
  typeof portfolioImportFilesTable.$inferSelect;
export type NewPortfolioImportFileRow =
  typeof portfolioImportFilesTable.$inferInsert;
