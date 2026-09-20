import { NextRequest } from "next/server";
import { db } from "@/db";
import { friendRequests, friendships, users } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { requireAuth } from "@/lib/permissions";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";

export const POST = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();
  const body = await req.json();
  const receiverId = body.receiverId;

  if (!receiverId || receiverId === userId) {
    throw new ApiError(400, "BAD_REQUEST", "Invalid receiver ID");
  }

  // Check if already friends
  const existingFriendship = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, receiverId)),
        and(eq(friendships.userId, receiverId), eq(friendships.friendId, userId))
      )
    )
    .limit(1)
    .then(res => res[0]);

  if (existingFriendship) {
    throw new ApiError(409, "CONFLICT", "Already friends");
  }

  // Check for pending request
  const existingRequest = await db
    .select()
    .from(friendRequests)
    .where(
      or(
        and(eq(friendRequests.senderId, userId), eq(friendRequests.receiverId, receiverId)),
        and(eq(friendRequests.senderId, receiverId), eq(friendRequests.receiverId, userId))
      )
    )
    .limit(1)
    .then(res => res[0]);

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      throw new ApiError(409, "CONFLICT", "Friend request already pending");
    }
  }

  // Create request
  await db.insert(friendRequests).values({
    senderId: userId,
    receiverId,
    status: "PENDING"
  });

  return successResponse({ success: true });
});
