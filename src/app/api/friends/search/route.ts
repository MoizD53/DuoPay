import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { like, or } from "drizzle-orm";
import { requireAuth } from "@/lib/permissions";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";

export const GET = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return successResponse([]);
  }

  const results = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      avatar: users.avatar,
    })
    .from(users)
    .where(
      or(
        like(users.email, `%${query}%`),
        like(users.name, `%${query}%`)
      )
    )
    .limit(10);

  const safeResults = results.filter(u => u.id !== userId);
  return successResponse(safeResults);
});
