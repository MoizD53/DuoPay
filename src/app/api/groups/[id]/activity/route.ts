import { NextRequest } from "next/server";
import { db } from "@/db";
import { ledgerEntries, users } from "@/db/schema";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth, requireGroupMember } from "@/lib/permissions";
import { eq, desc } from "drizzle-orm";

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id } = await params;
  
  await requireGroupMember(userId, id);

  const activities = await db
    .select({
      id: ledgerEntries.id,
      eventType: ledgerEntries.eventType,
      amountMinor: ledgerEntries.amountMinor,
      currency: ledgerEntries.currency,
      createdAt: ledgerEntries.createdAt,
      referenceId: ledgerEntries.referenceId,
      userName: users.name,
    })
    .from(ledgerEntries)
    .innerJoin(users, eq(ledgerEntries.userId, users.id))
    .where(eq(ledgerEntries.groupId, id))
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(50);

  return successResponse({ activities });
});
