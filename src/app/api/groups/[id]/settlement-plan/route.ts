import { NextRequest } from "next/server";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth, requireGroupMember } from "@/lib/permissions";
import { getGroupBalances, calculateSmartSettlements } from "@/lib/finance/engine";

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id } = await params;
  
  await requireGroupMember(userId, id);

  const balances = await getGroupBalances(id);
  const plan = calculateSmartSettlements(balances);

  return successResponse({ plan });
});
