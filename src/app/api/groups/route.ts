import { NextRequest } from "next/server";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { CreateGroupSchema } from "@/lib/validations/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const GET = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();

  // Get all groups where user is a member
  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt,
      role: groupMembers.role,
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));

  return successResponse(userGroups);
});

export const POST = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();
  const body = await req.json();
  
  // Extend schema inline to allow memberIds array
  const parsedData = CreateGroupSchema.and(z.object({
    memberIds: z.array(z.string()).optional()
  })).parse(body);

  const result = await db.transaction(async (tx) => {
    const [group] = await tx.insert(groups).values({
      name: parsedData.name,
      description: parsedData.description,
      createdBy: userId,
    }).returning();

    // Add creator as ADMIN
    await tx.insert(groupMembers).values({
      groupId: group.id,
      userId: userId,
      role: "ADMIN",
    });

    // Add selected friends as MEMBERs
    if (parsedData.memberIds && parsedData.memberIds.length > 0) {
      // Ensure unique members and don't add creator twice
      const uniqueMembers = [...new Set(parsedData.memberIds)].filter(id => id !== userId);
      
      if (uniqueMembers.length > 0) {
        await tx.insert(groupMembers).values(
          uniqueMembers.map(id => ({
            groupId: group.id,
            userId: id,
            role: "MEMBER",
          }))
        );
      }
    }

    return group;
  });

  return successResponse({ group: result }, 201);
});
