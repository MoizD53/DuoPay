import { NextRequest } from "next/server";
import { errorResponse } from "./api-response";

type ApiHandler<TContext = any> = (req: NextRequest, ctx: TContext) => Promise<Response> | Response;

/**
 * Wraps an API route handler to catch errors and format them consistently.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withApiAuth<TContext = any>(handler: ApiHandler<TContext>) {
  return async (req: NextRequest, ctx: TContext) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
