import { NextRequest } from "next/server";
import { db } from "@/db";
import { friendships, friendRequests, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/permissions";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";

export const GET = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();

  // 1. Get accepted friends
  const friendsList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      image: users.image,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.friendId, users.id))
    .where(eq(friendships.userId, userId));

  // 2. Get incoming pending requests
  const pendingRequests = await db
    .select({
      requestId: friendRequests.id,
      sender: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        image: users.image,
      }
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.senderId, users.id))
    .where(and(eq(friendRequests.receiverId, userId), eq(friendRequests.status, "PENDING")));

  // 3. Get outgoing pending requests
  const sentRequests = await db
    .select({
      requestId: friendRequests.id,
      receiverId: friendRequests.receiverId
    })
    .from(friendRequests)
    .where(and(eq(friendRequests.senderId, userId), eq(friendRequests.status, "PENDING")));

  return successResponse({
    friends: friendsList,
    incomingRequests: pendingRequests,
    sentRequests,
  });
});
