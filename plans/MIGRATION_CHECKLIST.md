# Transaction → Expense Migration Checklist

## Must-Rename (Core Domain)

### Database
| Target | New Name | File |
|--------|----------|------|
| `transactions` table | `expenses` | schema + migration |
| `transactionsTable` | `expensesTable` | src/db/schema.ts |
| `TransactionRow` | `ExpenseRow` | src/db/schema.ts |
| `NewTransactionRow` | `NewExpenseRow` | src/db/schema.ts |
| enum `"transaction"` | `"expense"` | imports/import_duplicates type |

### Queries
| Target | New Name | File |
|--------|----------|------|
| transactions.ts | expenses.ts | src/db/queries/ |
| `listTransactions` | `listExpenses` | expenses.ts |
| `createTransaction` | `createExpense` | expenses.ts |
| `deleteTransactions` | `deleteExpenses` | expenses.ts |
| `updateTransactionCategory` | `updateExpenseCategory` | expenses.ts |
| `bulkUpdateTransactionCategories` | `bulkUpdateExpenseCategories` | expenses.ts |
| `applyRuleToMatchingTransactions` | `applyRuleToMatchingExpenses` | expenses.ts |
| `countTransactionsByDescription` | `countExpensesByDescription` | expenses.ts |
| `TransactionFilters` | `ExpenseFilters` | expenses.ts |
| `TransactionListItem` | `ExpenseListItem` | expenses.ts |
| return key `transactions` | `expenses` | listExpenses |

### Actions
| Target | New Name | File |
|--------|----------|------|
| transactions.ts | expenses.ts | src/lib/actions/ |
| `createTransactionAction` | `createExpenseAction` | expenses.ts |
| `deleteTransactionsAction` | `deleteExpensesAction` | expenses.ts |
| `countMatchingTransactionsAction` | `countMatchingExpensesAction` | expenses.ts |
| `CreateTransactionState` | `CreateExpenseState` | expenses.ts |
| `createTransactionSchema` | `createExpenseSchema` | expenses.ts |
| `deleteTransactionsSchema` | `deleteExpensesSchema` | expenses.ts |
| `txnId`/`txnIds` params | `expenseId`/`expenseIds` | expenses.ts |
| cache tag `"transactions"` | `"expenses"` | all action/query files |

### Components (directory + files)
| Target | New Name |
|--------|----------|
| src/components/transactions/ | src/components/expenses/ |
| add-transaction-dialog.tsx | add-expense-dialog.tsx |
| delete-transaction-dialog.tsx | delete-expense-dialog.tsx |
| transaction-table.tsx | expense-table.tsx |
| transaction-filters.tsx | expense-filters.tsx |
| AddTransactionDialog | AddExpenseDialog |
| DeleteTransactionDialog | DeleteExpenseDialog |
| TransactionTable | ExpenseTable |
| TransactionFilters | ExpenseFilters |
| recent-transactions-card.tsx | recent-expenses-card.tsx |
| recent-transactions-content.tsx | recent-expenses-content.tsx |
| RecentTransactionsCard | RecentExpensesCard |
| RecentTransactionsContent | RecentExpensesContent |
| RecentTransactionsFallback | RecentExpensesFallback |

### Page / Route
| Target | New Name | File |
|--------|----------|------|
| transaction-page-content.tsx | expense-page-content.tsx | app/expenses/_components/ |
| transaction-page-content-skeleton.tsx | expense-page-content-skeleton.tsx | app/expenses/_components/ |
| TransactionPageContent | ExpensePageContent | |
| TransactionPageContentSkeleton | ExpensePageContentSkeleton | |
| TransactionsPage | ExpensesPage | app/expenses/page.tsx |
| AddTransactionDialogLoader | AddExpenseDialogLoader | app/expenses/page.tsx |

### Types
| Target | New Name | File |
|--------|----------|------|
| ValidatedTransactionInput | ValidatedExpenseInput | row-validator.ts |
| deletedTransactionCount | deletedExpenseCount | api.ts, imports.ts |

### Dashboard
| Target | New Name | File |
|--------|----------|------|
| getDashboardRecentTransactions | getDashboardRecentExpenses | dashboard.ts |
| DashboardRecentTransactionItem | DashboardRecentExpenseItem | dashboard.ts |
| transactionCount | expenseCount | dashboard.ts, kpi-cards.tsx |

## Optional / Follow-up (per plan)
- `txnDate` column/field → leave for follow-up
- Variable names `txn`, `transaction` in map callbacks → rename to `expense` where simple

## Exclude (do not rename)
- `db.transaction()` / `tx` — SQL transaction API
- `transaction` in `db.transaction(async (tx) => ...)` — Drizzle API
