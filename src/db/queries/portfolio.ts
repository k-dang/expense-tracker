import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  portfolioImportFilesTable,
  portfolioSnapshotPositionsTable,
  portfolioSnapshotsTable,
  portfoliosTable,
  securitiesTable,
} from "@/db/schema";
import { parseStrictDate } from "@/lib/date/utils";
import { mergePortfolioPositions } from "@/lib/portfolio-imports/merge-portfolio-positions";
import type { PortfolioImportPositionInput } from "@/lib/portfolio-imports/process-portfolio-import-file";

const DEFAULT_PORTFOLIO_NAME = "My Portfolio";

const requiredIdSchema = z.string().trim().min(1, "Id is required.");

const snapshotPositionInputSchema = z.object({
  symbol: z.string().trim().min(1, "Position symbol is required."),
  companyName: z.string().trim().min(1, "Position companyName is required."),
  exchange: z.string().optional(),
  currency: z.string().optional(),
  logoUrl: z.string().optional(),
  sharesMicros: z
    .number()
    .int("sharesMicros must be a non-negative integer.")
    .min(0, "sharesMicros must be a non-negative integer."),
  marketValueCents: z
    .number()
    .int("marketValueCents must be a non-negative integer.")
    .min(0, "marketValueCents must be a non-negative integer."),
  weightBps: z
    .number()
    .int("weightBps must be an integer between 0 and 10000.")
    .min(0, "weightBps must be an integer between 0 and 10000.")
    .max(10000, "weightBps must be an integer between 0 and 10000."),
  sortOrder: z.number().int().min(0).optional(),
});

type SnapshotPositionInput = z.infer<typeof snapshotPositionInputSchema>;

const mergeImportInputSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required."),
  asOfDate: z.string().trim().min(1, "asOfDate is required."),
  positions: z.array(
    z.object({
      symbol: z.string().trim().min(1),
      companyName: z.string().trim().min(1),
      exchange: z.string().optional(),
      currency: z.string().optional(),
      logoUrl: z.string().optional(),
      sharesMicros: z.number().int().positive(),
      marketValueCents: z.number().int().positive(),
    }),
  ),
  rowCount: z.number().int().positive(),
});

export class DuplicatePortfolioImportError extends Error {
  constructor(
    message = "This file was already imported for this portfolio/date.",
  ) {
    super(message);
    this.name = "DuplicatePortfolioImportError";
  }
}

const upsertSnapshotInputSchema = z
  .object({
    asOfDate: z.string().trim().min(1, "asOfDate is required."),
    source: z.enum(["manual", "import"]).optional(),
    positions: z.array(snapshotPositionInputSchema),
  })
  .superRefine((input, ctx) => {
    const symbols = new Set<string>();
    for (const [index, position] of input.positions.entries()) {
      const normalizedSymbol = position.symbol.trim().toUpperCase();
      if (symbols.has(normalizedSymbol)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["positions", index, "symbol"],
          message: `Duplicate symbol in snapshot payload: ${normalizedSymbol}`,
        });
      }
      symbols.add(normalizedSymbol);
    }

    const totalWeightBps = input.positions.reduce(
      (total, position) => total + position.weightBps,
      0,
    );

    if (input.positions.length > 0 && Math.abs(totalWeightBps - 10000) > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["positions"],
        message: `Snapshot weights must total 10000 bps (+/-1). Received ${totalWeightBps}.`,
      });
    }
  });

function getValidationIssueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid portfolio snapshot input.";
}

export async function getOrCreateDefaultPortfolio() {
  const existing = await db
    .select()
    .from(portfoliosTable)
    .where(eq(portfoliosTable.name, DEFAULT_PORTFOLIO_NAME))
    .limit(1);

  if (existing[0]) return existing[0];

  const id = randomUUID();
  await db.insert(portfoliosTable).values({
    id,
    name: DEFAULT_PORTFOLIO_NAME,
    baseCurrency: "CAD",
  });

  const created = await db
    .select()
    .from(portfoliosTable)
    .where(eq(portfoliosTable.id, id))
    .limit(1);

  if (!created[0]) {
    throw new Error("Failed to create default portfolio.");
  }

  return created[0];
}

export async function getLatestPortfolioSnapshot(portfolioId: string) {
  "use cache";
  cacheLife("max");
  cacheTag("portfolio");

  const parsedPortfolioId = requiredIdSchema.safeParse(portfolioId);
  if (!parsedPortfolioId.success) {
    throw new Error(getValidationIssueMessage(parsedPortfolioId.error));
  }

  const rows = await db
    .select()
    .from(portfolioSnapshotsTable)
    .where(eq(portfolioSnapshotsTable.portfolioId, parsedPortfolioId.data))
    .orderBy(
      desc(portfolioSnapshotsTable.asOfDate),
      desc(portfolioSnapshotsTable.createdAt),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function listSnapshotBreakdown(snapshotId: string) {
  "use cache";
  cacheLife("max");
  cacheTag("portfolio");

  const parsedSnapshotId = requiredIdSchema.safeParse(snapshotId);
  if (!parsedSnapshotId.success) {
    throw new Error(getValidationIssueMessage(parsedSnapshotId.error));
  }

  const rows = await db
    .select({
      snapshotId: portfolioSnapshotPositionsTable.snapshotId,
      securityId: securitiesTable.id,
      symbol: securitiesTable.symbol,
      companyName: securitiesTable.companyName,
      logoUrl: securitiesTable.logoUrl,
      exchange: securitiesTable.exchange,
      currency: securitiesTable.currency,
      sharesMicros: portfolioSnapshotPositionsTable.sharesMicros,
      marketValueCents: portfolioSnapshotPositionsTable.marketValueCents,
      weightBps: portfolioSnapshotPositionsTable.weightBps,
      sortOrder: portfolioSnapshotPositionsTable.sortOrder,
    })
    .from(portfolioSnapshotPositionsTable)
    .innerJoin(
      securitiesTable,
      eq(portfolioSnapshotPositionsTable.securityId, securitiesTable.id),
    )
    .where(
      eq(portfolioSnapshotPositionsTable.snapshotId, parsedSnapshotId.data),
    )
    .orderBy(
      desc(portfolioSnapshotPositionsTable.weightBps),
      portfolioSnapshotPositionsTable.sortOrder,
      securitiesTable.symbol,
    );

  return rows.map((row) => ({
    ...row,
    weightPercent: row.weightBps / 100,
  }));
}

export async function listLatestPortfolioBreakdown() {
  const portfolio = await getOrCreateDefaultPortfolio();
  const latestSnapshot = await getLatestPortfolioSnapshot(portfolio.id);

  if (!latestSnapshot) {
    return {
      portfolio,
      snapshot: null,
      positions: [],
    };
  }

  const positions = await listSnapshotBreakdown(latestSnapshot.id);
  return {
    portfolio,
    snapshot: latestSnapshot,
    positions,
  };
}

export async function upsertSnapshotWithPositions(input: {
  asOfDate: string;
  source?: "manual" | "import";
  positions: SnapshotPositionInput[];
}) {
  const parsedInput = upsertSnapshotInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getValidationIssueMessage(parsedInput.error));
  }

  const validatedInput = parsedInput.data;

  const totalMarketValueCents = validatedInput.positions.reduce(
    (total, position) => total + position.marketValueCents,
    0,
  );

  const portfolio = await getOrCreateDefaultPortfolio();

  return db.transaction(async (tx) => {
    const normalizedSymbols = validatedInput.positions.map((position) =>
      position.symbol.trim().toUpperCase(),
    );

    const existingSecurities =
      normalizedSymbols.length === 0
        ? []
        : await tx
            .select()
            .from(securitiesTable)
            .where(inArray(securitiesTable.symbol, normalizedSymbols));

    const securityBySymbol = new Map(
      existingSecurities.map((security) => [security.symbol, security]),
    );

    for (const position of validatedInput.positions) {
      const symbol = position.symbol.trim().toUpperCase();
      const existingSecurity = securityBySymbol.get(symbol);

      if (!existingSecurity) {
        const id = randomUUID();
        await tx.insert(securitiesTable).values({
          id,
          symbol,
          companyName: position.companyName.trim(),
          exchange: position.exchange?.trim() || null,
          currency: position.currency?.trim().toUpperCase() || "USD",
          logoUrl: position.logoUrl?.trim() || null,
          isActive: true,
        });

        securityBySymbol.set(symbol, {
          id,
          symbol,
          companyName: position.companyName.trim(),
          exchange: position.exchange?.trim() || null,
          currency: position.currency?.trim().toUpperCase() || "USD",
          logoUrl: position.logoUrl?.trim() || null,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        continue;
      }

      await tx
        .update(securitiesTable)
        .set({
          companyName: position.companyName.trim(),
          exchange: position.exchange?.trim() || null,
          currency: position.currency?.trim().toUpperCase() || "USD",
          logoUrl: position.logoUrl?.trim() || null,
          isActive: true,
          updatedAt: Date.now(),
        })
        .where(eq(securitiesTable.id, existingSecurity.id));
    }

    const existingSnapshot = await tx
      .select({ id: portfolioSnapshotsTable.id })
      .from(portfolioSnapshotsTable)
      .where(
        and(
          eq(portfolioSnapshotsTable.portfolioId, portfolio.id),
          eq(portfolioSnapshotsTable.asOfDate, validatedInput.asOfDate),
        ),
      )
      .limit(1);

    const snapshotId = existingSnapshot[0]?.id ?? randomUUID();
    const source = validatedInput.source ?? "manual";

    if (existingSnapshot[0]) {
      await tx
        .update(portfolioSnapshotsTable)
        .set({
          totalMarketValueCents,
          source,
        })
        .where(eq(portfolioSnapshotsTable.id, snapshotId));

      await tx
        .delete(portfolioSnapshotPositionsTable)
        .where(eq(portfolioSnapshotPositionsTable.snapshotId, snapshotId));
    } else {
      await tx.insert(portfolioSnapshotsTable).values({
        id: snapshotId,
        portfolioId: portfolio.id,
        asOfDate: validatedInput.asOfDate,
        totalMarketValueCents,
        source,
      });
    }

    if (validatedInput.positions.length > 0) {
      await tx.insert(portfolioSnapshotPositionsTable).values(
        validatedInput.positions.map((position, index) => {
          const symbol = position.symbol.trim().toUpperCase();
          const security = securityBySymbol.get(symbol);

          if (!security) {
            throw new Error(`Missing security mapping for symbol ${symbol}.`);
          }

          return {
            id: randomUUID(),
            snapshotId,
            securityId: security.id,
            sharesMicros: position.sharesMicros,
            marketValueCents: position.marketValueCents,
            weightBps: position.weightBps,
            sortOrder: position.sortOrder ?? index,
          };
        }),
      );
    }

    return {
      portfolioId: portfolio.id,
      snapshotId,
      totalMarketValueCents,
      positionCount: validatedInput.positions.length,
    };
  });
}

export async function mergeSnapshotPositionsFromImport(input: {
  filename: string;
  asOfDate: string;
  positions: PortfolioImportPositionInput[];
  rowCount: number;
}) {
  const parsedInput = mergeImportInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error(getValidationIssueMessage(parsedInput.error));
  }

  const validatedInput = parsedInput.data;
  if (!parseStrictDate(validatedInput.asOfDate)) {
    throw new Error("asOfDate must be a valid ISO date (YYYY-MM-DD).");
  }

  const portfolio = await getOrCreateDefaultPortfolio();

  const existingImportFile = await db
    .select({ id: portfolioImportFilesTable.id })
    .from(portfolioImportFilesTable)
    .where(
      and(
        eq(portfolioImportFilesTable.portfolioId, portfolio.id),
        eq(portfolioImportFilesTable.asOfDate, validatedInput.asOfDate),
        eq(portfolioImportFilesTable.filename, validatedInput.filename),
      ),
    )
    .limit(1);

  if (existingImportFile[0]) {
    throw new DuplicatePortfolioImportError();
  }

  const importFileId = randomUUID();
  try {
    await db.insert(portfolioImportFilesTable).values({
      id: importFileId,
      portfolioId: portfolio.id,
      asOfDate: validatedInput.asOfDate,
      filename: validatedInput.filename,
      rowCount: validatedInput.rowCount,
      status: "processing",
      errorMessage: null,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      throw new DuplicatePortfolioImportError();
    }

    throw error;
  }

  try {
    const existingSnapshot = await db
      .select({ id: portfolioSnapshotsTable.id })
      .from(portfolioSnapshotsTable)
      .where(
        and(
          eq(portfolioSnapshotsTable.portfolioId, portfolio.id),
          eq(portfolioSnapshotsTable.asOfDate, validatedInput.asOfDate),
        ),
      )
      .limit(1);

    const existingPositions = !existingSnapshot[0]
      ? []
      : await db
          .select({
            symbol: securitiesTable.symbol,
            companyName: securitiesTable.companyName,
            exchange: securitiesTable.exchange,
            currency: securitiesTable.currency,
            logoUrl: securitiesTable.logoUrl,
            sharesMicros: portfolioSnapshotPositionsTable.sharesMicros,
            marketValueCents: portfolioSnapshotPositionsTable.marketValueCents,
          })
          .from(portfolioSnapshotPositionsTable)
          .innerJoin(
            securitiesTable,
            eq(portfolioSnapshotPositionsTable.securityId, securitiesTable.id),
          )
          .where(
            eq(
              portfolioSnapshotPositionsTable.snapshotId,
              existingSnapshot[0].id,
            ),
          );

    const mergedPositions = mergePortfolioPositions({
      existingPositions,
      importedPositions: validatedInput.positions,
    });

    const result = await upsertSnapshotWithPositions({
      asOfDate: validatedInput.asOfDate,
      source: "import",
      positions: mergedPositions.map((position) => ({
        symbol: position.symbol,
        companyName: position.companyName,
        exchange: position.exchange ?? undefined,
        currency: position.currency ?? undefined,
        logoUrl: position.logoUrl ?? undefined,
        sharesMicros: position.sharesMicros,
        marketValueCents: position.marketValueCents,
        weightBps: position.weightBps,
        sortOrder: position.sortOrder,
      })),
    });

    await db
      .update(portfolioImportFilesTable)
      .set({
        status: "succeeded",
        errorMessage: null,
      })
      .where(eq(portfolioImportFilesTable.id, importFileId));

    return {
      ...result,
      importedRows: validatedInput.rowCount,
      mergedSymbols: mergedPositions.length,
    };
  } catch (error) {
    await db
      .update(portfolioImportFilesTable)
      .set({
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Portfolio import failed.",
      })
      .where(eq(portfolioImportFilesTable.id, importFileId));

    if (error instanceof DuplicatePortfolioImportError) {
      throw error;
    }

    throw error;
  }
}

export type LatestPortfolioBreakdown = Awaited<
  ReturnType<typeof listLatestPortfolioBreakdown>
>;
