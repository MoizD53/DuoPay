import { NextRequest } from "next/server";
import { db } from "@/db";
import { friendRequests, friendships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/permissions";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";

export const POST = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();
  const body = await req.json();
  const requestId = body.requestId;

  if (!requestId) {
    throw new ApiError(400, "BAD_REQUEST", "Missing request ID");
  }

  return await db.transaction(async (tx) => {
    // Verify request exists and is directed to the current user
    const request = await tx
      .select()
      .from(friendRequests)
      .where(and(eq(friendRequests.id, requestId), eq(friendRequests.receiverId, userId)))
      .limit(1)
      .then(res => res[0]);

    if (!request || request.status !== "PENDING") {
      throw new ApiError(404, "NOT_FOUND", "Friend request not found or already processed");
    }

    // Mark request as accepted
    await tx
      .update(friendRequests)
      .set({ status: "ACCEPTED" })
      .where(eq(friendRequests.id, requestId));

    // Create bidirectional friendship records
    await tx.insert(friendships).values([
      { userId: request.senderId, friendId: request.receiverId },
      { userId: request.receiverId, friendId: request.senderId }
    ]);

    return successResponse({ success: true });
  });
});
