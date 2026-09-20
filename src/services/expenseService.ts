import { db } from "@/db";
import { expenses, expenseSplits, ledgerEntries, users, groups } from "@/db/schema";
import { validateSplitsExact, SplitInput } from "@/lib/finance/engine";
import { withIdempotency } from "@/lib/db/idempotency";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export type CreateExpenseInput = {
  idempotencyKey: string;
  groupId: string;
  title: string;
  amountMinor: number;
  currency?: string;
  paidById: string;
  createdById: string;
  notes?: string;
  splits: SplitInput[];
};

export async function createExpense(input: CreateExpenseInput) {
  return withIdempotency(input.idempotencyKey, input.createdById, `/api/groups/${input.groupId}/expenses`, async () => {
    // 1. Validate inputs
    validateSplitsExact(input.amountMinor, input.splits);
    
    const currency = input.currency || "INR";

    // 2. Atomic transaction
    const result = await db.transaction(async (tx) => {
      // Create Expense
      const [expense] = await tx.insert(expenses).values({
        groupId: input.groupId,
        title: input.title,
        amountMinor: input.amountMinor,
        currency,
        paidBy: input.paidById,
        createdBy: input.createdById,
        notes: input.notes,
      }).returning();

      // Prepare Splits and Ledger Entries
      const newSplits = input.splits.map(split => ({
        expenseId: expense.id,
        userId: split.userId,
        amountMinor: split.amountMinor,
        splitType: split.splitType,
      }));

      await tx.insert(expenseSplits).values(newSplits);

      const newLedgerEntries = [];
      const timestamp = new Date();

      // Payer gets a credit for the total amount
      newLedgerEntries.push({
        userId: input.paidById,
        groupId: input.groupId,
        amountMinor: input.amountMinor, 
        currency,
        eventType: "EXPENSE_CREATED",
        referenceId: expense.id,
        createdAt: timestamp,
      });

      // Every participant (including payer if they are in split) gets a debit for their split amount
      for (const split of input.splits) {
        newLedgerEntries.push({
          userId: split.userId,
          groupId: input.groupId,
          amountMinor: -split.amountMinor, // Negative for debt
          currency,
          eventType: "EXPENSE_CREATED",
          referenceId: expense.id,
          createdAt: timestamp,
        });
      }

      await tx.insert(ledgerEntries).values(newLedgerEntries);

      return expense;
    });

    return result;
  });
}
