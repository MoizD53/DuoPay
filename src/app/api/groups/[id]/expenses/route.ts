import { NextRequest } from "next/server";
import { db } from "@/db";
import { expenses, users } from "@/db/schema";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth, requireGroupMember } from "@/lib/permissions";
import { CreateExpenseSchema } from "@/lib/validations/api";
import { createExpense } from "@/services/expenseService";
import { eq, desc } from "drizzle-orm";

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id } = await params;
  
  await requireGroupMember(userId, id);

  const groupExpenses = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amountMinor: expenses.amountMinor,
      currency: expenses.currency,
      createdAt: expenses.createdAt,
      paidBy: users.name,
      status: expenses.status,
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.paidBy, users.id))
    .where(eq(expenses.groupId, id))
    .orderBy(desc(expenses.createdAt));

  return successResponse(groupExpenses);
});

export const POST = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id } = await params;
  
  await requireGroupMember(userId, id);

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    throw new Error("Idempotency-Key header is required");
  }

  const body = await req.json();
  const data = CreateExpenseSchema.parse({ ...body, groupId: id });

  // Ensure user is not pretending to be someone else creating it
  const createdExpense = await createExpense({
    idempotencyKey,
    groupId: id,
    title: data.title,
    amountMinor: data.amountMinor,
    currency: data.currency,
    paidById: data.paidById,
    createdById: userId, // Server authoritative
    notes: data.notes,
    splits: data.splits,
  });

  return successResponse(createdExpense, 201);
});
