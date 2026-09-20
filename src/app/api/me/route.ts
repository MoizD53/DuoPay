import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { UpdateProfileSchema } from "@/lib/validations/api";
import { eq } from "drizzle-orm";

export const GET = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      upiId: users.upiId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return successResponse(user);
});

export const PATCH = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();
  
  const body = await req.json();
  const data = UpdateProfileSchema.parse(body);

  const [updatedUser] = await db
    .update(users)
    .set({
      name: data.name,
      upiId: data.upiId,
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      upiId: users.upiId,
    });

  return successResponse(updatedUser);
});
