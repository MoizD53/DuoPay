import { db } from "../db";
import { expenses, expenseSplits, ledgerEntries, settlements, idempotencyKeys } from "../db/schema";
import { eq, sum } from "drizzle-orm";

async function main() {
  console.log("🔍 STARTING FINANCIAL RECONCILIATION 🔍\n");

  let hasError = false;

  const allExpenses = await db.select().from(expenses);
  const allSplits = await db.select().from(expenseSplits);
  const allLedger = await db.select().from(ledgerEntries);

  // 1. Every expense's splits equal its amount
  for (const exp of allExpenses) {
    const splits = allSplits.filter(s => s.expenseId === exp.id);
    const totalSplits = splits.reduce((sum, s) => sum + Number(s.amountMinor), 0);
    if (totalSplits !== Number(exp.amountMinor)) {
      console.error(`❌ FAIL: Expense ${exp.id} amount (${exp.amountMinor}) does not match splits sum (${totalSplits})`);
      hasError = true;
    }
  }

  // 2. Group balances sum to zero
  const balancesByGroup: Record<string, number> = {};
  for (const entry of allLedger) {
    balancesByGroup[entry.groupId] = (balancesByGroup[entry.groupId] || 0) + Number(entry.amountMinor);
  }
  for (const [groupId, balance] of Object.entries(balancesByGroup)) {
    if (balance !== 0) {
      console.error(`❌ FAIL: Group ${groupId} balance sum is NOT zero: ${balance}`);
      hasError = true;
    }
  }

  if (!hasError) {
    console.log("✅ PASS: All financial reconciliation checks passed.");
  } else {
    console.log("❌ FAIL: Financial inconsistencies found. Do NOT silently repair.");
  }
  
  process.exit(hasError ? 1 : 0);
}

main().catch(e => {
  console.error("❌ Reconciliation script failed:", e);
  process.exit(1);
});
