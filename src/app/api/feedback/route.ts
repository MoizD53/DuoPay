import { NextRequest } from "next/server";
import { withApiAuth } from "@/lib/api-wrapper";
import { successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { logger } from "@/lib/logger";

export const POST = withApiAuth(async (req: NextRequest) => {
  const userId = await requireAuth();
  const body = await req.json();

  logger.info({
    event: "beta_feedback_submitted",
    userId,
    details: {
      message: body.message,
      type: body.type,
      path: body.path,
    }
  });

  return successResponse({ received: true });
});
