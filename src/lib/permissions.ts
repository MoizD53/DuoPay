import { auth } from "@/auth";
import { db } from "@/db";
import { groupMembers, groups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "./errors";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}

export async function requireGroupMember(userId: string, groupId: string) {
  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.groupId, groupId)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new ForbiddenError("You are not a member of this group");
  }
  return membership[0];
}

export async function requireGroupOwner(userId: string, groupId: string) {
  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1)
    .then((res) => res[0]);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  if (group.createdBy !== userId) {
    throw new ForbiddenError("Only the group creator can perform this action");
  }
  return group;
}
