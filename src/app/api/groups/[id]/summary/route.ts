import { NextRequest } from "next/server";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth, requireGroupMember } from "@/lib/permissions";
import { db } from "@/db";
import { expenses, expenseSplits, ledgerEntries } from "@/db/schema";
import { eq, and, sum } from "drizzle-orm";

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id: groupId } = await params;
  
  await requireGroupMember(userId, groupId);

  // Total spent in group
  const totalSpentRes = await db
    .select({ total: sum(expenses.amountMinor) })
    .from(expenses)
    .where(eq(expenses.groupId, groupId));
  
  const totalSpent = Number(totalSpentRes[0]?.total || 0);

  // User's true share (sum of exact splits user is part of)
  // We need to join expenseSplits with expenses to filter by group
  const userShareRes = await db
    .select({ total: sum(expenseSplits.amountMinor) })
    .from(expenseSplits)
    .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
    .where(and(eq(expenses.groupId, groupId), eq(expenseSplits.userId, userId)));
    
  const yourShare = Number(userShareRes[0]?.total || 0);

  // Amount user physical paid (sum of expenses where paidBy === user)
  const userPaidRes = await db
    .select({ total: sum(expenses.amountMinor) })
    .from(expenses)
    .where(and(eq(expenses.groupId, groupId), eq(expenses.paidBy, userId)));
    
  const youPaid = Number(userPaidRes[0]?.total || 0);

  // Net Balance from Ledger (should equal youPaid - yourShare + settlements)
  const ledgerRes = await db
    .select({ total: sum(ledgerEntries.amountMinor) })
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.groupId, groupId), eq(ledgerEntries.userId, userId)));
    
  const netBalance = Number(ledgerRes[0]?.total || 0);

  return successResponse({
    totalSpent,
    yourShare,
    youPaid,
    netBalance
  });
});
