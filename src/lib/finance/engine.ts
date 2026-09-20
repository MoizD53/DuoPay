import { db } from "@/db";
import { ledgerEntries, expenses, expenseSplits } from "@/db/schema";
import { eq, sum } from "drizzle-orm";

export type SplitInput = {
  userId: string;
  amountMinor: number;
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";
};

/**
 * Validates that the sum of splits exactly matches the total amount.
 * NEVER allow silent rounding or mismatches.
 */
export function validateSplitsExact(totalAmountMinor: number, splits: SplitInput[]) {
  const sumOfSplits = splits.reduce((acc, split) => acc + split.amountMinor, 0);
  
  if (sumOfSplits !== totalAmountMinor) {
    throw new Error(`Split validation failed: total is ${totalAmountMinor} but splits sum to ${sumOfSplits}`);
  }
}

/**
 * Calculates the net balances of all users in a group by summing ledger entries.
 * Positive balance = User is owed money.
 * Negative balance = User owes money.
 */
export async function getGroupBalances(groupId: string): Promise<Record<string, number>> {
  const balances = await db
    .select({
      userId: ledgerEntries.userId,
      netBalance: sum(ledgerEntries.amountMinor),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.groupId, groupId))
    .groupBy(ledgerEntries.userId);

  const result: Record<string, number> = {};
  let totalSystemBalance = 0;

  for (const b of balances) {
    const amount = Number(b.netBalance || 0);
    result[b.userId] = amount;
    totalSystemBalance += amount;
  }

  // System invariant check
  if (totalSystemBalance !== 0) {
    throw new Error(`CRITICAL INTEGRITY ERROR: Group ${groupId} total balance is not 0 (${totalSystemBalance})`);
  }

  return result;
}

type SettlementTransaction = {
  payerId: string;
  receiverId: string;
  amountMinor: number;
};

/**
 * Smart Settlement Engine
 * Minimizes the number of transactions required to settle all debts in a group.
 */
export function calculateSmartSettlements(balances: Record<string, number>): SettlementTransaction[] {
  // Convert into array of debtors and creditors
  const debtors = Object.entries(balances)
    .filter(([_, amount]) => amount < 0)
    .map(([id, amount]) => ({ id, amount: Math.abs(amount) }))
    .sort((a, b) => b.amount - a.amount); // Sort descending

  const creditors = Object.entries(balances)
    .filter(([_, amount]) => amount > 0)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount); // Sort descending

  const settlements: SettlementTransaction[] = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    // The amount to settle is the minimum of what debtor owes and creditor is owed
    const settlementAmount = Math.min(debtor.amount, creditor.amount);

    if (settlementAmount > 0) {
      settlements.push({
        payerId: debtor.id,
        receiverId: creditor.id,
        amountMinor: settlementAmount,
      });
    }

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    // Move pointers if settled
    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}
