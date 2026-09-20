import { NextRequest } from "next/server";
import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth, requireGroupMember } from "@/lib/permissions";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

const AddMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const currentUserId = await requireAuth();
  const { id } = await params;
  
  await requireGroupMember(currentUserId, id);

  const members = await db.query.groupMembers.findMany({
    where: eq(groupMembers.groupId, id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        }
      }
    }
  });

  return successResponse(members);
});

export const POST = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const currentUserId = await requireAuth();
  const { id } = await params;
  
  // Must be in the group to invite others
  await requireGroupMember(currentUserId, id);

  const body = await req.json();
  const data = AddMemberSchema.parse(body);

  try {
    await db.insert(groupMembers).values({
      groupId: id,
      userId: data.userId,
      role: "MEMBER",
    });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && (err as Record<string, unknown>).code === "23505") { // Unique violation
      return successResponse({ message: "User is already a member" });
    }
    throw err;
  }

  return successResponse({ added: true }, 201);
});
