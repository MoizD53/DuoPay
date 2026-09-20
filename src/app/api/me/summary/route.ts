import { NextRequest } from "next/server";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();

  const entries = await db
    .select({ amountMinor: ledgerEntries.amountMinor })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId));

  let youOwe = 0;
  let youAreOwed = 0;

  for (const entry of entries) {
    const amt = Number(entry.amountMinor);
    if (amt > 0) {
      youAreOwed += amt;
    } else {
      youOwe += Math.abs(amt);
    }
  }

  const net = youAreOwed - youOwe;

  return successResponse({
    youOwe,
    youAreOwed,
    net,
    paymentCount: 0 // Mock for now, would require global settlement calculation
  });
});
