import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/permissions";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  upiId: z.string().optional(),
});

export const POST = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();
  const body = await req.json();
  const { name, upiId } = profileSchema.parse(body);

  await db
    .update(users)
    .set({
      name,
      upiId: upiId || null,
    })
    .where(eq(users.id, userId));

  return successResponse({ success: true });
});
