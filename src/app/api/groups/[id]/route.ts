import { NextRequest } from "next/server";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth, requireGroupMember, requireGroupOwner } from "@/lib/permissions";
import { UpdateGroupSchema } from "@/lib/validations/api";
import { eq } from "drizzle-orm";

export const GET = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id } = await params;
  
  await requireGroupMember(userId, id);

  const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return successResponse(group);
});

export const PATCH = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id } = await params;
  
  await requireGroupOwner(userId, id); // Only owner can edit group details

  const body = await req.json();
  const data = UpdateGroupSchema.parse(body);

  const [updatedGroup] = await db
    .update(groups)
    .set({
      name: data.name,
      description: data.description,
    })
    .where(eq(groups.id, id))
    .returning();

  return successResponse(updatedGroup);
});

export const DELETE = withApiAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const userId = await requireAuth();
  const { id } = await params;
  
  await requireGroupOwner(userId, id); // Only owner can delete group

  // In a real financial app, we might soft-delete or block deletion if balances != 0
  // For simplicity, we just delete. However, due to FK constraints, this would fail 
  // if expenses exist unless CASCADE is set. We'll leave it as is to rely on Postgres to block if expenses exist.
  await db.delete(groups).where(eq(groups.id, id));

  return successResponse({ deleted: true });
});
